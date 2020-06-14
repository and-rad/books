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
		if (!$meta) {
			throw new Exception(sprintf('metadata missing in file "%s"', $file));
		}

		$meta = $meta->children('dc', true);
		if (!$meta->identifier) {
			throw new Exception(sprintf('identifier missing in file "%s"', $file));
		}
		if (!$meta->title) {
			throw new Exception(sprintf('title missing in file "%s"', $file));
		}
		if (!$meta->language) {
			throw new Exception(sprintf('language missing in file "%s"', $file));
		}

		$this->identifier = $meta->identifier[0];
		$this->filename = $file;
		$this->titles = $meta->title;
		$this->languages = $meta->language;
	}
}