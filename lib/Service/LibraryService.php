<?php
namespace OCA\Books\Service;

use Exception;
use SQLite3;
use OCP\IConfig;
use OCP\Files\FileInfo;
use OCP\Files\Node;

class LibraryService {
	private const DBNAME = '.books.db';

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

	public function cover($id) : string {
		$data = '';

		if ($this->node->nodeExists($this::DBNAME)) {
			$db = new SQLite3($this->abs($this->node).$this::DBNAME);
			$stmt = $db->prepare('select cover from cover where book_id=?');
			$stmt->bindValue(1, $id);
			if ($set = $stmt->execute()->fetchArray()) {
				$data = $set['cover'];
			}
			$db->close();
		}

		return $data;
	}

	public function location($id) : string {
		$data = '';

		if ($this->node->nodeExists($this::DBNAME)) {
			$db = new SQLite3($this->abs($this->node).$this::DBNAME);
			$stmt = $db->prepare('select filename from book where id=?');
			$stmt->bindValue(1, $id);
			if ($set = $stmt->execute()->fetchArray()) {
				$data = $set['filename'];
			}
			$db->close();
		}

		return $data;
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
			if ($this->addBook($meta)) {
				$this->log->info(sprintf('added to library: "%s"', $meta->filename));
			}
		}

		$this->node->get($this::DBNAME)->touch();
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

	public function saveProgress(int $id, string $value) : bool {
		if ($this->node->nodeExists($this::DBNAME)) {
			$db = new SQLite3($this->abs($this->node).$this::DBNAME);
			$stmt = $db->prepare('select identifier from progress where identifier=(select identifier from book where id=?)');
			$stmt->bindValue(1, $id);
			$set = $stmt->execute()->fetchArray();

			if ($set === false) {
				$stmt = $db->prepare('insert into progress (identifier,progress,status) values ((select identifier from book where id=?),?,1)');
				$stmt->bindValue(1, $id);
				$stmt->bindValue(2, $value);
			} else {
				$stmt = $db->prepare('update progress set progress=? where identifier=?');
				$stmt->bindValue(1, $value);
				$stmt->bindValue(2, $set['identifier']);
			}

			$res = $stmt->execute();
			$db->close();

			if ($res !== false) {
				$this->node->get($this::DBNAME)->touch();
				return true;
			}
		}
		return false;
	}

