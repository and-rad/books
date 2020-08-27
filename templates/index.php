<?php
script('books', 'app');
script('books', 'jszip.min');
script('books', 'epub.min');
style('books', 'style');
?>

<div id='app'>
	<div id='app-navigation'>
		<?php print_unescaped($this->inc('navigation/index')); ?>
		<?php print_unescaped($this->inc('settings/index')); ?>
	</div>

	<div id='app-content'>
		<div id='controls'>
			<?php print_unescaped($this->inc('content/controls')); ?>
		</div>
		<div id='app-content-wrapper'>
			<?php print_unescaped($this->inc('content/index')); ?>
		</div>
		<div id='reader-wrapper'>
			<?php print_unescaped($this->inc('content/reader')); ?>
		</div>
	</div>
</div>

<?php
print_unescaped($this->inc('template/shelf'));
?>

