/**
 * User: Vadim
 * Date: 20.02.12
 *
 * Крутой NumberField, расширенный возможностями из ExtJS 4. Позволяющий правильно форматировать
 * деньги и показывать валюту. Основано на исходниках с форума:
 * http://www.sencha.com/forum/showthread.php?125935-Number-field-with-currency-symbol-thousand-separator-with-international-support
 */

Ext.override(Ext.form.NumberField, {
    //у поля в питоне должен быть опредлен параметр decimal_separator= ','
    //иначе джанга не сохранит числа с точкой
    decimalSeparator: ',',

    // Строка отображающая валюту
    currencySymbol: null,

    // Включает разделение числа на тысячи
    useThousandSeparator: true,

    // Разделитель тысяч
    thousandSeparator: ' ',

    // Всегда включает показ дробной части, если включен allowDecimals
    alwaysDisplayDecimals: true,

    // Выравнивание
    currencySymbolPosition: 'before',
    numberFieldAlign: 'left',

    /**
     * Override initComponent to check valid arguments
     */
    initComponent: function() {
        if ((this.currencySymbolPosition != 'before') && (this.currencySymbolPosition != 'after')) {
            this.currencySymbolPosition = 'before';
        }
        if ((this.numberFieldAlign != 'left') && (this.numberFieldAlign != 'right')) {
            this.numberFieldAlign = 'left';
        }
        if (this.useThousandSeparator && Ext.isEmpty(this.thousandSeparator)) {
            this.thousandSeparator = ',';
        }
        if ((this.allowDecimals) && Ext.isEmpty(this.decimalSeparator)) {
            this.decimalSeparator = '.';
        }
        if ((this.allowDecimals) && (this.thousandSeparator == this.decimalSeparator)) {
            throw (this.name + ' [NumberFormatException]: thousandSeparator must be different from decimalSeparator.');
        }

        var initialConfig = {
            style: 'text-align:' + this.numberFieldAlign + ';'
        };

        if (this.allowDecimals){
            // Добавляем точку к допустимым символам
            this.baseChars +='.'
        }

        Ext.apply(this, Ext.apply(this.initialConfig, initialConfig));
        Ext.form.NumberField.superclass.initComponent.call(this, arguments);
    },

    onRender: function() {
        Ext.form.NumberField.superclass.onRender.apply(this, arguments);
        this.hiddenField = this.el.insertSibling({
            tag: 'input',
            type: 'hidden',
            name: this.name,
            value: (this.isValid() ? this.getValue() : '')
        });
        this.hiddenName = name;
        this.el.dom.removeAttribute('name');
    },

    setValue: function(v) {
        Ext.form.NumberField.superclass.setValue.call(this, v);
        this.setRawValue(this.getFormattedValue(this.getValue()));

        // Поле может находиться в ещё не отрисовавшемся контейнере, т.е. onRender не был вызван
        if (this.hiddenField !== undefined){
            this.hiddenField.dom.value = this.getValue();
        }
    },

    /**
     * No more using Ext.util.Format.number, Ext.util.Format.number in ExtJS versions
     * less thant 4.0 doesn't allow to use a different thousand separator than "," or "."
     * @param {Number} v
     */
    getFormattedValue: function(v) {
        if (Ext.isEmpty(v) || !this.hasFormat()) {
            return v;
        } else {
            var neg = null;
            v = (neg = v < 0) ? v * -1 : v;
            v = this.allowDecimals && this.alwaysDisplayDecimals ? v.toFixed(this.decimalPrecision) : v;
            if (this.useThousandSeparator) {
                v = String(v);
                var ps = v.split('.');
                ps[1] = ps[1] ? ps[1] : null;
                var whole = ps[0];
                var r = /(\d+)(\d{3})/;
                var ts = this.thousandSeparator;
                while (r.test(whole)) {
                    whole = whole.replace(r, '$1' + ts + '$2');
                }
                v = whole + (ps[1] ? this.decimalSeparator + ps[1] : '');
            }
            if (this.currencySymbolPosition == 'before') {
                return String.format('{0}{1}{2}', (Ext.isEmpty(this.currencySymbol) ? '' : this.currencySymbol + ' '), (neg ? '-' : ''), v);
            } else {
                return String.format('{0}{1}{2}', (neg ? '-' : ''), v, (Ext.isEmpty(this.currencySymbol) ? '' : ' ' + this.currencySymbol));
            }
        }
    },

    /**
     * overrides parseValue to remove the format applied by this class
     */
    parseValue: function(v){
        //Replace the currency symbol and thousand separator
        var value = this.removeFormat(v);
        value = parseFloat(String(value).replace(this.decimalSeparator, "."));
        return isNaN(value) ? '' : value;
    },

    /**
     * Remove only the format added by this class to let the superclass validate with it's rules.
     * @param {Object} v
     */
    removeFormat: function(v) {
        if (v) {
            v = (v.replace(this.currencySymbol, '')).trim();
            v = this.useThousandSeparator ? v.replace(new RegExp('[' + this.thousandSeparator + ']', 'g'), '') : v;
        }
        return v;
    },

    /**
     * Remove the format before validating the the value.
     * @param {Number} v
     */
    getErrors: function(v) {
        var num = this.getValue();
        var errors = [];

        if (num.length < 1 || num === this.emptyText) {
            if (this.allowBlank) {
                return errors;
            } else {
                errors.push(this.blankText);
            }
        }
        if (isNaN(num)) {
            errors.push(String.format(this.nanText, num));
        }
        if (num < this.minValue) {
            errors.push(String.format(this.minText, this.minValue));
        }
        if (num > this.maxValue) {
            errors.push(String.format(this.maxText, this.maxValue));
        }
        return errors;
    },

    hasFormat: function() {
        return this.decimalSeparator != '.' || this.useThousandSeparator == true || !Ext.isEmpty(this.currencySymbol) || this.alwaysDisplayDecimals;
    },

    /**
     * Display the numeric value with the fixed decimal precision and without the format using the setRawValue, don't need to do a setValue because we don't want a double
     * formatting and process of the value because beforeBlur perform a getRawValue and then a setValue.
     */
    onFocus: function() {
        Ext.form.NumberField.superclass.onFocus.call(this, arguments);
        this.setRawValue(this.removeFormat(this.getRawValue()));
    }
    /**
     * Отличается от оригинального тем, что полюбому устанавливает значение, а не только при "не пустом значении"
     */
    ,beforeBlur : function(){
        var v = this.parseValue(this.getRawValue());
        this.setValue(v);
    }
});
