<?php
namespace OCA\Books\Service;

interface IEventLog {
	public function info(string $msg);
	public function warn(string $msg);
	public function error(string $msg);
}