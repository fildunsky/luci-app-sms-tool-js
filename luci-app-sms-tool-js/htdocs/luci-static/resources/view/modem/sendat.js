'use strict';
'require dom';
'require form';
'require fs';
'require ui';
'require uci';
'require view';

/*
	Copyright 2022-2025 Rafał Wabik - IceG - From eko.one.pl forum
	
	Licensed to the GNU General Public License v3.0.
*/

return view.extend({
	handleCommand: function(exec, args) {
		let buttons = document.querySelectorAll('.cbi-button');

		for (let i = 0; i < buttons.length; i++)
			buttons[i].setAttribute('disabled', 'true');
			
		return fs.exec(exec, args).then(function(res) {
			let out = document.querySelector('.atcommand-output');
			out.style.display = '';

			res.stdout = res.stdout?.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "") || '';
			res.stderr = res.stderr?.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "") || '';
			
			if (res.stdout === undefined || res.stderr === undefined || res.stderr.includes('undefined') || res.stdout.includes('undefined')) {
				return;
			}
			else {
				dom.content(out, [ res.stdout || '', res.stderr || '' ]);
			}
			
		}).catch(function(err) {
			if (res.stdout === undefined || res.stderr === undefined || res.stderr.includes('undefined') || res.stdout.includes('undefined')) {
				return;
			}
			else {
				ui.addNotification(null, E('p', [ err ]));
			}
		}).finally(function() {
			for (let i = 0; i < buttons.length; i++)
			buttons[i].removeAttribute('disabled');

		});
	},

	handleGo: function(ev) {
		let atcmd = document.getElementById('cmdvalue').value;
		let sections = uci.sections('sms_tool_js');
		let port = sections[0].atport;

		if ( atcmd.length < 2 )
		{
			ui.addNotification(null, E('p', _('Please specify the command to send')), 'info');
			return false;
		}
		else {
		if ( !port )
			{
			ui.addNotification(null, E('p', _('Please set the port for communication with the modem')), 'info');
			return false;
			}
			else {
			//sms_tool -d /dev/ttyUSB1 at "ati"
			return this.handleCommand('sms_tool', [ '-d' , port , 'at' , atcmd ]);
			}
		}
		if ( !port )
		{
			ui.addNotification(null, E('p', _('Please set the port for communication with the modem')), 'info');
			return false;
		}
	},

	handleClear: function(ev) {
		let out = document.querySelector('.atcommand-output');
		out.style.display = 'none';

		let ov = document.getElementById('cmdvalue');
		ov.value = '';

		document.getElementById('cmdvalue').focus();
	},

	handleCopy: function(ev) {
		let out = document.querySelector('.atcommand-output');
		out.style.display = 'none';

		let ov = document.getElementById('cmdvalue');
		ov.value = '';
		let x = document.getElementById('tk').value;
		ov.value = x;
	},

	load: function() {
		return Promise.all([
			L.resolveDefault(fs.read_direct('/etc/modem/atcmmds.user'), null),
			uci.load('sms_tool_js')
		]);
	},

	render: function (loadResults) {
	
	let info = _('User interface for sending AT commands using sms-tool.').format('');
	
		return E('div', { 'class': 'cbi-map', 'id': 'map' }, [
				E('h2', {}, [ _('AT Commands') ]),
				E('div', { 'class': 'cbi-map-descr'}, info),
				E('hr'),
				E('div', { 'class': 'cbi-section' }, [
					E('div', { 'class': 'cbi-section-node' }, [
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title' }, [ _('User AT commands') ]),
							E('div', { 'class': 'cbi-value-field' }, [
								E('select', { 'class': 'cbi-input-select',
										'id': 'tk',
										'style': 'margin:5px 0; width:100%;',
										'change': ui.createHandlerFn(this, 'handleCopy'),
										'mousedown': ui.createHandlerFn(this, 'handleCopy')
									    },
									(loadResults[0] || "").trim().split("\n").map(function(cmd) {
                                        let fields = cmd.split(/;/);
                                        let name = fields[0];
                                        let code = fields[1] || fields[0];
                                        return E('option', { 'value': code }, name );
                                    })
								)
							]) 
						]),
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title' }, [ _('Command to send') ]),
							E('div', { 'class': 'cbi-value-field' }, [
							E('input', {
								'style': 'margin:5px 0; width:100%;',
								'type': 'text',
								'id': 'cmdvalue',
								'data-tooltip': _('Press [Enter] to send the command, press [Delete] to delete the command'),
								'keydown': function(ev) {
									 if (ev.keyCode === 13)  
										{
										let execBtn = document.getElementById('execute');
											if (execBtn) {
												execBtn.click();
											}
										}
									 if (ev.keyCode === 46)  
										{
										let del = document.getElementById('cmdvalue');
											if (del) {
												let ov = document.getElementById('cmdvalue');
												ov.value = '';
												document.getElementById('cmdvalue').focus();
											}
										}
								    }																														
								}),
							])
						]),
					])
				]),
				E('hr'),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'id': 'clr',
						'click': ui.createHandlerFn(this, 'handleClear')
					}, [ _('Clear form') ]),
					'\xa0\xa0\xa0',
					E('button', {
						'class': 'cbi-button cbi-button-action important',
						'id': 'execute',
						'click': ui.createHandlerFn(this, 'handleGo')
					}, [ _('Send command') ]),
				]),
				E('p', _('Reply')),
				E('pre', { 'class': 'atcommand-output', 'style': 'display:none; border: 1px solid var(--border-color-medium); border-radius: 5px; font-family: monospace' }),

			]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
})
