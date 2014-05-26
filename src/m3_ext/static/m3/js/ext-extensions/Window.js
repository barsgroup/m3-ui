/**
 * Окно на базе Ext.Window
 */

Ext.define('Ext.m3.Window', {
    extend: 'Ext.Window',
    xtype: 'm3-window',

    constructor: function (baseConfig) {

        // на F1 что-то нормально не вешается обработчик..
        //this.keys = {key: 112, fn: function(k,e){e.stopEvent();console.log('f1 pressed');}}

        // Поиск хендлера для кнопок и других компонент
        this.listeners['gethandler'] = function (cmp, handler) {
            if (Ext.isFunction(this[handler])) {
                cmp.handler = this[handler].createDelegate(this);
            }
        }.bind(this);

        this.callParent(arguments);

        this.addEvents(
            /**
             * Событие назначения маски на окно, всплывает из дочерних компонент
             * Параметры:
             *  this - ссылка на окно
             *  cmp - ссылка на компонент, который послал событие
             *  maskText - текст, который должен отобразиться при маскировании
             *  win - ссылка на дочернее окно
             */
            'mask',

            /**
             * Событие снятия маски с окна, всплывает из дочерних компонент
             * Параметры:
             *  this - ссылка на окно
             *  cmp - ссылка на компонент, который послал событие
             *  win - ссылка на дочернее окно
             */
            'unmask',

            /**
             *
             */
            'gethandler'
        );

        var loadMask = new Ext.LoadMask(this.getEl(),
            {msg: 'Загрузка...', msgCls: 'x-mask'});

        this.on('mask', function (cmp, maskText, win) {
            loadMask.msgOrig = loadMask.msg;
            loadMask.msg = maskText || loadMask.msg;
            loadMask.show();

            if (win instanceof Ext.m3.Window) {
                this.on('activate', win.activate, win);
            }

        }, this);

        this.on('unmask', function (cmp, win) {
            loadMask.hide();
            loadMask.msg = loadMask.msgOrig;
            if (win instanceof Ext.m3.Window) {
                this.un('activate', win.activate, win);
            }
        }, this);
    },

    /**
     * Выводит окно на передний план
     */
    activate: function () {
        this.toFront();
    },

    initTools: function () {
        if (this.helpTopic) {
            this.addTool({id: 'help', handler: function () {
                showHelpWindow(this.helpTopic);
            }.bind(this)});
        }
        Ext.m3.Window.superclass.initTools.call(this);
    },

    /**
     * Поиск элемента по itemId
     * @param itemId - что нужно искать
     * @returns {*} Нашедший элемент
     */
    findByItemId: function(itemId){
        return this.find('itemId', itemId)[0];
    }
});