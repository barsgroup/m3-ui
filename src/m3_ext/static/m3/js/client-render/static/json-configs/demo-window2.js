
var demo_window2 = (function() {
	return {
		title: 'Окно 2',
		items: [
			{	xtype: 'panel', layout: 'form',
			 	items: [
				 	{xtype: 'textfield', fieldLabel: 'Текст2', anchor: '100%'},
				 	{xtype: 'numberfield', fieldLabel: 'Число2', anchor: '100%'}
			 	]
			}
		]
	}
})();