

Ext.m3.SelectFieldLoadHandler = Ext.extend(Ext.m3.BaseLoadHandler, {

    /*обработчик загрузки данных в виджеты напоминающие комбо-бокс со Store*/
    onLoad: function(data, field, field_name) {
        var field_data = data[field_name], id = field_data.id, record;
        // Запись значения в стор только при условии, что оно не пустое
        if (field_data.id) {
            // Создаем запись и добавляем в стор
            record = new Ext.data.Record();
            record.set('id', id);
            record.set(field.displayField, complexData[fieldName].value);
            field.getStore().add([record]);
            // Устанавливаем новое значение
            field.setValue(id);
            field.collapse();
        } else {
            field.clearValue();
        }
    }
});
