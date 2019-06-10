/**
 * Компонент поля даты.
 * Добавлена кнопа установки текущий даты
 */
Ext.m3.AdvancedDataField = Ext.extend(Ext.form.DateField, {
	constructor: function(baseConfig, params){

		// Базовый конфиг для тригеров
		this.baseTriggers = [
			{
				iconCls: 'x-form-date-trigger'
				,handler: null
				,hide:null
			},
			{
				iconCls: 'x-form-current-date-trigger'
				,handler: null
				,hide:null
			}
		];

		this.hideTriggerToday = false;

		if (params && params.hideTriggerToday) {
			this.hideTriggerToday = true;
		}

		Ext.m3.AdvancedDataField.superclass.constructor.call(this, baseConfig);
	}
	,initComponent: function(){
		Ext.m3.AdvancedDataField.superclass.initComponent.call(this);

        this.triggerConfig = {
            tag:'span', cls:'x-form-twin-triggers', cn:[]};

		Ext.each(this.baseTriggers, function(item, index, all){
			this.triggerConfig.cn.push(
				{tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + item.iconCls}
			);
		}, this);

		this.initBaseTrigger()
	},
	initTrigger : function(){
        var ts = this.trigger.select('.x-form-trigger', true);
        var triggerField = this;
        ts.each(function(t, all, index){

            var triggerIndex = 'Trigger'+(index+1);
            t.hide = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = 'none';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = true;
            };
            t.show = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = '';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = false;
            };

            if( this.baseTriggers[index].hide ){
                t.dom.style.display = 'none';
                this['hidden' + triggerIndex] = true;
            }
            this.mon(t, 'click', this.baseTriggers[index].handler, this, {preventDefault:true});
            t.addClassOnOver('x-form-trigger-over');
            t.addClassOnClick('x-form-trigger-click');
        }, this);

        this.triggers = ts.elements;
    }
	,initBaseTrigger: function(){
		this.baseTriggers[0].handler = this.onTriggerClick;
		this.baseTriggers[1].handler = function(){
            if (!this.readOnly && !this.disabled) {
                var today = new Date();
                this.setValue(today);
                this.fireEvent('select', this, today);
            }
		};
		this.baseTriggers[1].hide = this.hideTriggerToday;
	},
	onBlur : function(){
	/*
	   В суперклассе Ext.form.TriggerField данный метод перекрывается пустой функцией,
   	   видимо для того, чтобы все изменения и событие change происходили только при нажатии на триггеры,
 	   но данное поведение весьма неудобно в колоночных фильтрах, где требуется корректное срабатывание
       blur и change при потере фокуса.
	   Данная реализация метода взята из базового класса Ext.formField
	*/
	    this.beforeBlur();
	    if(this.focusClass){
	        this.el.removeClass(this.focusClass);
	    }
	    this.hasFocus = false;
	    if(this.validationEvent !== false && (this.validateOnBlur || this.validationEvent == 'blur')){
	        this.validate();
	    }
	    var v = this.getValue();
	    if(String(v) !== String(this.startValue)){
	        this.fireEvent('change', this, v, this.startValue);
	    }
	    this.fireEvent('blur', this);
	    this.postBlur();
    }

});


/**
 * Компонент поля даты.
 * Добавлена возможность множественного выбора даты.
 */