	private function readAll(array &$metadata) : bool {
		$db = new SQLite3($this->abs($this->node).$this::DBNAME);

		$res = $db->query('select book_id,title,file_as from title order by id asc');
		while ($set = $res->fetchArray()) {
			$id = $set['book_id'];
			$t = ['name' => $set['title'], 'fileAs' => $set['file_as']];
			$metadata[$id]->id = $id;
			$metadata[$id]->hasCover = false;
			$metadata[$id]->titles[] = (object) $t;
			$metadata[$id]->progress = '';
			$metadata[$id]->status = 0;
		}

		$res = $db->query('select distinct book_id from cover');
		while ($set = $res->fetchArray()) {
			$metadata[$set['book_id']]->hasCover = true;
		}

		$res = $db->query('select language_book.book_id,language.language from language_book left join language on language.id=language_book.language_id order by language_book.id asc');
		while ($set = $res->fetchArray()) {
			$metadata[$set['book_id']]->languages[] = $set['language'];
		}

		$res = $db->query('select author_book.book_id,author.author,author.file_as,author.color from author_book left join author on author.id=author_book.author_id order by author_book.id asc');
		while ($set = $res->fetchArray()) {
			$a = ['name' => $set['author'], 'fileAs' => $set['file_as'], 'color' => $set['color']];
			$metadata[$set['book_id']]->authors[] = (object) $a;
		}

		$res = $db->query('select genre_book.book_id,genre.genre from genre_book left join genre on genre.id=genre_book.genre_id order by genre_book.id asc');
		while ($set = $res->fetchArray()) {
			$metadata[$set['book_id']]->genres[] = $set['genre'];
		}

		$res = $db->query('select series_book.book_id,series_book.position,series.series,series.file_as from series_book left join series on series.id=series_book.series_id');
		while ($set = $res->fetchArray()) {
			$s = ['name' => $set['series'], 'fileAs' => $set['file_as'], 'pos' => $set['position']];
			$metadata[$set['book_id']]->series[] = (object) $s;
		}

		$res = $db->query('select book.id,progress.progress,progress.status from progress left join book on book.identifier=progress.identifier');
		while ($set = $res->fetchArray()) {
			$id = $set['id'];
			if ($metadata[$id]) {
				$metadata[$id]->progress = $set['progress'];
				$metadata[$id]->status = $set['status'];
			}
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
			filename text not null)"
		)
		&& $db->exec("create table if not exists title(
			id integer primary key autoincrement,
			book_id integer not null,
			title text not null,
			file_as text not null,
			foreign key(book_id) references book(id) on delete cascade)"
		)
		&& $db->exec("create table if not exists cover(
			id integer primary key autoincrement,
			cover text not null,
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
			file_as text not null,
			color varchar(15) not null)"
		)
		&& $db->exec("create table if not exists author_book(
			id integer primary key autoincrement,
			author_id integer not null,
			book_id integer not null,
			foreign key(author_id) references author(id) on delete cascade,
			foreign key(book_id) references book(id) on delete cascade)"
		)
		&& $db->exec("create table if not exists genre(
			id integer primary key autoincrement,
			genre text not null unique)"
		)
		&& $db->exec("create table if not exists genre_book(
			id integer primary key autoincrement,
			genre_id integer not null,
			book_id integer not null,
			foreign key(genre_id) references genre(id) on delete cascade,
			foreign key(book_id) references book(id) on delete cascade)"
		)
		&& $db->exec("create table if not exists series(
			id integer primary key autoincrement,
			identifier text not null unique,
			series text not null,
			file_as text not null)"
		)
		&& $db->exec("create table if not exists series_book(
			id integer primary key autoincrement,
			series_id integer not null,
			book_id integer not null,
			position real default 1,
			foreign key(series_id) references series(id) on delete cascade,
			foreign key(book_id) references book(id) on delete cascade)"
		)
		&& $db->exec("create table if not exists progress(
			identifier integer not null,
			progress text default '',
			status integer default 0)"
		);

		$db->exec($ok ? "commit" : "rollback");
		$db->close();
		$this->node->get($this::DBNAME)->touch();

		return $ok;
	}

	public function clear() : bool {
		$db = new SQLite3($this->abs($this->node).$this::DBNAME);
		$db->exec("pragma foreign_keys=ON");
		$db->exec("begin");

		$ok = $db->exec("delete from book")
		&& $db->exec("delete from language")
		&& $db->exec("delete from author")
		&& $db->exec("delete from genre")
		&& $db->exec("delete from series")
		&& $db->exec("delete from progress");

		$db->exec($ok ? "commit" : "rollback");
		$db->close();
		$this->node->get($this::DBNAME)->touch();

		return $ok;
	}

	private function syncRemoved(array $filenames) : bool {
		$db = new SQLite3($this->abs($this->node).$this::DBNAME);
		$db->exec("pragma foreign_keys=ON");

		$names = [];
		$res = $db->query('select filename from book');
		while ($set = $res->fetchArray()) {
			$names[] = $set['filename'];
		}

		$removed = array_values(array_diff($names, $filenames));
		if (count($removed) == 0) {
			return true;
		}

		$vals = array_fill(0, count($removed), '?');
		$query = sprintf('delete from book where filename in (%s)', implode(',', $vals));
		$stmt = $db->prepare($query);
		for ($i = 0; $i < count($removed); $i++) {
			$stmt->bindValue($i+1, $removed[$i]);
		}

		$ok = ($stmt->execute() !== false);
		$db->close();

		return $ok;
	}

	private function scanDir(Node $node, array &$metadata) {
		$files = $node->getDirectoryListing();
		foreach ($files as $file) {
			if (in_array($file->getName(), [$this::DBNAME])) {
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

	private function addBook(Metadata $meta) : bool {
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

		$vals = array_fill(0, count($meta->titles), sprintf('(?,?,%d)',$bookId));
		$query = sprintf('insert into title (title,file_as,book_id) values %s', implode(',', $vals));
		$stmt = $db->prepare($query);
		for ($i = 0; $i < count($meta->titles); $i++) {
			$stmt->bindValue($i*2+1, $meta->titles[$i]->name);
			$stmt->bindValue($i*2+2, $meta->titles[$i]->fileAs);
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

		if ($meta->authors) {
			$vals = array_fill(0, count($meta->authors), sprintf('(?,?,?)'));
			$query = sprintf('insert or ignore into author (author,file_as,color) values %s', implode(',', $vals));
			$stmt = $db->prepare($query);
			for ($i = 0; $i < count($meta->authors); $i++) {
				$stmt->bindValue($i*3+1, $meta->authors[$i]->name);
				$stmt->bindValue($i*3+2, $meta->authors[$i]->fileAs);
				$stmt->bindValue($i*3+3, $meta->authors[$i]->color);
			}
			$stmt->execute();

			$vals = array_fill(0, count($meta->authors), sprintf('((select id from author where author=?),%d)',$bookId));
			$query = sprintf('insert into author_book (author_id,book_id) values %s', implode(',', $vals));
			$stmt = $db->prepare($query);
			for ($i = 0; $i < count($meta->authors); $i++) {
				$stmt->bindValue($i+1, $meta->authors[$i]->name);
			}
			$stmt->execute();
		}

		if ($meta->cover) {
			$stmt = $db->prepare("insert into cover(cover,book_id) values (?,?)");
			$stmt->bindValue(1, $meta->cover);
			$stmt->bindValue(2, $bookId);
			$stmt->execute();
		}

		if ($meta->genres) {
			$vals = array_fill(0, count($meta->genres), sprintf('(?)'));
			$query = sprintf('insert or ignore into genre (genre) values %s', implode(',', $vals));
			$stmt = $db->prepare($query);
			for ($i = 0; $i < count($meta->genres); $i++) {
				$stmt->bindValue($i+1, $meta->genres[$i]);
			}
			$stmt->execute();

			$vals = array_fill(0, count($meta->genres), sprintf('((select id from genre where genre=?),%d)',$bookId));
			$query = sprintf('insert into genre_book (genre_id,book_id) values %s', implode(',', $vals));
			$stmt = $db->prepare($query);
			for ($i = 0; $i < count($meta->genres); $i++) {
				$stmt->bindValue($i+1, $meta->genres[$i]);
			}
			$stmt->execute();
		}

		if ($meta->series) {
			$vals = array_fill(0, count($meta->series), sprintf('(?,?,?)'));
			$query = sprintf('insert or ignore into series (identifier,series,file_as) values %s', implode(',', $vals));
			$stmt = $db->prepare($query);
			for ($i = 0; $i < count($meta->series); $i++) {
				$stmt->bindValue($i*3+1, $meta->series[$i]->identifier);
				$stmt->bindValue($i*3+2, $meta->series[$i]->name);
				$stmt->bindValue($i*3+3, $meta->series[$i]->fileAs);
			}
			$stmt->execute();

			$vals = array_fill(0, count($meta->series), sprintf('((select id from series where identifier=?),%d,?)',$bookId));
			$query = sprintf('insert into series_book (series_id,book_id,position) values %s', implode(',', $vals));
			$stmt = $db->prepare($query);
			for ($i = 0; $i < count($meta->series); $i++) {
				$stmt->bindValue($i*2+1, $meta->series[$i]->identifier);
				$stmt->bindValue($i*2+2, $meta->series[$i]->pos);
			}
			$stmt->execute();
		}

		$db->close();
		return true;
	}

	private function abs(Node $node) : string {
		return $this->root.$node->getPath().'/';
	}
}