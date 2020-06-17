<?php
namespace OCA\Books\Controller;

use OCP\IConfig;
use OCP\IRequest;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Controller;

use OCA\Books\Service\LibraryService;

class PageController extends Controller {
	private $userId;
	private $config;

	public function __construct($AppName, IRequest $request, $UserId, IConfig $config){
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
		$this->config = $config;
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index() : TemplateResponse {
		$lib = $this->config->getUserValue($this->userId, $this->appName, 'library');

		return new TemplateResponse('books', 'index', [
			'library' => $lib,
		]);
	}

	/**
	 * @NoAdminRequired
	 */
	public function config() : JSONResponse {
		$lib = $this->config->getUserValue($this->userId, $this->appName, 'library');
		$coverURL = sprintf('/remote.php/dav/files/%s/%s/%s', $this->userId, $lib, LibraryService::CACHEDIR);

		return new JSONResponse([
			'library' => $lib,
			'coverUrl' => $coverURL,
		]);
	}
}
