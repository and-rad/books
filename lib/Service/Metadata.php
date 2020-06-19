<?php
namespace OCA\Books\Service;

use Exception;
use SimpleXMLElement;
use OC\Archive\ZIP;

class Metadata {
	private const COLORS = [
		'#db5343','#e91e63','#ab47bc','#f44336',
		'#673ab7','#3f51b5','#1793d1','#00bcd4',
		'#009688','#4caf50','#8bc34a','#cddc39',
		'#ffd54f','#ffc107','#ff9800','#ff5722',
		'#795548','#9e9e9e','#607d8b','#424242',
	];

	public $id;
	public $hasCover;

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
			for ($i = 0; $i < count($meta->creator); $i++) {
				$m->authors[$i]->name = $meta->creator[$i];
				$m->authors[$i]->color = Metadata::COLORS[rand(0,count(Metadata::COLORS)-1)];
			}
		}

		return $m;
	}
}