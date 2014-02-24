
var grid_submit_handler, grid_cls;

if (Ext.m3.clientFramework == "ExtJS 3.4" || !Ext.m3.clientFramework) {
    grid_cls = Ext.m3.ObjectGrid;
    grid_submit_handler = Ext.m3.GridSubmitHandler = Ext.extend(Ext.m3.BaseSubmitHandler, {
        //обработчик события на сабмит формы для гридов
        onSubmit: function(control, submit_params) {
            debugger;
            console.log('submit grid');
            var cStore = control.getStore();
            var cStoreData = [];
            for (var k = 0; k < cStore.data.items.length; k++){
                cStoreData.push(cStore.data.items[k].data);
            }
            submit_params[control.name] = Ext.encode(cStoreData);
        }
    });

} else if (Ext.m3.clientFramework == "ExtJS 4.2>") {

}

Ext.m3.actionManager.registerType('grid_submit', grid_submit_handler);
Ext.m3.actionManager.register([grid_cls, "submit", "grid_submit"]);
