Ext.ux.MonthPickerPlugin = Ext.extend(Ext.util.Observable,{
    constructor: function(config){
        if (config) Ext.apply(this, config);
        Ext.ux.MonthPickerPlugin.superclass.constructor.call(this);
    }
    ,init: function(pk){
        this.submitFormat = this.submitFormat || 'd.m.Y';
        this.picker = pk;
        this.picker.altFormats = this.submitFormat;
        this.picker.onTriggerClick = this.picker.onTriggerClick.createSequence(this.onClick, this);
        this.picker.baseTriggers[0].handler = this.picker.onTriggerClick;
        this.picker.onRender = this.picker.onRender.createSequence(this.onRender, this);
        this.picker.getValue = this.picker.getValue.createInterceptor(this.setDefaultMonthDay, this).createSequence(this.restoreDefaultMonthDay, this);
        this.picker.setValue = this.picker.setValue.createSequence(this.updateHidden, this);
        this.picker.beforeBlur = this.picker.beforeBlur.createInterceptor(this.setDefaultMonthDay, this).createSequence(this.restoreDefaultMonthDay, this);
        this.picker.onDisable = this.picker.onDisable.createSequence(this.onDisable, this);
        this.picker.onEnable = this.picker.onEnable.createSequence(this.onEnable, this);
    }
    ,setDefaultMonthDay: function() {
        this.oldDateDefaults = Date.defaults.d;
        Date.defaults.d = 1;
        return true;
    }
    ,restoreDefaultMonthDay: function(ret) {
        Date.defaults.d = this.oldDateDefaults;
        return ret;
    }
    ,onClick: function(e, el, opt) {
        var p = this.picker.menu.picker;
        p.activeDate = p.activeDate.getFirstDateOfMonth();
        if (p.value) {
            p.value = p.value.getFirstDateOfMonth();
        }

        p.showMonthPicker();

        if (!p.disabled) {
            p.monthPicker.stopFx();
            p.monthPicker.show();

            p.mun(p.monthPicker, 'click', p.onMonthClick, p);
            p.mun(p.monthPicker, 'dblclick', p.onMonthDblClick, p);
            p.onMonthClick = p.onMonthClick.createSequence(this.pickerClick, this);
            p.onMonthDblClick = p.onMonthDblClick.createSequence(this.pickerDblclick, this);
            p.mon(p.monthPicker, 'click', p.onMonthClick, p);
            p.mon(p.monthPicker, 'dblclick', p.onMonthDblClick, p);
        }
    }

    ,pickerClick: function(e, t) {
        var el = new Ext.Element(t);
        if (el.is('button.x-date-mp-cancel')) {
            this.picker.menu.hide();
        } else if(el.is('button.x-date-mp-ok')) {
            var p = this.picker.menu.picker;
            p.setValue(p.activeDate);
            p.fireEvent('select', p, p.value);
        }
    }

    ,pickerDblclick: function(e, t) {
        var el = new Ext.Element(t);
        if (el.parent()
            && (el.parent().is('td.x-date-mp-month')
            || el.parent().is('td.x-date-mp-year'))) {

            var p = this.picker.menu.picker;
            p.setValue(p.activeDate);
            p.fireEvent('select', p, p.value);
        }
    }

    ,onRender: function(ct, position){
        var name = this.picker.name || this.picker.el.dom.name;
        this.picker.hiddenField = this.picker.el.insertSibling({
            tag:'input'
            ,type:'hidden'
            ,name:name
            ,value: this.formatHiddenDate(this.picker.parseDate(this.picker.value))
        });
        this.picker.hiddenName = name; // otherwise field is not found by BasicForm::findField
        this.picker.el.dom.removeAttribute('name');
        this.picker.el.on({
            keyup:{scope:this, fn:this.updateHidden}
            ,blur:{scope:this, fn:this.updateHidden}
        }, Ext.isIE ? 'after' : 'before');
    }

    ,onDisable: function(){
        if (this.picker.hiddenField) {
            this.picker.hiddenField.dom.setAttribute('disabled','disabled');
        }
    }

    ,onEnable: function(){
        if (this.picker.hiddenField) {
            this.picker.hiddenField.dom.removeAttribute('disabled');
        }
    }

    ,formatHiddenDate: function(date){
        if (!Ext.isDate(date)) {
            return date;
        }
        if ('timestamp' === this.submitFormat) {
            return date.getTime()/1000;
        }
        else {
            return Ext.util.Format.date(date, this.submitFormat);
        }
    }

    ,updateHidden: function() {
        this.picker.hiddenField.dom.value = this.formatHiddenDate(this.picker.getValue());
    }
});