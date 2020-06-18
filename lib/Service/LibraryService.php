<?php
namespace OCA\Books\Service;

use Exception;
use SQLite3;
use OCP\IConfig;
use OCP\Files\FileInfo;
use OCP\Files\Node;

class LibraryService {
	private const DBNAME = '.books.db';
	public const CACHEDIR = '.cover-cache';

	private $root;
	private $node;
	private $log;

	public function __construct(Node $booksDir, IEventLog $log, IConfig $config) {
		$this->root = $config->getSystemValue('datadirectory');
		$this->node = $booksDir;
		$this->log = $log;
	}

	public function books() : array {
		if (!$this->node->nodeExists($this::DBNAME)) {
			return [[], true];
		}

		$metadata = [];
		if ($this->readAll($metadata)) {
			return [array_values($metadata), true];
		}

		return [[], false];
	}

	public function scan() : bool {
		if (!$this->node->nodeExists($this::DBNAME)) {
			if (!$this->create()) {
				return false;
			}
		}

		$metadata = [];
		$this->scanDir($this->node, $metadata);
		if (!$this->syncRemoved(array_column($metadata, 'filename'))) {
			$this->log->error('filename sync failed');
			return false;
		}

		foreach ($metadata as $meta) {
			if ($this->writeMetadata($meta)) {
				$this->cacheCover($meta->filename);
				$this->log->info(sprintf('added to library: "%s"', $meta->filename));
			}
		}

		$this->node->get($this::DBNAME)->touch();
		$this->node->get($this::CACHEDIR)->touch();

		return true;
	}

	public function reset() : bool {
		if (!$this->node->nodeExists($this::DBNAME)) {
			return $this->create();
		}

		if ($this->clear()) {
			$this->node->get($this::DBNAME)->touch();
			return true;
		}

		return false;
	}

	private function readAll(array &$metadata) : bool {
		$db = new SQLite3($this->abs($this->node).$this::DBNAME);

		$res = $db->query('select book.id,title.title,book.cover from book left join title on book.id=title.book_id order by title.id asc');
		while ($set = $res->fetchArray()) {
			$id = $set['id'];
			$metadata[$id]->id = $id;
			$metadata[$id]->titles[] = $set['title'];
			$metadata[$id]->cover = $set['cover'];
		}

		$res = $db->query('select language_book.book_id,language.language from language_book left join language on language.id=language_book.language_id order by language_book.id asc');
		while ($set = $res->fetchArray()) {
			$metadata[$set['book_id']]->languages[] = $set['language'];
		}

		$res = $db->query('select author_book.book_id,author.author from author_book left join author on author.id=author_book.author_id order by author_book.id asc');
		while ($set = $res->fetchArray()) {
			$metadata[$set['book_id']]->authors[] = $set['author'];
		}

		$db->close();
		return true;
	}

