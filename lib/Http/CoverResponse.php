<?php
namespace OCA\Books\Http;

use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Response;

class CoverResponse extends Response {
	private $data;

	public function __construct($data, int $statusCode = Http::STATUS_OK) {
		$this->data = $data;
		$this->setStatus($statusCode);
		$this->addHeader('Content-type', 'image/jpg');
		$this->cacheFor(30 * 24 * 60 * 60);
		$this->setETag(md5($this->data));
	}

	public function render() : string {
		return $this->data;
	}
}
