<?php
namespace OCA\Books\Service;

use Exception;
use SimpleXMLElement;
use SQLite3;
use OC\Archive\ZIP;
use OCP\IConfig;
use OCP\Files\FileInfo;
use OCP\Files\Node;

class LibraryService {
	private const DBNAME = 'books.db';

	private $root;
	private $node;
	private $log;

	public function __construct(Node $booksDir, IEventLog $log, IConfig $config) {
		$this->root = $config->getSystemValue('datadirectory');
		$this->node = $booksDir;
		$this->log = $log;
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
			if ($this->writeMetadataEPUB($meta)) {
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
			author text not null,
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

		return $ok;
	}

	public function clear() : bool {
		$db = new SQLite3($this->abs($this->node).$this::DBNAME);
		$db->exec("pragma foreign_keys=ON");
		$db->exec("begin");

		$ok = $db->exec("delete from book")
		&& $db->exec("delete from language");

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
			$data = NULL;

			if ($file->getType() == FileInfo::TYPE_FOLDER) {
				$this->scanDir($file, $metadata);
			} else if (strcasecmp($file->getExtension(), 'epub') == 0) {
				$data = $this->scanMetadataEPUB($this->abs($node).$file->getName());
			}

			if ($data) {
				$metadata[] = $data;
			}
		}
	}

	private function scanMetadataEPUB(string $path) : MetadataEPUB {
		$file = str_replace($this->abs($this->node), '', $path);
		$this->log->info(sprintf('scanning file: "%s"', $file));

		$zip = new ZIP($path);
		try {
			$container = new SimpleXMLElement($zip->getFile('META-INF/container.xml'));
		} catch (Exception $e) {
			$this->log->error(sprintf('error parsing container.xml: "%s"', basename($path)));
			return NULL;
		}

		$rootFile = $container->rootfiles->rootfile['full-path'];
		if (empty($rootFile)) {
			$this->log->error(sprintf('no rootfile declared: "%s"', basename($path)));
			return NULL;
		}

		try {
			$package = new SimpleXMLElement($zip->getFile($rootFile));
		} catch (Exception $e) {
			$this->log->error(sprintf('package document missing: "%s"', basename($path)));
			return NULL;
		}

		try {
			$meta = new MetadataEPUB($package, $file);
		} catch (Exception $e) {
			$this->log->error($e->getMessage());
			return NULL;
		}

		return $meta;
	}

	private function writeMetadataEPUB(MetadataEPUB $meta) : bool {
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

		return true;
	}

	private function abs(Node $node) : string {
		return $this->root.$node->getPath().'/';
	}
}