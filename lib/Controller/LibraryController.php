<?php
namespace OCA\Books\Controller;

use OC;
use OCP\IRequest;
use OCP\IConfig;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\Files\IRootFolder;

use OCA\Books\Http\EventLog;
use OCA\Books\Service\LibraryService;

class LibraryController extends Controller {
	private $userId;
	private $config;
	private $rootFolder;
	private $eventSource;

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
		$this->eventSource = OC::$server->createEventSource();
	}

	/**
	 * @NoAdminRequired
	 */
	public function scan(string $dir) : JSONResponse {
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

		if (substr($dir, 0, 1) != '/') {
			$dir = '/'.$dir;
		}
		if (substr($dir, -1, 1) != '/') {
			$dir = $dir.'/';
		}

		$this->config->setUserValue($this->userId, $this->appName, 'library', $dir);

		if (!(new LibraryService($node, new EventLog(), $this->config))->scan($this->eventSource)) {
			$this->eventSource->send('done',['success' => false, 'message' => 'Scan failed']);
		} else {
			$this->eventSource->send('done',['success' => true, 'message' => 'Scan completed']);
		}

		$this->eventSource->close();
		return new JSONResponse();
	}

	/**
	 * @NoAdminRequired
	 */
	public function reset() : JSONResponse {
		$lib = $this->config->getUserValue($this->userId, $this->appName, 'library');
		$root = $this->rootFolder->getUserFolder($this->userId);

		if (!$root->nodeExists($lib)) {
			return new JSONResponse(['success' => false, 'message' => sprintf("directory %s doesn't exist anymore", $lib)]);
		}

		if (!(new LibraryService($root->get($lib), new EventLog(), $this->config))->reset()) {
			return new JSONResponse(['success' => false, 'message' => "reset failed"]);
		}

		return new JSONResponse(['success' => true, 'message' => 'Library reset done']);
	}
}