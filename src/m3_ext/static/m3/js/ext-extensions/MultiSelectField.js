Ext.ns('Ext.m3');

/**
 * @class Ext.ux.form.MultiSelectField
 * @extends Ext.m3.AdvancedComboBox
 *
 * Контрол для выбора множества значений. Может быть использован как локальное комбо,
 * с галочками в выпадающем списке. Или же так же как выбор из справочника, с установкой пака
 * Отличается от выбора из спровочника переопределенным шаблоном для отображения выпадающего списка
 * с галочками. Реальные значения храняться как массив рекордов в свойстве checkedItems
 */
Ext.m3.MultiSelectField = Ext.extend(Ext.m3.AdvancedComboBox, {

    /**
     * @cfg {String} delimeter Разделитель для отображение текста в поле
     */

    delimeter:',',
    multipleDisplayValue: null,

    initComponent:function() {
        this.checkedItems = [];
        this.hideTriggerDictEdit = true;
        this.editable = false;

        if (!this.tpl) {
             this.tpl = '<tpl for="."><div class="x-combo-list-item x-multi-combo-item">' +
            '<img src="' + Ext.BLANK_IMAGE_URL + '" class="{[this.getImgClass(values)]}" />' +
            '<div>{' + this.displayField + '}</div></div></tpl>';
            
            this.tpl = new Ext.XTemplate(this.tpl, {
                getImgClass: this.getCheckboxCls.createDelegate(this)
            })

        }

       Ext.m3.MultiSelectField.superclass.initComponent.apply(this);
    },

    setValue:function(v) {

        if (!v || v === '[]'){
            this.hideClearBtn();
        }
        else {
            this.showClearBtn();
        }
        this.value = this.getValue();
        this.setRawValue(this.getText());
        if (this.hiddenField) {
            this.hiddenField.value = this.value;
        }
        if (this.el) {
            this.el.removeClass(this.emptyClass);
        }
    },

    getValue : function () {
        var value = [];
		Ext.each(this.checkedItems, function (record) {
			value.push(record.get(this.valueField));
		}, this);

        // vahotin 31.08.12
        // Если поле не содержит значение, то возвращаем пустую строку.
        // Это необходимо для того, чтобы в базовом классе AdvancedComboBox
        // корректно проходила проверка в методе initBaseTrigger
        var res;
        if (value.length){
            res = Ext.util.JSON.encode(value);
        } else {
            res = "";
        }

		return res;
        //
	},

    initValue:function() {
        var i = 0, obj, values, val, record;

        if (this.store && this.value && this.mode === 'local') {
            //Случай, если контрол используется как локальный комбобокс
            //со множественным выбором
            values = Ext.util.JSON.decode(this.value);
            this.store.each(function (r) {
			    Ext.each(values, function (value) {
			        if (r.get(this.valueField) == value) {
			            this.checkedItems.push(r);
			            return false;
			        }
			    }, this);					
		    }, this);
        }
        else if (this.value) {
            //Попробуем создать значения из того что нам прислали с сервера
            //ожидаем что там будут некие объекты с полями значения и отображения
            values = Ext.util.JSON.decode(this.value);

            for (;i < values.length; i++) {
                val = values[i];

                if (typeof(val) !== 'object' ||
                    !( val[this.displayField] && val[this.valueField] )){
                    continue;
                }
                
                record = new Ext.data.Record();
                record.data[this.valueField] = val[this.valueField];
                record.data[this.displayField] = val[this.displayField];

                this.checkedItems.push(record);
            }
        }

       Ext.m3.MultiSelectField.superclass.initValue.call(this);
    },

    getText : function () {
		var value = [];
		Ext.each(this.checkedItems, function (record) {
			value.push(record.get(this.displayField));
		}, this);
		if (value.length > 1 && this.multipleDisplayValue){
			return this.multipleDisplayValue;
		} else {
			return value.join(this.delimeter + ' ');
		}
	},

    getCheckboxCls:function(record) {
        var i = 0;
        for (; i < this.checkedItems.length; i++) {
            if ( record[this.valueField] == this.checkedItems[i].data[this.valueField] ) {
                return 'x-grid3-check-col-on';
            }
        }

        return 'x-grid3-check-col';
    },

    getCheckedRecords:function() {
        return this.checkedItems;    
    },

    onSelect : function (record, checkedIndex) {
        var index;

        index = this.findCheckedRecord(record);
        
        if (this.fireEvent("beforeselect", this, record, checkedIndex) !== false) {
			if (index === -1) {
			    this.checkedItems.push(record);
			} else {
			    this.checkedItems.remove( this.checkedItems[index]);
			}

            this.refreshItem(record);

			this.setValue(this.getValue());
            this.fireChangeEventOnDemand();
            this.fireEvent("select", this, this.checkedItems);
        }
	},

    /**
     * Чтобы сохранить совместимость c концепцией изменения полей ExtJS
     * приходится имитировать поведение Ext.form.Field.onBlur().
     * иначе событие 'change' у нашего поля никогда не вызывается.
     */
    fireChangeEventOnDemand: function(){
        var newValue = this.getValue();
        if (String(newValue) !== String(this.startValue)){
            this.fireEvent('change', this, newValue, this.startValue);
        }
        this.startValue = newValue;
    },

    refreshItem:function(record) {
        if (this.view) {
            this.view.refreshNode(this.store.indexOf(record));
        }
    },

    onSelectInDictionary: function(){
		if(this.fireEvent('beforerequest', this)) {
			Ext.Ajax.request({
				url: this.actionSelectUrl
				,method: 'POST'
				,params: this.actionContextJson
				,success: function(response){
				    var win = smart_eval(response.responseText);
				    if (win){
                        win.initMultiSelect(this.checkedItems);
				        win.on('closed_ok',function(records){
                            this.addRecordsToStore( records);
                            this.fireChangeEventOnDemand();
                            this.fireEvent('select', this, this.checkedItems);
				        }, this);
				    }
				}
				,failure: function(response, opts){
					window.uiAjaxFailMessage.apply(this, arguments);
				},
                scope:this
			});
		}
	},

    /**
     * Срабатывает при нажатии на кнопку "Очистить".
     * Отменяет выбор в DataView this.view и очищает строку на форме.
     */
    clearValue:function() {
        this.checkedItems.splice(0, this.checkedItems.length);
        if (this.view)
            this.view.refresh();

        this.setValue(this.getValue());
        this.fireChangeEventOnDemand();
    },

    addRecordsToStore: function(records){
    	var i = 0, newRecords = [], record;

        for (; i< records.length;i++) {
            record = new Ext.data.Record();
            record.data[this.valueField] = records[i].data[this.valueField];
            record.data[this.displayField] = records[i].data[this.displayField];
            newRecords.push( record );
        }

        this.checkedItems = newRecords;
        if (this.view)
            this.view.refresh();
        this.setValue(this.getValue());
	},

    findCheckedRecord:function(record) {
        var i = 0, index = -1;

        for (; i < this.checkedItems.length;i++) {
            if (this.checkedItems[i].data[this.valueField]
                    === record.data[this.valueField]) {
                index = i;
                break;
            }
        }

        return index;
    }

});

Ext.reg('m3-multiselect', Ext.m3.MultiSelectField );
