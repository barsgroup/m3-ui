
var demo_window = (function() {
	return {
		title: 'Окно 1',
		items: [
			{	xtype: 'panel', layout: 'form',
			 	items: [
				 	{xtype: 'textfield', fieldLabel: 'Текст', anchor: '100%'},
				 	{xtype: 'numberfield', fieldLabel: 'Число', anchor: '100%'}
			 	]
			}
		]
	}
})();