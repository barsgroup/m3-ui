/**
 * Окно на базе Ext.Window
 */

Ext.define('Ext.m3.Window', {
    extend: 'Ext.Window',
    xtype: 'm3-window',

	constructor: function(baseConfig, params){
        params = baseConfig.params || params;

		// Ссылка на родительское окно
		this.parentWindow = null;
		
		// Контекст
		this.actionContextJson = null;
		
		if (params && params.parentWindowID) {
			this.parentWindow = Ext.getCmp(params.parentWindowID);
		}
		
        if (params && params.helpTopic) {
            this.m3HelpTopic = params.helpTopic;
        }
    
		if (params && params.contextJson){
			this.actionContextJson = params.contextJson;
		}
    
        // на F1 что-то нормально не вешается обработчик..
        //this.keys = {key: 112, fn: function(k,e){e.stopEvent();console.log('f1 pressed');}}
    
		this.callParent(arguments);
	},
    initTools: function(){
        if (this.m3HelpTopic){
            var m3HelpTopic = this.m3HelpTopic;
            this.addTool({id: 'help', handler: function(){ showHelpWindow(m3HelpTopic);}});
        }
        Ext.m3.Window.superclass.initTools.call(this);
    }
});