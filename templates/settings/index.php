<div id='app-settings'>
	<div id='app-settings-header'>
		<button class='settings-button' data-apps-slide-toggle='#app-settings-content'><?php p($l->t('settings')); ?></button>
	</div>
	<div id='app-settings-content'>
		<label>
			<?php p($l->t('fontsize')); ?>
			<select id="font-settings">
				<option value="inherit"><?php p($l->t('auto')); ?></option>
				<option disabled></option>
				<option value="8px">8 px</option>
				<option value="10px">10 px</option>
				<option value="12px">12 px</option>
				<option value="14px">14 px</option>
				<option value="16px">16 px</option>
				<option value="18px">18 px</option>
				<option value="20px">20 px</option>
				<option disabled></option>
				<option value="100%">100 %</option>
				<option value="125%">125 %</option>
				<option value="150%">150 %</option>
				<option value="175%">175 %</option>
				<option value="200%">200 %</option>
			</select>
		</label>
		<label>
			<?php p($l->t('mode')); ?>
			<select id="color-settings">
				<option value="default"><?php p($l->t('mode-light')); ?></option>
				<option value="lucario"><?php p($l->t('mode-dark')); ?></option>
			</select>
		</label>
		<label>
			<?php p($l->t('library')); ?>
			<input type='text' id='path-settings' placeholder='Location'>
		</label>
		<ul>
			<li class='app-settings-item icon-search'><button id='settings-item-scan'><?php p($l->t('wgt-scan')); ?></button></li>
			<li class='app-settings-item icon-delete'><button id='settings-item-reset'><?php p($l->t('wgt-reset')); ?></button></li>
		</ul>
	</div>
</div>
