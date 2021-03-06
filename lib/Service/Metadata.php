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

	public $cover;
	public $identifier;
	public $filename;
	public $description;
	public $titles = [];
	public $languages = [];
	public $authors = [];
	public $genres = [];
	public $series = [];

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

		$package = new SimpleXMLElement($zip->getFile($rootFile), LIBXML_PARSEHUGE);
		$metadata = $package->metadata;
		if (!$metadata) {
			$metadata = $package->children('opf', true)->metadata;
		}
		if (!$metadata) {
			throw new Exception('metadata missing');
		}

		$manifest = $package->manifest;
		if (!$manifest) {
			throw new Exception('manifest missing');
		}

		// mandatory metadata
		$dc = $metadata->children('dc', true);
		if (!$dc->identifier) {
			throw new Exception('identifier missing');
		}
		if (!$dc->title) {
			throw new Exception('title missing');
		}
		if (!$dc->language) {
			throw new Exception('language missing');
		}

		$meta = new Metadata();
		$meta->identifier = $dc->identifier[0];
		$meta->languages = $dc->language;

		// mandatory: titles
		for ($i = 0; $i < count($dc->title); $i++) {
			$meta->titles[$i]->name = (string)$dc->title[$i];
			$meta->titles[$i]->fileAs = $meta->titles[$i]->name;

			if ($id = (string)$dc->title[$i]->attributes()['id']) {
				foreach($metadata->meta as $m) {
					if ($m['refines'] == '#'.$id && $m['property'] == 'file-as') {
						$meta->titles[$i]->fileAs = (string)$m;
					}
				}
			}
		}

		// optional: authors
		if ($dc->creator) {
			for ($i = 0; $i < count($dc->creator); $i++) {
				$meta->authors[$i]->name = (string)$dc->creator[$i];
				$meta->authors[$i]->fileAs = $meta->authors[$i]->name;
				$meta->authors[$i]->color = self::COLORS[rand(0,count(self::COLORS)-1)];

				if ($id = (string)$dc->creator[$i]->attributes()['id']) {
					foreach($metadata->meta as $m) {
						if ($m['refines'] == '#'.$id && $m['property'] == 'file-as') {
							$meta->authors[$i]->fileAs = (string)$m;
						}
					}
				}
			}
		}

		// optional: cover file
		$filename = '';
		$coverid = '';
		foreach($metadata->meta as $m) {
			if ($m['name'] == 'cover') {
				$coverid = (string)$m['content'];
			}
		}
		foreach ($manifest->item as $item) {
			if ((string)$item['properties'] == 'cover-image') {
				$filename = $item['href'];
				break;
			}

			if ($coverid != '' && (string)$item['id'] == $coverid) {
				$filename = $item['href'];
				break;
			}
		}

		if ($filename != '') {
			$filename = dirname($rootFile).'/'.$filename;
			$parts = explode('/', $filename);

			$cutoff = 0;
			for ($i = 0; $i < count($parts); $i++) {
				if ($parts[$i] == '.') {
					continue;
				}
				if ($parts[$i] == '..') {
					$cutoff--;
					continue;
				}
				$parts[$cutoff] = $parts[$i];
				$cutoff++;
			}

			$filename = implode('/', array_slice($parts, 0, $cutoff));
			if ($zip->fileExists($filename)) {
				$meta->cover = $zip->getFile($filename);
			}
		}

		// optional: genre
		$meta->genres = $dc->subject;

		// optional: description
		if ($dc->description) {
			$meta->description = (string)$dc->description[0];
		}

		// optional: series
		$series = [];
		foreach($metadata->meta as $m) {
			if ($m['property'] == 'belongs-to-collection') {
				if ($id = (string)$m['id']) {
					$series[$id]->identifier = $id;
					$series[$id]->name = (string) $m;
					$series[$id]->fileAs = (string) $m;
				}
			}
		}
		foreach($metadata->meta as $m) {
			if ($m['property'] == 'group-position') {
				$id = str_replace('#', '', $m['refines']);
				if (isset($series[$id])) {
					$series[$id]->pos = (float) $m;
				}
			} else if ($m['property'] == 'file-as') {
				$id = str_replace('#', '', $m['refines']);
				if (isset($series[$id])) {
					$series[$id]->fileAs = (string) $m;
				}
			}
		}
		$meta->series = array_values($series);

		return $meta;
	}
}