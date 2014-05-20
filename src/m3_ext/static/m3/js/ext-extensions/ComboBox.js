Ext.define('Ext.m3.ComboBox', {
    extend: 'Ext.form.ComboBox',
    xtype: 'm3-combobox',

	/**
	 * Возвращает текстовое представление комбобокса
	 */
	getText: function(){
		return this.lastSelectionText || '';
	}
});
