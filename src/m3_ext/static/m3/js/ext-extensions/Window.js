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
             * Событие, которое всплывает от компонентов внутри вызова функции getContext()
             * и возвращает вызов связанной функции, подписка происходит внутри fabric.js
             */
            'gethandler'
        );

        var loadMask = new Ext.LoadMask(this.getEl(), {msg: 'Загрузка...'}),
            loadMaskCount = 0;
        this.on('mask', function (cmp, maskText, win) {
            loadMask.msgOrig = loadMask.msg;
            loadMask.msgClsOrig = loadMask.msgCls;
            if (maskText){
                loadMask.msg = maskText;
                loadMask.msgCls = 'x-mask';
            }
            loadMask.show();
            loadMaskCount++;

            if (win instanceof Ext.m3.Window) {
                this.on('activate', win.activate, win);
            }

        }, this);

        this.on('unmask', function (cmp, win) {
            loadMaskCount--;
            if (loadMaskCount <= 0) {
                loadMask.hide();
                if (win instanceof Ext.m3.Window) {
                    this.un('activate', win.activate, win);
                }
            }
            loadMask.msg = loadMask.msgOrig;
            loadMask.msgCls = loadMask.msgClsOrig;
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

    bind: Ext.emptyFn,

    /**
     * Блокировка окна от изменений. Вызывает каскадно setBlocked
     * @param blocked - признак блокировки bool
     * @param exclude - список itemId элементов исключаемых из блокирования
     */
    setBlocked: function(blocked, exclude) {
        var me = this,
            containers = [
                this,
                this.getTopToolbar(),
                this.getBottomToolbar(),
                this.getFooterToolbar()
            ];
        Ext.each(containers, function(cont) {
            if (cont) {
                cont.cascade(function (item) {
                    if (me != item) {
                        item.setBlocked(blocked, exclude || []);
                    }
                });
            }
        });
    }
});