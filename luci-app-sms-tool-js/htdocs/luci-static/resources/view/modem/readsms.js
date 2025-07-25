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

document.head.append(E('style', {'type': 'text/css'},
`
#smsTable {
  width: 100%;
  border: 1px solid var(--border-color-medium) !important;
}

th, td {
  padding: 10px;
  text-align: justify !important;
  vertical-align: top !important;
}

td input[type="checkbox"] {
  float: left !important;
  margin: 0 auto !important;
  width: 17px !important;
}

#smsTable tr:nth-child(odd) td{
  background: var(--background-color-medium) !important;
  border-bottom: 1px solid var(--border-color-medium) !important;
  border-top: 1px solid var(--border-color-medium) !important;
}

#smsTable tr:nth-child(even) td{
  border-bottom: 1px solid var(--border-color-medium) !important;
  border-top: 1px solid var(--border-color-medium) !important;
}

#smsTable .checker {
  width: 7% !important;
}

#smsTable .from {
  width: 11% !important;
}

#smsTable .received {
  width: 15% !important;
}

#smsTable .message {
  width: 88% !important;
}
`));

function msg_bar(v, m) {
var pg = document.querySelector('#msg')
var vn = parseInt(v) || 0;
var mn = parseInt(m) || 100;
var pc = Math.floor((100 / mn) * vn);

pg.firstElementChild.style.width = pc + '%';
pg.setAttribute('title', '%s'.format(v) + ' / ' + '%s'.format(m) + ' ('+ pc + '%)');
}


function save_count() {
	uci.load('sms_tool_js').then(function() {

		var storeL = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'storage'));
		var portR = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'readport'));

			L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , 'status' ]))
					.then(function(res) {
							if (res) {
								var total = res.substring(res.indexOf("total"));
								var t = total.replace ( /[^\d.]/g, '' );
								var used = res.substring(17, res.indexOf("total"));
								var u = used.replace ( /[^\d.]/g, '' );
								uci.set('sms_tool_js', '@sms_tool_js[0]', 'sms_count', L.toArray(u).join(' '));
								uci.save();
								uci.apply();
							}
			});
	});
}

