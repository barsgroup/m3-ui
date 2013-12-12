/**
 * Расширенный функционал комбобокса
 */

Ext.m3.ComboBox =  Ext.extend(Ext.form.ComboBox,{
	/**
	 * Возвращает текстовое представление комбобокса
	 */
	getText: function(){
		return this.lastSelectionText;
	}
});