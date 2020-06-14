<?php
namespace OCA\Books\Controller;

use OCP\IConfig;
use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;

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
	public function index() {
		$lib = $this->config->getUserValue($this->userId, $this->appName, 'library');

		return new TemplateResponse('books', 'index', [
			'library' => $lib,
		]);
	}
}
