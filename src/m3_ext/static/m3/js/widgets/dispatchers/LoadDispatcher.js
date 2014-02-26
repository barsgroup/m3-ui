
//менеджер компонентов которые имеют интерфейс загрузки своих данных
//при загрузке
Ext.m3.LoadDispatcher = Ext.extend(Ext.m3.CustomEventDispatcher, {
    typeName: 'load',
    doHandler: function(handler, component, options) {
        handler.onLoad(component, options);
    }
});

Ext.m3.actionManager.registerType("load", Ext.m3.LoadDispatcher);
