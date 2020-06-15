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

	public function __construct() {}

	public static function fromXML(SimpleXMLElement $package, string $file) : MetadataEPUB {
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

		$m = new MetadataEPUB();
		$m->identifier = $meta->identifier[0];
		$m->filename = $file;
		$m->titles = $meta->title;
		$m->languages = $meta->language;

		return $m;
	}
}