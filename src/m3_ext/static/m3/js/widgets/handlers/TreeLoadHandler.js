
Ext.m3.TreeLoadHandler = Ext.extend(Ext.m3.BaseLoadHandler, {
    handlerAlias: 'tree_load',
    onLoad: function(data) {
        console.log('load tree');
    }
});

Ext.m3.actionManager.registerType('tree_load', Ext.m3.TreeLoadHandler);
Ext.m3.actionManager.register([Ext.m3.ObjectTree, "load", 'tree_load']);