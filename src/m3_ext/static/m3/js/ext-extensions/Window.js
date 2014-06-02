/**
 * Окно на базе Ext.Window
 */
Ext.define('Ext.m3.Window', {
    extend: 'Ext.Window',
    xtype: 'm3-window',

    helpTopic: null,

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
            assert(this.helpTopic instanceof Array);
            assert(this.helpTopic.length > 0);

            var url = this.helpTopic[0] + '.html';
            if (this.helpTopic.length == 2){
                url += '#' + this.helpTopic[1];
            }
            this.addTool({id: 'help', handler: function () {
                showHelpWindow(url);
            }.bind(this)});
        }
        this.callParent();
    },

    /**
     * Поиск элемента по itemId
     * @param itemId - что нужно искать
     * @returns {*} Нашедшийся элемент
     */
    findByItemId: function(itemId){
        var containers = [
            this,
            this.getTopToolbar(),
            this.getBottomToolbar(),
            this.getFooterToolbar()
        ];
        var result;
        Ext.each(containers, function(cont) {
            if (cont) {
                var res = cont.find('itemId', itemId)[0];
                if (res) {
                    result = res;
                    return false;
                }
            }
        }, this);
        return result;
    },

    bind: Ext.emptyFn
});