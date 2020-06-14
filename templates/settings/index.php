<div id='app-settings'>
	<div id='app-settings-header'>
		<button class='settings-button' data-apps-slide-toggle='#app-settings-content'>Settings</button>
	</div>
	<div id='app-settings-content'>
		<input type='text' id='path-settings' placeholder='Library directory' value='<?php p($_['library']); ?>'>
		<ul>
			<li class='app-settings-item icon-search'><button id='settings-item-scan'>Scan for books</button></li>
			<li class='app-settings-item icon-delete'><button id='settings-item-reset'>Reset library</button></li>
		</ul>
	</div>
</div>
