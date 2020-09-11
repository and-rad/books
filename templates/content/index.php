<table id='app-shelf' class='list-container'>
	<thead>
		<tr>
			<th class='cover'></th>
			<th class='title sort' data-sort='title'><?php p($l->t('title')); ?><span class='sort-indicator hidden icon-triangle-s'></span></th>
			<th class='author sort' data-sort='author'><?php p($l->t('author')); ?><span class='sort-indicator hidden icon-triangle-s'></span></th>
			<th class='genre sort' data-sort='genre'><?php p($l->t('genre')); ?><span class='sort-indicator hidden icon-triangle-s'></span></th>
			<th class='lang sort' data-sort='lang'><?php p($l->t('lang')); ?><span class='sort-indicator hidden icon-triangle-s'></span></th>
		</tr>
	</thead>
	<tbody id='app-shelf-body'></tbody>
</table>
