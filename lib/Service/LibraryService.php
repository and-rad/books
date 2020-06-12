<?php
namespace OCA\Alexandria\Service;

use SQLite3;
use OCP\IConfig;
use OCP\Files\Folder;

class LibraryService {
	private const DBNAME = '/books.db';

	private $rootFolder;
	private $dir;
	private $dbPath;

	public function __construct(IConfig $config, Folder $rootFolder, $dir) {
		$node = $rootFolder->get($dir);
		$this->dbPath = $config->getSystemValue('datadirectory').$node->getPath().$this::DBNAME;
		$this->rootFolder = $rootFolder;
		$this->dir = $dir;
	}

	/**
	 * @return bool
	 */
	public function scan() {
		if (!$this->rootFolder->nodeExists($this->dir.$this::DBNAME)) {
			if (!$this->create()) {
				return false;
			}
		}

		$this->rootFolder->get($this->dir.$this::DBNAME)->touch();
		return true;
	}

	/**
	 * @return bool
	 */
	private function create() {
		$db = new SQLite3($this->dbPath);
		$db->exec("pragma foreign_keys=ON");
		$db->exec("begin");

		$ok = $db->exec("create table if not exists book(
			id integer primary key autoincrement,
			identifier text not null,
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
			language text not null)"
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
		$this->rootFolder->get($this->dir.$this::DBNAME)->touch();

		return $ok;
	}
}