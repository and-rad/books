<?php
namespace OCA\Books\Controller;

use OCP\IConfig;
use OCP\IL10N;
use OCP\IRequest;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\Files\IRootFolder;

use OCA\Books\Http\EventLog;
use OCA\Books\Http\CoverResponse;
use OCA\Books\Service\LibraryService;

class BookController extends Controller {
	private $userId;
	private $config;
	private $rootFolder;
	private $l;

	public function __construct(
		string $AppName,
		IRequest $request,
		$userId,
		IConfig $config,
		IRootFolder $rootFolder,
		IL10N $l
	) {
		parent::__construct($AppName, $request);
		$this->userId = $userId;
		$this->config = $config;
		$this->rootFolder = $rootFolder;
		$this->l = $l;
	}

	/**
	 * @NoAdminRequired
	 */
	public function index() : JSONResponse {
		$dir = $this->config->getUserValue($this->userId, $this->appName, 'library');
		$root = $this->rootFolder->getUserFolder($this->userId);

		if (!$root->nodeExists($dir)) {
			return new JSONResponse(['success' => false, 'message' => sprintf("directory %s doesn't exist", $lib)]);
		}

		list($books, $ok) = (new LibraryService($root->get($dir), new EventLog(), $this->config))->books();
		$msg = $this->l->t($ok ? 'books.ok' : 'books.err');

		return new JSONResponse(['success' => $ok, 'message' => $msg, 'data' => $books]);
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function cover($id) : CoverResponse {
		$dir = $this->config->getUserValue($this->userId, $this->appName, 'library');
		$root = $this->rootFolder->getUserFolder($this->userId);

		if (!$root->nodeExists($dir)) {
			return new CoverResponse('');
		}

		$data = (new LibraryService($root->get($dir), new EventLog(), $this->config))->cover($id);
		return new CoverResponse($data);
	}

	/**
	 * @NoAdminRequired
	 */
	public function progress(int $id, string $progress) : JSONResponse {
		$dir = $this->config->getUserValue($this->userId, $this->appName, 'library');
		$root = $this->rootFolder->getUserFolder($this->userId);

		if (!$root->nodeExists($dir)) {
			return new JSONResponse(['success' => false, 'message' => sprintf("directory %s doesn't exist anymore", $dir)]);
		}

		if (!(new LibraryService($root->get($dir), new EventLog(), $this->config))->saveProgress($id, $progress)) {
			return new JSONResponse(['success' => false, 'message' => "save failed"]);
		}

		return new JSONResponse(['success' => true, 'message' => 'msg.ok']);
	}
}