Ext.define('Ext.m3.ComboBox', {
    extend: 'Ext.form.ComboBox',
    xtype: 'm3-combobox',

	/**
	 * Возвращает текстовое представление комбобокса
	 */
	getText: function(){
		return this.lastSelectionText || '';
	},
    setValue: function(value){
        if (Ext.isObject(value)) {
            // binding - добавим запись в store
            this.getStore().add(new Ext.data.Record(value));
            this.setValue(value[this.valueField]);
        } else
            this.callParent(arguments);
    }
});
