'use strict';

Ext.m3.AdvancedScrollComboBox = Ext.extend(Ext.m3.AdvancedComboBox, {

    constructor: function (baseConfig, params) {

        // Количество записей, прокрученных вниз, в выпадающем списке
        this.scrolled = 0;


        Ext.m3.AdvancedScrollComboBox.superclass.constructor.call(this, baseConfig, params);
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
            startScroll; 
        e.stopPropagation();
        if ((item) && (scrollLimit > 0)) {
            cached = (t.scrollTop + t.offsetHeight) / item.offsetHeight >> 0;
            if ((t.scrollTop === 0) || (cached === scrollLimit)) {
                if (t.scrollTop > 0) { 
                    startScroll = this.scrolled + (t.scrollTop / item.offsetHeight >> 0);
                } else { 
                    startScroll = this.scrolled - scrollLimit;
                }
                if (startScroll < 0) {
                    startScroll = 0;
                }
                this.scrolled = startScroll;
                this.store.reload({
                    params: {
                        start: startScroll,
                        limit: scrollLimit
                    }
                });
            }
        }
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

