<?php
namespace OCA\Books\Http;

use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Response;

class CoverResponse extends Response {
	private $data;

	public function __construct($data, int $statusCode = Http::STATUS_OK) {
		$this->data = base64_decode($data);
		$this->setStatus($statusCode);
		$this->addHeader('Content-type', 'image/jpg');
		$this->cacheFor(30 * 24 * 60 * 60);
		$etag = md5($this->data);
		$this->setETag($etag);
	}

	public function render() : string {
		return $this->data;
	}
}
