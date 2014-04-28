/**
 * "Класс" для построения UI
 *
 * @param config
 * @constructor
 */
UI = function (config) {

    this.confStorage = config['confStorage']; // хранилище базовых конфигураций окон
    this.uiFabric = config['uiFabric'];       // собственно, формирователь UI

    UI.create = function (data) {         // словарь параметров должен содержать
        var customConfig = data['config'], // - config экземпляра окна
            initialData = data['data'],    // - словарь данных для инициализации
            key = data['ui'];              // - key, однозначно идентифицирующий окно в хранилище

        // грузим конфиг из хранилища...
        return this.confStorage(key)
            .then(function (result) {
                // ..., который затем патчим конкретным конфигом,...
                var conf = Ext.apply(result.config || {}, customConfig || {}),
                    data = Ext.apply(result.data || {}, initialData || {});
                return [conf, data];
            }).then(function (cfg) {
                var module = cfg[0]['xtype'],
                    result = Q.defer();

                // Не загружаем модули для списка исключений
                if (config['requireExclude'].indexOf(module) >= 0) {
                    result.resolve(cfg);
                } else {

                    require([config['staticPrefix'] + module + '.js'], function () {
                        if (config['debug']) {
                            require.undef(config['staticPrefix'] + module + '.js');
                        }

                        result.resolve(cfg);
                    });

                }

                return result.promise;

            }).then(function (cfgAndData) {
                // формируем UI widget
                return this.uiFabric(cfgAndData[0]);
            }.bind(this));
    }.bind(this);
};

/**
 * Загружает JSON AJAX-запросом и кладёт в promise
 * @param cfg
 * @returns {promise|Q.promise}
 */
UI.ajax = function (cfg) {
    var result = Q.defer();

    cfg = Ext.applyIf(cfg, {
        method: 'GET'
    });

    var obj = Ext.applyIf({
        success: function () {
            result.resolve.apply(this, arguments);
        },
        failure: function (response) {
            result.reject(new Error(response.responseText));
        }
    }, cfg);
    Ext.Ajax.request(obj);
    return result.promise;
};

/**
 *
 * @param cfg
 * @returns {promise|Q.promise}
 */
UI.msgBox = function (cfg) {
    var result = Q.defer();
    Ext.Msg.show(Ext.apply(cfg, {fn: result.resolve}));
    return result.promise;
};

/**
 *
 * @param response
 * @returns {*}
 */
UI.evalResult = function (response) {
    var obj = Ext.decode(response.responseText);
    if (!obj) {
        return null;
    }

    return new Q(
    ).then(function () {
            if (obj.message) {
                return msgBox({
                    title: 'Внимание',
                    msg: obj.message,
                    buttons: Ext.Msg.OK,
                    icon: (
                        obj.success != undefined && !obj.success
                        ) ? Ext.Msg.WARNING : Ext.Msg.Info
                });
            }
            return null;
        }).then(function () {
            if (obj.code) {
                if (obj.code.ui) {

                    return UI
                        .create(obj.code)
                        .then(function (win) {

                            AppDesktop.getDesktop()
                                .createWindow(win)
                                .show();

                            return win;
                        })
                } else {
                    return obj.code;
                }
            } else {
                return obj;
            }
        }.bind(this));
};

/**
 *
 * @param ex
 */
UI.errorShow = function (ex) {
    ex.statusText = ex.message;
    ex.responseText = ex.stack.replace(new RegExp("\n", 'g'), '<br />');

    uiAjaxFailMessage(ex);
    throw ex;
};

/**
 *
 * @param cfg Конфигурация для отправки запроса и получения ui-данных
 *
 * Например:
 *
 *         callAction({
 *            scope: this,
 *            beforeRequest: 'beforenewrequest',
 *            afterRequest: 'afternewrequest',
 *            request: {
 *                url: this.actionNewUrl,
 *                params: params,
 *                success: this.onNewRecordWindowOpenHandler.createDelegate(this),
 *                failure: uiAjaxFailMessage
 *            },
 *            mask: this.loadMask
 *         });
 *
 * @returns {*} q-object
 */
UI.callAction = function (cfg) {

    var scope = cfg['scope'],
        success = cfg['success'] || cfg['request']['success'],
        failure = cfg['failure'] || cfg['request']['failure'],
        beforeRequest = cfg['beforeRequest'],
        afterRequest = cfg['afterRequest'],
        request = cfg['request'],
        mask = cfg['mask'];


    if (beforeRequest && !scope.fireEvent(beforeRequest, scope, request)) {
        // Событие до запроса обработано
        return null;
    }

    if (mask) {
        mask.show();
    }

    var ui = UI.ajax(request);

    if (afterRequest) {
        ui = ui.then(function (res, opt) {
            if (!scope.fireEvent(afterRequest, scope, res, opt)) {
                return Q.reject({'eventProcessed': true});
            }
            return arguments;
        });
        ui = ui.spread(this.evalResult.bind(this));
    } else {
        ui = ui.then(this.evalResult.bind(this));
    }

    if (success) {
        ui = ui.then(success)
    }

    ui = ui.catch(function (e) {
        // Если событие после запроса не обработано
        if (!e['eventProcessed'] && failure) {
            failure(e);
        }
    });

    if (mask) {
        ui = ui.finally(function () {
            mask.hide()
        })
    }
    return ui;
};