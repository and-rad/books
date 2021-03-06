<?php
namespace OCA\Books\Http;

use OCP\Util;
use OCA\Books\Service\IEventLog;

class EventLog implements IEventLog {
	public function info(string $msg) {
		error_log($msg);
	}

	public function warn(string $msg) {
		$this->info($msg);
	}

	public function error(string $msg) {
		Util::writeLog('books', $msg, Util::ERROR);
		$this->info($msg);
	}
}