<?php
namespace OCA\Books\Http;

use OCA\Books\Service\IEventLog;

class EventLog implements IEventLog {
	public function info(string $msg) {
		error_log($msg);
	}

	public function warn(string $msg) {
		$this->info();
	}

	public function error(string $msg) {
		$this->info();
	}
}