Ext.m3.MultipleDateField = Ext.extend(
    Ext.m3.AdvancedDataField,
    {
        clsHighlightClass: 'x-date-selected',

        constructor: function(baseConfig, params){
            this.delimiter = params.delimiter;
            this.selectedDates = {};
            this.csvSelectedDates = '';
            Ext.m3.MultipleDateField.superclass.constructor.call(this, baseConfig, params);
        },

        initComponent: function () {
            Ext.m3.MultipleDateField.superclass.initComponent.call(this);
            var me = this;
            // Выставляет даты из значений с сервера
            this.csvSelectedDates = this.value;
            if (this.value) {
                var selectedDates = this.csvSelectedDates.split(this.delimiter);
                selectedDates.forEach(function(date){
                    var dateValue = new Date(date);
                    me.setDateSelected(me, dateValue);
                });
                this.highlightDates();
            }

            // Добавляет события для обработки множественного выбора
            this.on('select', this.handleSelectionChanged, this);
            this.on('afterrender', this.highlightDates, this);
        },

        /* Отрисовываем выбранные даты при открытии датапикера */
        onTriggerClick: function() {
            Ext.m3.MultipleDateField.superclass.onTriggerClick.call(this);
            this.highlightDates();
        },

        /* Переопределение базового метода Ext.form.DateField для отмены закрытия датапикера после клика */
        onSelect: function(m, d){
            this.fireEvent('select', this, d);
            this.setValue(d);
        },

        /* Добавляет дату в список выбранных */
        setDateSelected: function(cmp, date){
            this.selectedDates[date.toDateString()] = this.formatDate(this.parseDate(date));
            var me = this;
            var dates = Object.keys(me.selectedDates).map(function(key) {
                return me.selectedDates[key];
            });
            this.csvSelectedDates = dates.join(', ');
        },

        /* Установка даты как выбранной или не выбранной */
        handleSelectionChanged: function (cmp, date) {
            if (this.selectedDates[date.toDateString()])
                delete this.selectedDates[date.toDateString()];
            else
                this.selectedDates[date.toDateString()] = this.formatDate(this.parseDate(date));
            this.highlightDates();
            var me = this;
            var dates = Object.keys(me.selectedDates).map(function(key) {
                return me.selectedDates[key];
            });
            this.csvSelectedDates = dates.join(', ');
        },

        /* Установка стиля даты как выбранной или не выбранной */
        highlightDates: function () {
            var me = this;
            if (!me.menu) return;
            picker = me.menu.picker;
            if (!picker.cells) return;
            picker.cells.each(function (item) {
                var date = new Date(item.dom.firstChild.dateValue).toDateString();
                if (me.selectedDates[date]) {
                    if (item.getAttribute('class').indexOf(me.clsHighlightClass) === -1) {
                        item.addClass(me.clsHighlightClass)
                    }
                } else {
                    item.removeClass(me.clsHighlightClass);
                }
            });
        },

        /* Переопределенный базовый метод для установки значений через запятую */
        setValue : function(date){
            return Ext.form.DateField.superclass.setValue.call(this, this.csvSelectedDates);
        },

        /* Выполняет проверку даты */
        checkOneDate: function(value) {
            var errors = [];

            value = this.formatDate(value);

            if (value.length < 1) {
                 return errors;
            }

            var svalue = value;
            value = this.parseDate(value);
            if (!value) {                errors.push(String.format(this.invalidText, svalue, this.format));
                return errors;
            }

            var time = value.getTime();
            if (this.minValue && time < this.minValue.clearTime().getTime()) {
                errors.push(String.format(this.minText, this.formatDate(this.minValue)));
            }

            if (this.maxValue && time > this.maxValue.clearTime().getTime()) {
                errors.push(String.format(this.maxText, this.formatDate(this.maxValue)));
            }

            if (this.disabledDays) {
                var day = value.getDay();

                for(var i = 0; i < this.disabledDays.length; i++) {
                    if (day === this.disabledDays[i]) {
                        errors.push(this.disabledDaysText);
                        break;
                    }
                }
            }

            var fvalue = this.formatDate(value);
            if (this.disabledDatesRE && this.disabledDatesRE.test(fvalue)) {
                errors.push(String.format(this.disabledDatesText, fvalue));
            }

            return errors;
        },

        /* Переопределенный базовый метод для корректной валидации значений через запятую */
        getErrors: function() {
            var errors;
            var me = this;
            var dates = Object.keys(me.selectedDates).map(function(key) {
                return me.selectedDates[key];
            });
            dates.forEach(function(date) {
                errors = me.checkOneDate(date);
                if (errors) {
                    return errors;
                }
            });
            return [];
        }
    }
);

Ext.reg('m3-multiple-date', Ext.m3.MultipleDateField);
Ext.reg('m3-date', Ext.m3.AdvancedDataField );