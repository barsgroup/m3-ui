/**
 * "Класс" для построения UI
 *
 * @param config
 * @constructor
 */
UI = function (config) {
    var desktop = config['desktop'], // Ссылка на рабочий стол, в контексте которого создаются окна
        storage = config['storage'], // хранилище базовых конфигураций окон
        create = config['create'];       // собственно, формирователь UI

    UI.createWindow = function (cfg, data) {
        var win;

        cfg.listeners = cfg.listeners || {};
        cfg.listeners['getcontext'] = function (cmp) {
            cmp._getContext = function () {
                return data.context;
            }
        };

        win = create(cfg);
        if (Ext.isFunction(win.bind)) {
            win.bind(data);
        }
        desktop.getDesktop().createWindow(win).show();
        return win;
    };

    UI.create = function (data) {
        // словарь параметров должен содержать
        var initialData = data['data'], // - словарь данных для инициализации
            key = data['ui'];           // - key, однозначно идентифицирующий окно в хранилище

        // грузим конфиг и данные из хранилища...
        return storage(key)
            .then(function (result) {
                // данные затем патчим инициализирующими данными
                var data = Ext.apply(result.data || {}, initialData || {});
                // контекст должен браться только из изначальногго запроса
                data.context = initialData.context || {};
                return [result.config, data];
            }).spread(function (cfg, data) {
                // Подтягиваем зависимости
                return UI.require([cfg['xtype']])
                    .then(function () {
                        return [cfg, data]
                    })

            }).spread(UI.createWindow);
    };
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

    Ext.Ajax.request(Ext.applyIf({
        success: function () {
            result.resolve.apply(this, arguments);
        },
        failure: function (response) {
            result.reject(response);
        }
    }, cfg));
    return result.promise;
};

/**
 * Загружает JSON AJAX-запросом и кладёт в promise
 * @param form
 * @param cfg
 * @returns {promise|Q.promise}
 */
UI.submit = function (form, cfg) {
    var result = Q.defer(),

        obj = Ext.applyIf({
            success: function () {
                result.resolve.apply(this, arguments);
            },
            failure: function (response) {
                result.reject(response);
            }
        }, cfg);
    form.getForm().submit(obj);
    return result.promise;
};

UI.showMsg = function (obj) {
    var result = Q.defer();
    if (obj.message) {

        Ext.Msg.show({
            title: 'Внимание',
            msg: obj.message,
            buttons: Ext.Msg.OK,
            fn: function () {
                if (obj.success) {
                    result.resolve(obj);
                } else {
                    result.reject(null);
                }
            },
            icon: (!obj.success) ? Ext.Msg.WARNING : Ext.Msg.Info
        });
    } else {
        result.resolve(obj);
    }
    return result.promise;
};

/**
 *
 * @param response
 * @returns {*}
 */
UI.evalResult = function (response) {
    return new Q()
        .then(JSON.parse.createDelegate(this, [response.responseText]))
        .then(UI.showMsg)
        .then(function (obj) {
            if (obj.code) {
                if (obj.code.ui) {
                    return UI.create(obj.code);
                } else {
                    return obj.code;
                }
            } else {
                return obj;
            }
        }.bind(this));
};

UI.callAction = function (cfg) {
    return Q()
        .then(this.fireEvent.createDelegate(this, ['mask', this, cfg.loadMaskText]))
        .then(UI.ajax.createDelegate(this, [cfg]))
        .then(UI.evalResult)
        .then(cfg.success)
        .catch(cfg.failure)
        .finally(this.fireEvent.createDelegate(this,
            ['unmask', this]))
        .then(function (win) {
            if (win instanceof Ext.Component) {
                this.fireEvent('mask', this, cfg.mode, win);
                win.on('close',
                    this.fireEvent.createDelegate(this,
                        ['unmask', this, win]), this);
            }
            return win;
        }.bind(this));
};

/**
 * Подгрузка модулей и их зависимостей
 *
 * @param modules
 * @returns {promise|Q.promise}
 */
UI.require = function (modules) {
    var needLoad = [],
        jsLoad,
        result = Q.defer();

    modules.forEach(function (value) {
        if (!Ext.ComponentMgr.isRegistered(value)) {
            needLoad.push(value);
        }
    });

    require(needLoad, function () {
        var requires = [],
            req,
            xtype,
            cls;

        // Собираем requirements
        for (var i = 0; i < arguments.length; i++) {
            xtype = needLoad[i];
            cls = Ext.ComponentMgr.types[xtype];
            if (!cls) {
                result.reject(new Error(String.format(
                    'File name "{0}" and xtype in file name not the same!', xtype)));
                return;
            }

            req = cls.prototype.requires;
            if (req) {
                requires.push(
                    Q.fcall(UI.require.createDelegate(cls), req)
                        .catch(result.reject)
                )
            }
        }
        return Q.all(requires).then(result.resolve);
    }, function (err) {
        // Разрегестриуем такой компонент, если его дочерние requirements не загрузились
        delete Ext.ComponentMgr.types[this.xtype];
        return result.reject(err);
    }.createDelegate(this));

    return result.promise;
};