return view.extend({
	load: function() {
		uci.load('sms_tool_js');
	},

	handleSWarea: function(ev) {
		switch (document.querySelector('input[name="filter_area"]:checked').value) {
		case 'sim':
			uci.set('sms_tool_js', '@sms_tool_js[0]', 'storage', "SM");
			uci.save();
			uci.apply();
			break;
		case 'memory':
			uci.set('sms_tool_js', '@sms_tool_js[0]', 'storage', "ME");
			uci.save();
			uci.apply();
			break;
		}
	},

	handleDelete: function(ev) {
		if (document.querySelectorAll('input[name="smsn"]:checked').length == 0){
		ui.addNotification(null, E('p', _('Please select the message(s) to be deleted')), 'info');   
		}
		else {
			if (document.querySelectorAll('input[name="smsn"]:checked').length === document.querySelectorAll('input[name="smsn"]').length) {
					if (confirm(_('Delete all the messages?')))
						{
							var sections = uci.sections('sms_tool_js');
							var portDA = sections[0].readport;
							var storeDA = sections[0].storage;

							fs.exec_direct('/usr/bin/sms_tool', [ '-d' , portDA , 'delete' , 'all' ]);
							document.getElementById("ch-all").checked = false;

							var rowCount = smsTable.rows.length;
							for (var i = rowCount - 1; i > 0; i--) {
            					smsTable.deleteRow(i);}
    							setTimeout(function() {
								L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeDA , '-d' , portDA , 'status' ]))
									.then(function(res) {
										if (res) {
											var total = res.substring(res.indexOf("total"));
											var t = total.replace ( /[^\d.]/g, '' );
											var u = "0";
											msg_bar(Math.floor(u), t);
											save_count();
										}
								});
							}, 2000);
						}
			}
			else {

					if (confirm(_('Delete selected message(s)?')))
						{
						uci.load('sms_tool_js').then(function() {

							var storeL = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'storage'));
							var portR = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'readport'));

							var array = [];
							var checkb = document.querySelectorAll('input[type=checkbox]:checked');

							for (var i = 0; i < checkb.length; i++) {
								if (checkb[i] != source)
  								array.push(checkb[i].id)
							}

							if (array) {

							var args = [];
							var sections = uci.sections('sms_tool_js');
							var portDEL = sections[0].readport;
							var storeDS = sections[0].storage;

							args.push(array);
							var ax = args.toString();
							ax = ax.replace(/,/g, ' ');
							ax = ax.replace(/-/g, ' ');

							var smsnr = ax.split(" ");

							var smsallchars = smsnr.toString();
							var smsdelcount = 0;
							var smsdeleted = 0;

							var inumber = false;

							for (var i = 0; i < smsallchars.length; i++) {
    							var ch = smsallchars[i];

    							if (ch >= '0' && ch <= '9') {
        							if (!inumber) {
            								smsdelcount++;
            								inumber = true;
        							}
    								} else if (ch === ',') {
        								inumber = false;
    								} else {
        								inumber = false;
    								}
							}
	
							var deletelabel = document.getElementById("deleteinfo");
							deletelabel.style.display = 'block';

								for (var i=0; i < smsnr.length + 2; i++)
									{
									(function(i) {
    									setTimeout(function() { 
    									smsnr[i] = parseInt(smsnr[i], 10);

									if (!Number.isNaN(smsnr[i]))
										{
										fs.exec_direct('/usr/bin/sms_tool', [ '-d' , portDEL , 'delete' , smsnr[i] ]);
                						smsdeleted++;
										L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , 'status' ]))
										.then(function(res) {
										if (res) {
											var total = res.substring(res.indexOf("total"));
											var t = total.replace ( /[^\d.]/g, '' );
											var used = res.substring(17, res.indexOf("total"));
											var u = used.replace ( /[^\d.]/g, '' );
											msg_bar(Math.floor(u), t);
											deletelabel.innerHTML = _('Please wait... deleted')+' '+smsdeleted+' '+_('of')+' '+smsdelcount+' '+_('selected messages');
										}
										});
				
										}
										L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , 'status' ]))
										.then(function(res) {
										if (res) {
											var total = res.substring(res.indexOf("total"));
											var t = total.replace ( /[^\d.]/g, '' );
											var used = res.substring(17, res.indexOf("total"));
											var u = used.replace ( /[^\d.]/g, '' );
											msg_bar(Math.floor(u), t);
											deletelabel.innerHTML = _('Please wait... deleted')+' '+smsdeleted+' '+_('of')+' '+smsdelcount+' '+_('selected messages');
										}
										});

										if (smsdelcount == smsdeleted) {
											setTimeout(function() {
											var hidecount = document.getElementById('deleteinfo');
    											hidecount.style.display = 'none';
											    save_count();
											}, 7000);
										}
									}, 1500 * i);
								})(i);
										L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , 'status' ]))
										.then(function(res) {
										if (res) {
											var total = res.substring(res.indexOf("total"));
											var t = total.replace ( /[^\d.]/g, '' );
											var used = res.substring(17, res.indexOf("total"));
											var u = used.replace ( /[^\d.]/g, '' );
											msg_bar(Math.floor(u), t);
											deletelabel.innerHTML = _('Please wait... deleted')+' '+smsdeleted+' '+_('of')+' '+smsdelcount+' '+_('selected messages');
										}
										});
								}
								var table = document.getElementById("smsTable");
  								var index = 1;
  									while (index < table.rows.length) {
   										var input = table.rows[index].cells[0].children[0];
    										if (input && input.checked) {
      											table.deleteRow(index);
   										}
    										else {
      											index++;
   										}
  									}
								}
							});
						}
			    }
		}
	},

                                                                                                                                                       
	handleRefresh: function(ev) {
		window.location.reload();
	},


	handleSelect: function(ev) {
		var checkBox = document.getElementById("ch-all");
		var checkBoxes = document.querySelectorAll('input[type="checkbox"]');

  		if (checkBox.checked == true){
			for (var i = 0; i < checkBoxes.length; i++)
				checkBoxes[i].setAttribute('checked', 'true');
  		} else {
			for (var i = 0; i < checkBoxes.length; i++)
				checkBoxes[i].removeAttribute('checked');
  		}
	},

	render: function(data) {

		var sections, store;
		var view = document.getElementById("smssarea");
		store = '-';

		uci.load('sms_tool_js').then(function() {
		var storeL = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'storage'));
		var portR = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'readport'));
		var smsM = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'mergesms'));
		var algo = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'algorithm'));
		var hide = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'bnumber'));
		var ledn = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'lednotify'));
		var ledt = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'ledtype'));
		var direct = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'direction'));

		if (!portR) {
 			ui.addNotification(null, E('p', _('The package requires user configuration. \
					<br /><br /><b>The following need to be set:</b> \
					<ul><li>1. All ports for communication with the modem.</li><li>2. Additional options specific to the given modem (for handling USSD codes).</li><li> \
					3. Notification LED (optional).</li><li><ul>')), 'info');
		}
		
		var sections = uci.sections('sms_tool_js');
		var led = sections[0].smsled;

		if (storeL == "SM")
      			document.querySelector('input[name="filter_area"][value="sim"]').checked = true;
		if (storeL == "ME")
      			document.querySelector('input[name="filter_area"][value="memory"]').checked = true;
		if (ledn == "1")
			{
				switch (ledt) {
  					case 'S':
    						fs.exec_direct('/etc/init.d/led', [ 'restart' ]);
    						break;
  					case 'D':
    						fs.write('/sys/class/leds/'+led+'/brightness', '0');
    						break;
  					default:
					}
			}

		L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , 'status' ]))
				.then(function(res) {
					if (res) {
							var total = res.substring(res.indexOf("total"));
							var t = total.replace ( /[^\d.]/g, '' );

							var used = res.substring(17, res.indexOf("total"));
							var u = used.replace ( /[^\d.]/g, '' );

						L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , '-f' , '%Y-%m-%d %H:%M' , '-j' , 'recv' , '2>/dev/null' ]))
							.then(function(res2) {
								if (res2) {

 									var table = document.getElementById('smsTable');
									while (table.rows.length > 1) { table.deleteRow(1); }					

									var start = res2.substring(7);
									var end = start.substring(0,start.length-2);

									var json = JSON.parse(end);

									var aidx = [];

									/* Merging messages */
									if (smsM == "1") {

											var result = [];

											if (algo == "Advanced")
											{
												switch (direct) {
  														case 'Start':
    															var Data = json.sort((a, b) => {
  																if (a.timestamp === b.timestamp && a.sender === b.sender) {
    																	return a.part - b.part;
  																} else if (a.timestamp === b.timestamp) {
    																	return a.sender - b.sender;
  																} else {
    																	return a.timestamp.localeCompare(b.timestamp);
  																}
															});
    															break;
  														case 'End':
    															var Data = json.sort((a, b) => {
  																if (a.timestamp === b.timestamp && a.sender === b.sender) {
    																	return b.part - a.part;
  																} else if (a.timestamp === b.timestamp) {
    																	return a.sender - b.sender;
  																} else {
    																	return a.timestamp.localeCompare(b.timestamp);
  																}
															});
    															break;
  														default:
												}

												var SortedSMS = Data.sort((function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp) }));
												var combinedjson = {};

												for (const parts of SortedSMS) {
  												const { sender, timestamp, total, content, index } = parts;

  												if (total) {
    													const key = `${sender}-${timestamp}-${total}`;
    														if (combinedjson[key]) {
      															combinedjson[key].content += content;
      															combinedjson[key].index += '-' + index;
   														} else {
      															combinedjson[key] = { sender, timestamp, total, content, index };
    														}
  												} else {
    													const newkey = `${sender}-${timestamp}-${index}`;
    													combinedjson[newkey] = { sender, timestamp, total, content, index };
  													}
												}
												var result = Object.values(combinedjson);											}

											if (algo == "Simple")
											{
												var SortedSMS = json.sort((function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp) }));

												SortedSMS.forEach(function (o) {
    													if (!this[o.sender]) {
        													this[o.sender] = { index: o.index, sender: o.sender, timestamp: o.timestamp, part: o.part, total: o.total, content: o.content };
        													result.push(this[o.sender]);
        													return;
    														}
														if (this[o.sender].total == o.total && this[o.sender].timestamp == o.timestamp && this[o.sender].sender == o.sender && this[o.sender].part > 0) {
    														this[o.sender].index += '-' + o.index;    			
														this[o.sender].content += o.content;}
														else {
															this[o.sender] = { index: o.index, sender: o.sender, timestamp: o.timestamp, part: o.part, total: o.total, content: o.content };
        														result.push(this[o.sender]);
        														return;
															}
												}, Object.create(null));
											}
													if (u){
															var Lres = L.resource('icons/newdelsms.png');
															var iconz = String.format('<img style="width: 24px; height: 24px; "src="%s"/>', Lres);

															for (var i = 0; i < result.length; i++) {
            													var row = table.insertRow(-1);
  																var cell1 = row.insertCell(0);
  																var cell2 = row.insertCell(0);
  																var cell3 = row.insertCell(0);
  																var cell4 = row.insertCell(0);
																cell4.innerHTML = "<input type='checkbox' name='smsn' id="+result[i].index+","+" />"+iconz;
																	if (result[i].sender.includes(hide)) {
																		var removeLast5 = result[i].sender.slice(0, -5);
																		cell3.innerHTML = removeLast5 + '#####';
																	} else {
 				 													cell3.innerHTML = result[i].sender;
																	}
																	
  																cell2.innerHTML = result[i].timestamp;
    															cell1.innerHTML = result[i].content.replace(/\s+/g, ' ').trim();
																aidx.push(result[i].index+'-');
															}

															var axx = aidx.toString();
															axx = axx.replace(/,/g, ' ');
															axx = axx.replace(/-/g, ' ');

															uci.set('sms_tool_js', '@sms_tool_js[0]', 'sms_count_index', L.toArray(axx).join(' '));
															uci.set('sms_tool_js', '@sms_tool_js[0]', 'sms_count', L.toArray(u).join(' '));
															uci.save();
															uci.apply();
											}

										}
									}

									/* No merging messages */
									if (smsM == "0") {
									
										/* Sorting messages by delivery time */
										var sortbyTime = json.sort((function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp) }));

										/* Sorting messages by parts */
										var sortedData = sortbyTime.sort((a, b) => {
    										if (a.timestamp === b.timestamp && a.sender === b.sender && a.total === b.total) {
        											return a.part - b.part;
    										} else {
        											return 0;
    										}
										});

										if (u){

											var Lres = L.resource('icons/newdelsms.png');
											var iconz = String.format('<img style="width: 24px; height: 24px; "src="%s"/>', Lres);

											for (var i = 0; i < sortedData.length; i++) {
            								var row = table.insertRow(-1);
  											var cell1 = row.insertCell(0);
  											var cell2 = row.insertCell(0);
  											var cell3 = row.insertCell(0);
  											var cell4 = row.insertCell(0);
											cell4.innerHTML = "<input type='checkbox' name='smsn' id="+sortedData[i].index+","+" />"+iconz;
												if (sortedData[i].sender.includes(hide)) {
													var removeLast5 = sortedData[i].sender.slice(0, -5);
													cell3.innerHTML = removeLast5 + '#####';
												} else {
 				 									cell3.innerHTML = sortedData[i].sender;
												}
  											cell2.innerHTML = sortedData[i].timestamp;
    										cell1.innerHTML = sortedData[i].content.replace(/\s+/g, ' ').trim();
											aidx.push(sortedData[i].index+'-');
										
											}
											
											var axx = aidx.toString();
											axx = axx.replace(/,/g, ' ');
											axx = axx.replace(/-/g, ' ');

											uci.set('sms_tool_js', '@sms_tool_js[0]', 'sms_count_index', L.toArray(axx).join(' '));
											uci.set('sms_tool_js', '@sms_tool_js[0]', 'sms_count', L.toArray(u).join(' '));
											uci.save();
											uci.apply();
									}

								}
						});

				} else {
					if ( t.lenght < 1 )
						{
						msg_bar(Math.floor(u), t);
						}
					ui.addNotification(null, E('p', _('Please set the port for communication with the modem')), 'info');
				}

			if (document.getElementById('msg')) {
				msg_bar(Math.floor(u), t);
			    }
    		});
		});

		var v = E([], [
			E('h2', _('SMS Messages')),
			E('div', { 'class': 'cbi-map-descr' }, _('User interface for reading messages using sms-tool.').format('')),

			E('h3', _('Received Messages')),
			E('table', { 'class': 'table' }, [
    					E('tr', { 'class': 'tr' }, [
        					E('td', { 'class': 'td left', 'width': '33%' }, [ _('Message storage area') ]),
        					E('td', { 'class': 'td' }, [
							E('div', [
							E('label', {
								'data-tooltip': _('Any change in the area from which SMS messages will be read requires refreshing the messages')
							}, [
							E('input', {
								'type': 'radio',
								'name': 'filter_area',
								'value': 'sim',
								'change': ui.createHandlerFn(this, 'handleSWarea'),
								'checked': true
							}),
							' ',
							_('SIM card')
						]),
						' \u00a0 ',
							E('label', {
								'data-tooltip': _('Any change in the area from which SMS messages will be read requires refreshing the messages')
							}, [
							E('input', {
								'type': 'radio',
								'name': 'filter_area',
								'value': 'memory',
								'change': ui.createHandlerFn(this, 'handleSWarea')
							}),
							' ',
							_('Modem memory')
							])
						])
						])
    					]),
    					E('tr', { 'class': 'tr' }, [
        					E('td', { 'class': 'td left', 'width': '33%' }, [ _('Storage used / Total capacity') ]),
        					E('td', { 'class': 'td' }, [
            				E('div', { 'class': 'right' }, [
		                	E('div', {
                    				'id': 'msg',
                    				'class': 'cbi-progressbar',
                    				'title': '-'
                			}, E('div')),
				            E('div', { 'class': 'right' }, [
                			E('div', {
                    				'style': 'text-align:center;font-size:90%',
                    				'id': 'deleteinfo'
                			}, [ '' ]),
				        ]),
            		]),
        		]),
    		]),
		]),

				E('div', { 'class': 'right' }, [
					E('button', {
						//'class': 'cbi-button cbi-button-negative important',
						'class': 'cbi-button cbi-button-remove',
						'id': 'execute',
						'click': ui.createHandlerFn(this, 'handleDelete')
					}, [ _('Delete message(s)') ]),
					'\xa0\xa0\xa0',
					E('button', {
						'class': 'cbi-button cbi-button-add',
						'id': 'clr',
						'click': ui.createHandlerFn(this, 'handleRefresh')
					}, [ _('Refresh messages') ]),

			]),

			E('p'),

			E('table', { 'class': 'table' , 'id' : 'smsTable' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th checker' }, 
					E('input', {
						'id': 'ch-all',
						'type': 'checkbox',
						'name': 'checkall',
						'disabled': null,
						'checked': null,
						'click': ui.createHandlerFn(this, 'handleSelect')
					}), '',
					),
					E('th', { 'class': 'th from' }, _('From')),
					E('th', { 'class': 'th received' }, _('Received')),
					E('th', { 'class': 'th center message' }, _('Message'))
				])
			]),
		]);
		return v;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
