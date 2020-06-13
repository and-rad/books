<?php
namespace OCA\Books\Service;

use SimpleXMLElement;

class MetadataEPUB {
	public $id;
	public $identifier;
	public $filename;
	public $titles = [];
	public $languages = [];

	public function __construct(SimpleXMLElement $package, string $file) {
		$meta = $package->metadata->children('dc', true);
		if (count($meta->identifier) == 0) {
			$meta = $package->children('opf', true)->metadata->children('dc', true);
		}

		$this->identifier = $meta->identifier[0];
		$this->filename = $file;
		$this->titles = $meta->title;
		$this->languages = $meta->language;
	}
}