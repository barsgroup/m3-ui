/**
 * Окно показа контекстной помощи
 *
 * deprecated! - Непонятно где используется
 */
Ext.define('Ext.m3.HelpWindow', {
    extend: 'Ext.Window',

    constructor: function(baseConfig){
        this.title = 'Справочная информация';
        this.maximized = true;
        this.maximizable = true;
        this.minimizable = true;
        this.width=800;
        this.height=550;

    Ext.m3.HelpWindow.superclass.constructor.call(this, baseConfig);
  }
});

function showHelpWindow(url){

    window.open(url);
}
