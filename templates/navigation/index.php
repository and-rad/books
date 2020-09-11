<div id='app-navigation-main'>
	<ul id='list-category'>
		<li data-group='author'>
			<a href='#' class='app-navigation-noclose nav-icon-author'><?php p($l->t('authors')); ?></a>
		</li>
		<li data-group='series'>
			<a href='#' class='app-navigation-noclose nav-icon-series'><?php p($l->t('series')); ?></a>
		</li>
		<li data-group='genre'>
			<a href='#' class='app-navigation-noclose nav-icon-genre'><?php p($l->t('genres')); ?></a>
		</li>
		<li data-group='status'>
			<a href='#' class='app-navigation-noclose nav-icon-status'><?php p($l->t('status')); ?></a>
		</li>
		<li data-group='shelf'>
			<a href='#' class='app-navigation-noclose nav-icon-shelf'><?php p($l->t('shelves')); ?></a>
		</li>
	</ul>
	<div id='category'>
		<div data-group='author'>
			<ul>
				<li data-id='all'>
					<a href='#'><?php p($l->t('all')); ?></a><span></span>
				</li>
			</ul>
		</div>
		<div data-group='series'>
			<ul>
				<li data-id='all'>
					<a href='#'><?php p($l->t('all')); ?></a><span></span>
				</li>
			</ul>
		</div>
		<div data-group='genre'>
			<ul>
				<li data-id='all'>
					<a href='#'><?php p($l->t('all')); ?></a><span></span>
				</li>
			</ul>
		</div>
		<div data-group='status'>
			<ul>
				<li data-id='all'>
					<a href='#'><?php p($l->t('all')); ?></a><span></span>
				</li>
			</ul>
		</div>
		<div data-group='shelf'>
			<ul>
				<li data-id='all'>
					<a href='#'><?php p($l->t('all')); ?></a><span></span>
				</li>
			</ul>
		</div>
	</div>
</div>

<div id='app-navigation-toc'>
	<ul></ul>
</div>
