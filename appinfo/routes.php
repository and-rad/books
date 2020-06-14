<?php
/**
 * Create your routes in here. The name is the lowercase name of the controller
 * without the controller part, the stuff after the hash is the method.
 * e.g. page#index -> OCA\Books\Controller\PageController->index()
 */
return [
	'routes' => [
		['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
		['name' => 'book#index', 'url' => '/api/0.1/books', 'verb' => 'GET'],
		['name' => 'library#scan', 'url' => '/api/0.1/scan', 'verb' => 'POST'],
		['name' => 'library#reset', 'url' => '/api/0.1/reset', 'verb' => 'POST'],
	]
];
