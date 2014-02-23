

Ext.m3.GridSubmitHandler = Ext.extend(Ext.m3.BaseSubmitHandler, {
    //обработчик события на сабмит формы для гридов
    onSubmit: function(control, submit_params) {

        console.log('submit grid');
        var cStore = control.getStore();
        var cStoreData = [];
        for (var k = 0; k < cStore.data.items.length; k++){
            cStoreData.push(cStore.data.items[k].data);
        }
        submit_params[control.name] = Ext.encode(cStoreData);
    }
});

Ext.m3.actionManager.registerType('grid_submit', Ext.m3.GridSubmitHandler);
Ext.m3.actionManager.register([Ext.m3.ObjectGrid, "submit", "grid_submit"]);
