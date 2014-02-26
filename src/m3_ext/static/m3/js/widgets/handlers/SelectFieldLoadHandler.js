

if (Ext.m3.ExtJS_version == "3.4") {
    Ext.m3.SelectFieldLoadHandler = Ext.extend(Ext.m3.BaseLoadHandler, {

        /*обработчик загрузки данных в виджеты напоминающие комбо-бокс со Store*/
        onLoad: function(component, fields_data) {
            var field_data;

            Ext.each(fields_data, function(data) {
                var cmp = data[0], info = data[1];
                if (cmp.name == component.name) {
                    field_data = info;
                }
            });

            if (field_data) {
                var id = field_data.id, record;
                // Запись значения в стор только при условии, что оно не пустое
                if (id) {
                    // Создаем запись и добавляем в стор
                    record = new Ext.data.Record();
                    record.set('id', id);
                    record.set(component.displayField,
                        field_data[component.displayField]);

                    component.getStore().add([record]);
                    // Устанавливаем новое значение
                    component.setValue(id);
                    component.collapse();
                } else {
                    component.clearValue();
                }
            }
        }
    });

} else {

}

Ext.m3.actionManager.registerType('select_load', Ext.m3.SelectFieldLoadHandler);
Ext.m3.actionManager.register([Ext.m3.AdvancedComboBox, "load", "select_load"]);