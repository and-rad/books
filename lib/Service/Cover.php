<?php
namespace OCA\Books\Service;


use Exception;
use SimpleXMLElement;
use OC\Archive\ZIP;

class Cover {
	private const TYPE_EPUB = 0;
	private $type;
	private $path;
	private $hash;
	private $ext;

	private $epubCoverInternal;

	public $data;

	private function __construct($type, $path) {
		$this->type = $type;
		$this->path = $path;
		$this->hash = bin2hex(random_bytes(8));
	}

	public static function fromEPUB(string $path) : Cover {
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
		$manifest = $package->manifest;
		if (!$manifest) {
			throw new Exception('manifest missing');
		}

		$filename = '';
		foreach ($manifest->item as $item) {
			$p = $item['properties'];
			if ($p && strpos($p, 'cover-image') !== false) {
				$filename = $item['href'];
				break;
			}

			$id = $item['id'];
			if ($id == 'cover') {
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
			if (!$zip->fileExists($filename)) {
				throw new Exception(sprintf('cover file %s not found', $filename));
			}
		}

		$cover = new Cover(Cover::TYPE_EPUB, $path);
		$cover->epubCoverInternal = $filename;
		$cover->ext = pathinfo($filename, PATHINFO_EXTENSION);
		$cover->data = base64_encode($zip->getFile($filename));

		return $cover;
	}

	public function save(string $dir) : bool {
		if ($this->type == $this::TYPE_EPUB && $this->epubCoverInternal != '') {
			$zip = new ZIP($this->path);
			return ($zip->extractFile($this->epubCoverInternal, $dir.'/'.$this->filename()) === NULL);
		}
		return false;
	}

	public function filename() : string {
		return $this->hash.'.'.$this->ext;
	}

	public function exists() : bool {
		if ($this->type == $this::TYPE_EPUB) {
			return $this->epubCoverInternal != '';
		}
		return false;
	}
}