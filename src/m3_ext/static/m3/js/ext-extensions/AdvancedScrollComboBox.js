'use strict';

Ext.m3.AdvancedScrollComboBox = Ext.extend(Ext.m3.AdvancedComboBox, {

    constructor: function (baseConfig, params) {

        // Количество записей, прокрученных вниз, в выпадающем списке
        this.scrolled = 0;

        Ext.m3.AdvancedScrollComboBox.superclass.constructor.call(this, baseConfig, params);

        // Буферный стор для подгрузки записей
        this.bufferStore = new Ext.data.Store({
             model: this.store.model,
             recordType: this.store.recordType,
             proxy: this.store.proxy,
             reader: this.store.reader,
             sortInfo: this.store.sortInfo
        });
        this.bufferStore.on('load', this.onBufferLoad, this);

        this.elem = undefined;
    },

    initComponent: function(){
        var store;
    		Ext.m3.AdvancedScrollComboBox.superclass.initComponent.call(this);
    		store = this.getStore();
    		store.on('load', this.onStoreLoad, this);
  	},

    /**
     * Обработчик события прокрутки списка
     *
     * @param e {Ext.EventObject} The Ext.EventObject encapsulating the DOM event
     * @param t {HtmlElement}     The target of the event
     */
    onScroll: function(e, t) {
        var item = Ext.DomQuery.selectNode('.x-combo-list-item', t),
            scrollLimit = parseInt(this.defaultLimit) || 0,
            cached,
            bufferParams;

        e.stopPropagation();
        this.elem = t;
        if (item && scrollLimit > 0 && this.store.getCount() !== this.store.getTotalCount()) {
            cached = (t.scrollTop + t.offsetHeight) / item.offsetHeight >> 0;
            if ((cached - this.scrolled) === scrollLimit) {
                this.scrolled = cached;
                bufferParams = Ext.applyIf(
                    {
                        start: cached,
                        limit: scrollLimit
                    },
                    this.store.baseParams
                );
                this.bufferStore.load({params: bufferParams});
            }
        }
    },

    /**
     * Обработчик события загрузки данных в буферный стор
     **/
    onBufferLoad: function() {
        var bufferRecords = [],
            nodes,
            node;
        // Перегрузим данные из буферного стора в основной
        this.bufferStore.each(function(b) {
            var isPush = true;
            // Исключим повторение записей в основном сторе
            this.store.data.each(function(s) {
                if (s===b.data) {
                    isPush = false;
                    return false;
                }
            });
            if (isPush) {
                bufferRecords.push(b);
            }
        });
        this.store.add(bufferRecords);

        // Установим классы элементов выпадающего списка
        nodes = Ext.DomQuery.jsSelect('.x-combo-list-item', this.elem);
        for(node in nodes) {
            if (this.store.data.items[node] && this.store.data.items[node].json) {
                if (this.store.data.items[node] && this.store.data.items[node].json && nodes[node].className.indexOf(this.store.data.items[node].json['item_option']) < 0) {
                    nodes[node].className += ' ' + this.store.data.items[node].json['item_option'];
                }
            }
        }
    },

    /**
     * Обработчик события загрузки данных в стор комбобокса
     */
    onStoreLoad: function() {
        // Сбросим количество прокрученных записей
        this.scrolled = 0;
    },

    /**
     * Вызывает метод выпадающего меню у комбобокса
     **/
    onTriggerDropDownClick: function () {
        Ext.m3.AdvancedScrollComboBox.superclass.onTriggerDropDownClick.call(this);
        // Назначим обработчик события onScroll
        if (this.innerList) {
            this.mon(this.innerList, 'scroll', this.onScroll, this);
        }
    }
});
