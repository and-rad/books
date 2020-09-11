<div id='app-sidebar' class='hidden'>
	<header>
		<a href='#' class='icon-close'></a>
		<h1><?php p($l->t('sidebar-head')); ?></h1>
		<nav class='tabbar'>
			<a href='#'><?php p($l->t('sidebar-details')); ?></a>
			<a href='#'><?php p($l->t('sidebar-meta')); ?></a>
			<a href='#'><?php p($l->t('sidebar-editor')); ?></a>
		</nav>
	</header>
	<div class='tabcontent'>
		<div id='app-sidebar-details' class='hidden'>
			<section>
				<p class='title'></p>
				<p class='author'></p>
				<figure><img alt='Cover'></figure>
				<p class='description'></p>
			</section>
			<section>
				<div class='row'>
					<label><?php p($l->t('status')); ?></label>
					<select class='status'>
						<option value='0'><?php p($l->t('status-0')); ?></option>
						<option value='1'><?php p($l->t('status-1')); ?></option>
						<option value='2'><?php p($l->t('status-2')); ?></option>
						<option value='3'><?php p($l->t('status-3')); ?></option>
					</select>
				</div>
				<div class='row'>
					<label><?php p($l->t('shelves')); ?></label>
					<?php print_unescaped($this->inc('template/multiselect')); ?>
				</div>
				<div class='row'>
					<label><?php p($l->t('book-filename')); ?></label>
					<input type='text' class='location' readonly>
				</div>
			</section>
		</div>

		<div id='app-sidebar-metadata' class='hidden'>
		</div>

		<div id='app-sidebar-raw' class='hidden'>
			<textarea></textarea>
			<div class='editor-controls'>
				<a href='#' class='icon-fullscreen'></a>
				<button><?php p($l->t('wgt-save')); ?></button>
			</div>
		</div>
	</div>
</div>
