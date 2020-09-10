<div id='app-sidebar' class='hidden'>
	<header>
		<a href='#' class='icon-close'></a>
		<h1>Book Details</h1>
		<nav class='tabbar'>
			<a href='#'>Details</a>
			<a href='#'>Metadata</a>
			<a href='#'>Raw Data</a>
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
					<label>Read Status</label>
					<select class='status'>
						<option value='0'>Unread</option>
						<option value='1'>In Progress</option>
						<option value='2'>Finished</option>
						<option value='3'>Aborted</option>
					</select>
				</div>
				<div class='row'>
					<label>Shelves</label>
					<div class='multiselect input'>
						<input type='text'>
					</div>
				</div>
				<div class='row'>
					<label>File Name</label>
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
				<button>Save</button>
			</div>
		</div>
	</div>
</div>
