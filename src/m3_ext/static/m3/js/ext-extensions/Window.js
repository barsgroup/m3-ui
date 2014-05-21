/**
 * Окно на базе Ext.Window
 */

Ext.define('Ext.m3.Window', {
    extend: 'Ext.Window',
    xtype: 'm3-window',

    constructor: function (baseConfig, params) {
        params = baseConfig.params || params;

        // Ссылка на родительское окно
        this.parentWindow = null;

        // Контекст
        this.actionContextJson = null;

        if (params && params.parentWindowID) {
            this.parentWindow = Ext.getCmp(params.parentWindowID);
        }

        if (params && params.helpTopic) {
            this.m3HelpTopic = params.helpTopic;
        }

        if (params && params.contextJson) {
            this.actionContextJson = params.contextJson;
        }

        // на F1 что-то нормально не вешается обработчик..
        //this.keys = {key: 112, fn: function(k,e){e.stopEvent();console.log('f1 pressed');}}

        // Поиск хендлера для кнопок и других компонент
        this.listeners['gethandler'] = function (cmp, handler) {
            if (Ext.isFunction(this[handler])){
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
            'unmask'
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

    activate: function () {
        this.toFront();
    },

    initTools: function () {
        if (this.m3HelpTopic) {
            var m3HelpTopic = this.m3HelpTopic;
            this.addTool({id: 'help', handler: function () {
                showHelpWindow(m3HelpTopic);
            }});
        }
        Ext.m3.Window.superclass.initTools.call(this);
    }
});