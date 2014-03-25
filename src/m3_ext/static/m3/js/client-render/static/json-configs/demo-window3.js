
var demo_window3 = (function() {
	return {
		title: 'Окно 3',
		items: [
			{	xtype: 'panel', layout: 'form',
			 	items: [
				 	{xtype: 'textfield', fieldLabel: 'Текст3', anchor: '100%'},
				 	{xtype: 'numberfield', fieldLabel: 'Число3', anchor: '100%'}
			 	]
			}
		]
	}
})();