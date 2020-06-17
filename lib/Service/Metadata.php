<?php
namespace OCA\Books\Service;

use Exception;
use SimpleXMLElement;
use OC\Archive\ZIP;

class Metadata {
	public $id;
	public $identifier;
	public $filename;
	public $titles = [];
	public $languages = [];
	public $authors = [];

	public function __construct() {}

	public static function fromEPUB(string $path) : Metadata {
		$zip = new ZIP($path);

		try {
			$container = new SimpleXMLElement($zip->getFile('META-INF/container.xml'));
		} catch (Exception $e) {
			throw new Exception('error parsing container.xml');
		}

		$rootFile = $container->rootfiles->rootfile['full-path'];
		if (empty($rootFile)) {
			throw new Exception('no rootfile declared');
		}

		$package = new SimpleXMLElement($zip->getFile($rootFile));
		$meta = $package->metadata;
		if (!$meta) {
			$meta = $package->children('opf', true)->metadata;
		}
		if (!$meta) {
			throw new Exception('metadata missing');
		}

		$meta = $meta->children('dc', true);
		if (!$meta->identifier) {
			throw new Exception('identifier missing');
		}
		if (!$meta->title) {
			throw new Exception('title missing');
		}
		if (!$meta->language) {
			throw new Exception('language missing');
		}

		$m = new Metadata();
		$m->identifier = $meta->identifier[0];
		$m->titles = $meta->title;
		$m->languages = $meta->language;

		if ($meta->creator) {
			$m->authors = $meta->creator;
		}

		error_log($m->authors[0]);

		return $m;
	}
}