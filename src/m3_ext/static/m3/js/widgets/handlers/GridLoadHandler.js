Ext.m3.GridLoadHandler = Ext.extend(Ext.m3.BaseLoadHandler, {
    handlerAlias: 'grid_load',
    onLoad: function(data) {
        console.log('load grid');
    }
});

Ext.m3.actionManager.registerType('grid_load', Ext.m3.GridLoadHandler);
Ext.m3.actionManager.register([Ext.m3.ObjectGrid, "load", "grid_load"]);

