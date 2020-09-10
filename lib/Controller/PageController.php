<?php
namespace OCA\Books\Controller;

use OCP\IConfig;
use OCP\IRequest;
use OCP\AppFramework\Http\ContentSecurityPolicy;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\TemplateResponse;
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
	public function index() : TemplateResponse {
		return (new TemplateResponse('books', 'index'))
		->setContentSecurityPolicy((new ContentSecurityPolicy())
			->addAllowedStyleDomain('blob:')
			->addAllowedFontDomain('blob:')
			->addAllowedScriptDomain('blob:')
		);
	}

	/**
	 * @NoAdminRequired
	 */
	public function config() : JSONResponse {
		$lib = $this->config->getUserValue($this->userId, $this->appName, 'library');

		return new JSONResponse([
			'library' => $lib,
			'remote' => '/remote.php/webdav'.$lib,
		]);
	}
}
