<?php
namespace OCA\Books\Service;

use Exception;
use SimpleXMLElement;

class MetadataEPUB {
	public $id;
	public $identifier;
	public $filename;
	public $titles = [];
	public $languages = [];

	public function __construct(SimpleXMLElement $package, string $file) {
		$meta = $package->metadata;
		if (!$meta) {
			$meta = $package->children('opf', true)->metadata;
		}

		$meta = $meta->children('dc', true);
		if (!$meta->identifier) {
			throw new Exception('identifier missing');
		}

		$this->identifier = $meta->identifier[0];
		$this->filename = $file;
		$this->titles = $meta->title;
		$this->languages = $meta->language;
	}
}