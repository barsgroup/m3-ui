
var grid_submit_handler, grid_cls,
    //для тестирования функционала
    submit_suffix = Ext.m3._future ? "_newSubmit": '';


if (Ext.m3.ExtJS_version == "3.4") {
    grid_cls = Ext.m3.ObjectGrid;
    grid_submit_handler = Ext.m3.GridSubmitHandler = Ext.extend(Ext.m3.BaseSubmitHandler, {
        //обработчик события на сабмит формы для гридов
        onSubmit: function(control, submit_params) {
            var cStore = control.getStore(),
                cStoreData = [];

            for (var k = 0, items= cStore.data.items; k < items.length; k++){
                cStoreData.push(items[k].data);
            }

            submit_params.params[control.name+submit_suffix] = Ext.encode(cStoreData);
        }
    });

} else if (Ext.m3.ExtJS_version == "4.2") {

}

Ext.m3.actionManager.registerType('grid_submit', grid_submit_handler);
Ext.m3.actionManager.register([grid_cls, "submit", "grid_submit"]);
