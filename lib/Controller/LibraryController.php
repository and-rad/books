<?php
namespace OCA\Alexandria\Controller;

use OCP\IRequest;
use OCP\IConfig;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\Files\IRootFolder;

use OCA\Alexandria\Service\LibraryService;

class LibraryController extends Controller {
	private $userId;
	private $config;
	private $rootFolder;

	public function __construct(
		string $AppName,
		IRequest $request,
		$userId,
		IConfig $config,
		IRootFolder $rootFolder
	) {
		parent::__construct($AppName, $request);
		$this->userId = $userId;
		$this->config = $config;
		$this->rootFolder = $rootFolder;
	}

	/**
	 * @NoAdminRequired
	 *
	 * @param string $dir
	 * @return JSONResponse
	 */
	public function scan(string $dir) {
		$root = $this->rootFolder->getUserFolder($this->userId);
		if (!$root->nodeExists($dir)) {
			return new JSONResponse(['success' => false, 'message' => "directory doesn't exist"]);
		}

		$node = $root->get($dir);
		if ($node->getType() != \OCP\Files\FileInfo::TYPE_FOLDER) {
			return new JSONResponse(['success' => false, 'message' => "not a directory"]);
		}

		if (!$node->isUpdateable()) {
			return new JSONResponse(['success' => false, 'message' => "read-only directory"]);
		}

		$lib = new LibraryService($this->config, $root, $dir);
		if (!$lib->scan()) {
			return new JSONResponse(['success' => false, 'message' => "scan failed"]);
		}

		return new JSONResponse(['success' => true]);
	}
}