<template id='template-shelf-item'>
	<td class='field cover'>
		<div>
			<span class='placeholder'></span>
			<svg viewBox='0 0 24 24' class='icon status-1'><use href='/apps/books/img/icons.svg#done'/></svg>
			<svg viewBox='0 0 24 24' class='icon status-2'><use href='/apps/books/img/icons.svg#more'/></svg>
			<svg viewBox='0 0 24 24' class='icon status-3'><use href='/apps/books/img/icons.svg#close'/></svg>
		</div>
	</td>
	<td class='field title' data-file-as=''>
		<div><span class='title-1'></span></div>
		<div><span class='title-2'></span></div>
	</td>
	<td class='field author' data-file-as=''>
		<div>
			<span class='author-1'></span>
			<span class='more'></span>
		</div>
	</td>
	<td class='field genre' data-file-as=''>
		<div>
			<span class='genre-1'></span>
			<span class='more'></span>
		</div>
	</td>
	<td class='field lang' data-file-as=''>
		<div>
			<span class='lang-1'></span>
			<span class='more'></span>
		</div>
	</td>
</template>

<template id='template-list-item'>
	<a href='#' class='name'></a><span class='count'></span>
</template>

<template id='template-toc-item'>
	<a href='#'></a>
</template>
