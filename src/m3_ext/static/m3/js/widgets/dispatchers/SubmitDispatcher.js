
//менеджер компонентов которые имеют интерфейс сохранения своих данных
//при сабмите формы
Ext.m3.SubmitDispatcher = Ext.extend(Ext.m3.CustomEventDispatcher, {
    typeName: 'submit',
    doHandler: function(handler, component, params) {
        handler.onSubmit(component, params);
    }
});

Ext.m3.actionManager.registerType("submit", Ext.m3.SubmitDispatcher);
console.log("register SubmitDispatcher");