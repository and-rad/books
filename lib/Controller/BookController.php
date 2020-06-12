<?php
namespace OCA\Books\Controller;

use OCP\IRequest;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;

class BookController extends Controller {
	public function __construct(string $AppName, IRequest $request) {
		parent::__construct($AppName, $request);
	}

	/**
	 * @NoAdminRequired
	 *
	 * @return JSONResponse
	 */
	public function index() {
		return new JSONResponse([]);
	}
}