	private function create() : bool {
		error_log("creating database...");

		$db = new SQLite3($this->abs($this->node).$this::DBNAME);
		$db->exec("pragma foreign_keys=ON");
		$db->exec("begin");

		$ok = $db->exec("create table if not exists book(
			id integer primary key autoincrement,
			identifier text not null unique,
			filename text not null,
			cover varchar(127) default '')"
		)
		&& $db->exec("create table if not exists title(
			id integer primary key autoincrement,
			title text not null,
			book_id integer not null,
			foreign key(book_id) references book(id) on delete cascade)"
		)
		&& $db->exec("create table if not exists language(
			id integer primary key autoincrement,
			language text not null unique)"
		)
		&& $db->exec("create table if not exists language_book(
			id integer primary key autoincrement,
			language_id integer not null,
			book_id integer not null,
			foreign key(language_id) references language(id) on delete restrict,
			foreign key(book_id) references book(id) on delete cascade)"
		)
		&& $db->exec("create table if not exists author(
			id integer primary key autoincrement,
			author text not null unique,
			file_as text not null)"
		)
		&& $db->exec("create table if not exists author_book(
			id integer primary key autoincrement,
			author_id integer not null,
			book_id integeer not null,
			foreign key(author_id) references author(id) on delete cascade,
			foreign key(book_id) references book(id) on delete cascade)"
		);

		$db->exec($ok ? "commit" : "rollback");
		$db->close();
		$this->node->get($this::DBNAME)->touch();

		if (!$this->node->nodeExists($this::CACHEDIR)) {
			$this->node->newFolder($this::CACHEDIR);
		}

		return $ok;
	}

	public function clear() : bool {
		$db = new SQLite3($this->abs($this->node).$this::DBNAME);
		$db->exec("pragma foreign_keys=ON");
		$db->exec("begin");

		$ok = $db->exec("delete from book")
		&& $db->exec("delete from language")
		&& $db->exec("delete from author");

		$db->exec($ok ? "commit" : "rollback");
		$db->close();
		$this->node->get($this::DBNAME)->touch();

		if ($this->node->nodeExists($this::CACHEDIR)) {
			$this->node->get($this::CACHEDIR)->delete();
			$this->node->newFolder($this::CACHEDIR);
		}

		return $ok;
	}

	private function syncRemoved(array $filenames) : bool {
		$db = new SQLite3($this->abs($this->node).$this::DBNAME);
		$db->exec("pragma foreign_keys=ON");

		$data = [];
		$res = $db->query('select filename,cover from book');
		while ($set = $res->fetchArray()) {
			$data[$set['filename']] = $set['cover'];
		}

		foreach ($filenames as $f) {
			unset($data[$f]);
		}

		$names = array_keys($data);
		if (count($names) == 0) {
			return true;
		}

		$vals = array_fill(0, count($names), '?');
		$query = sprintf('delete from book where filename in (%s)', implode(',', $vals));
		$stmt = $db->prepare($query);
		for ($i = 0; $i < count($names); $i++) {
			$stmt->bindValue($i+1, $names[$i]);
		}

		$ok = ($stmt->execute() !== false);
		$db->close();

		$covers = array_filter(array_values($data), function($val) { return $val != ''; });
		$cache = $this->node->get($this::CACHEDIR);
		foreach ($covers as $cover) {
			$cache->get($cover)->delete();
		}

		return $ok;
	}

	private function scanDir(Node $node, array &$metadata) {
		$files = $node->getDirectoryListing();
		foreach ($files as $file) {
			if (in_array($file->getName(), [$this::DBNAME, $this::CACHEDIR])) {
				continue;
			}

			$path = $this->abs($node).$file->getName();
			$name = str_replace($this->abs($this->node), '', $path);
			$data = NULL;

			$this->log->info(sprintf('scanning "%s"', $name));

			if ($file->getType() == FileInfo::TYPE_FOLDER) {
				$this->scanDir($file, $metadata);
			} else if (strcasecmp($file->getExtension(), 'epub') == 0) {
				$data = $this->scanMetadataEPUB($path);
			}

			if ($data) {
				$data->filename = $name;
				$metadata[] = $data;
			}
		}
	}

	private function scanMetadataEPUB(string $path) : ?Metadata {
		try {
			$meta = Metadata::fromEPUB($path);
		} catch (Exception $e) {
			$this->log->error(sprintf('"%s": %s', basename($path), $e->getMessage()));
			return NULL;
		}

		return $meta;
	}

	private function writeMetadata(Metadata $meta) : bool {
		$db = new SQLite3($this->abs($this->node).$this::DBNAME);
		$db->exec("pragma foreign_keys=ON");

		$stmt = $db->prepare("insert into book(identifier,filename)values(:id,:fn)");
		$stmt->bindValue(':id', $meta->identifier);
		$stmt->bindValue(':fn', $meta->filename);
		if ($stmt->execute() === false) {
			$db->close();
			return false;
		}

		$bookId = $db->lastInsertRowID();

		$vals = array_fill(0, count($meta->titles), sprintf('(?,%d)',$bookId));
		$query = sprintf('insert into title (title,book_id) values %s', implode(',', $vals));
		$stmt = $db->prepare($query);
		for ($i = 0; $i < count($meta->titles); $i++) {
			$stmt->bindValue($i+1, $meta->titles[$i]);
		}
		$stmt->execute();

		$vals = array_fill(0, count($meta->languages), sprintf('(?)'));
		$query = sprintf('insert or ignore into language (language) values %s', implode(',', $vals));
		$stmt = $db->prepare($query);
		for ($i = 0; $i < count($meta->languages); $i++) {
			$stmt->bindValue($i+1, $meta->languages[$i]);
		}
		$stmt->execute();

		$vals = array_fill(0, count($meta->languages), sprintf('((select id from language where language=?),%d)',$bookId));
		$query = sprintf('insert into language_book (language_id,book_id) values %s', implode(',', $vals));
		$stmt = $db->prepare($query);
		for ($i = 0; $i < count($meta->languages); $i++) {
			$stmt->bindValue($i+1, $meta->languages[$i]);
		}
		$stmt->execute();

		$vals = array_fill(0, count($meta->authors), sprintf('(?,?)'));
		$query = sprintf('insert or ignore into author (author,file_as) values %s', implode(',', $vals));
		$stmt = $db->prepare($query);
		for ($i = 0; $i < count($meta->authors); $i+=2) {
			$stmt->bindValue($i+1, $meta->authors[$i]);
			$stmt->bindValue($i+2, $meta->authors[$i]);
		}
		$stmt->execute();

		$vals = array_fill(0, count($meta->authors), sprintf('((select id from author where author=?),%d)',$bookId));
		$query = sprintf('insert into author_book (author_id,book_id) values %s', implode(',', $vals));
		$stmt = $db->prepare($query);
		for ($i = 0; $i < count($meta->authors); $i++) {
			$stmt->bindValue($i+1, $meta->authors[$i]);
		}
		$stmt->execute();

		return true;
	}

	private function cacheCover(string $filename) : bool {
		$path = $this->abs($this->node).$filename;
		$cover = NULL;

		try {
			switch(pathinfo($filename, PATHINFO_EXTENSION)) {
				case 'epub':
					$cover = Cover::fromEPUB($path);
					break;
			}
		} catch (Exception $e) {
			$this->log->error(sprintf('"%s": %s', basename($filename), $e->getMessage()));
			return false;
		}

		if (!$cover->exists()) {
			return true;
		}

		if ($cover->save($this->abs($this->node).$this::CACHEDIR)) {
			$db = new SQLite3($this->abs($this->node).$this::DBNAME);
			$stmt = $db->prepare("update book set cover=? where filename=?");
			$stmt->bindValue(1, $cover->filename());
			$stmt->bindValue(2, $filename);
			$ok = ($stmt->execute() !== false);
			$db->close();
			return $ok;
		}

		return false;
	}

	private function abs(Node $node) : string {
		return $this->root.$node->getPath().'/';
	}
}