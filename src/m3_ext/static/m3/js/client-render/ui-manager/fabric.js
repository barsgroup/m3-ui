

var M3 = M3 || {Ui: {}};


M3.Ui.Fabric = function(ns, config) {

    "use_strict";

    /**
     * @ns      {Object} - простанство имен для инициализации компонентов фабрики
     * @loader  {Object} - экземпляр объекта загрузчика статических файлов конфигураций
     * @storage {Object} - экземпляр объекта хранилища json-конфигураций объектов UI
     * @config  {Object} - объект конфигурации фабрики
     * @config  {Boolean} useRegistry
     *      признак того что необходимо производить регистрацию виджетов в менеджере компонентов
     *      это позволяет использовать фабричный метод для инстанцирования экземпляров
     * @config  {Boolean} standaloneConfigStorage
     *      признак того что необходимо использовать хранилище конфигураций UI
     */
    //определяем библиотеку которая предоставляет объекты Deferred, Promise
    //http://promises-aplus.github.io/promises-spec/
    var deft = window.Deft, //www.deftjs.org
        qlib = window.Q,    //https://github.com/kriskowal/q‎
        that = this, storage, loader,
        defaultWidgetCls,
        strictConfigLoad;

    loader = this.loader = config['loader'];
    storage = this.storage = config['storage'];
    //признак того что наличия предзагруженного конфига для окна обязательно
    strictConfigLoad = this.strictConfigExpect = config['strictConfigLoad'];

    defaultWidgetCls = (ns.window && ns.window.Window) || ns.Window;

    //различные варианты реализации promise объектов
    M3.Ui.Deferred = (ns && deft && deft.Deferred && ns.create('Deft.Deferred')) ||
                      (qlib && qlib.defer);

    this.ns = ns;
    Ext.apply(this, config);

    //получим promise для процесса первоначальной загрузки
    this.warmDeferred = M3.Ui.Deferred();
    this.warmPromise = this.warmDeferred.promise;

    this.getOrRegisterPromise = function(config) {
        /**
         * метод регистрация класса виджета в менеджере и загрузка-сохранение его конфигурации
         * в хранилище
         */
        var key, widgetClass = defaultWidgetCls, df, promise;

        var onlyXtype = function(obj) {
            //проверка что конфигурация состоит из одного элемента xtype
            var counter = 0, xtype;

            for (var at in obj) {
                if (obj.hasOwnProperty(at)) {
                    counter +=1;
                    xtype = at;
                }
            }

            return xtype == "xtype" && counter == 1;
        };

        var saveConfigPromise = function(conf) {
            /**сохранение конфигурации в хранилище
             * @return - возвращает promise объект
             */
            var deferred = M3.Ui.Deferred();
            //метод установки значения в хранилище должен возвращать класс объекта
            //и его конфигурацию в случае успешной регистрации
            result = storage.set(key, conf);
            var regWidget = result[0],
                regConfig = result[1];

            deferred.resolve(regWidget, regConfig);
            return deferred.promise;
        };

        var loadConfigPromise = function(key) {
            /**
             * @return - возвращает класс зарегистрированного компонента и конфигурацию
             */
            return loader.require(key)
            .then(
               function(loadedConfig) {
                //после загрузки конфига
                return saveConfigPromise(loadedConfig);

            }, function() {
                //если не смогли загрузить конфиг
                //то сохраняем в хранилище объект
                var msg;
                msg = "WIDGET CONFIG LOAD-MISSED!"
                if (!config || strictConfigLoad) {
                    //если не задана конфигурация по умолчанию то должен 
                    //отработать таймаут на разрешение deferred объекта
                    console.log("NO CONFIG!");
                    return Q.reject(new Error(msg));

                } else {

                    return saveConfigPromise(config);
                }
            });

        };

        if (storage) {

            key = config[storage.keyName];
            //assert(key, 'Please provide keyName attribute to store widget config');
            widgetClass = storage.get(key);
            //если виджет не найден в хранилище то загрузим его конфиг и зарегистрируем новый класс
            if (!widgetClass) {
                // console.log("GET CLASS FROM REGISTER -> MISSED!");
                if (loader) {
                    promise = loadConfigPromise(key);
                }

            } else {
                // console.log("GET CLASS FROM REGISTER -> OK!");
                var configFromStorageLoaded = storage.getConfig(key);
                //если не найден конфиг виджета, то грузим его загрузчиком
                if (!configFromStorageLoaded) {
                    // console.log("GET CONFIG FROM STORAGE -> MISSED!");
                    if (loader) {
                        promise = loadConfigPromise(key);
                    }

                } else {
                    //конфиг уже в хранилище, возьмем его оттуда
                    // console.log("GET CONFIG FROM STORAGE -> OK!");
                    df = M3.Ui.Deferred();
                    configFromStorageLoaded["xtype"] = key;
                    df.resolve(configFromStorageLoaded);
                    promise = df.promise;
                }

            }
        }

        return promise;
    };

    var waitLoad = function(config) {

        var wgt, outerPromise, deferred = M3.Ui.Deferred();

        outerPromise = deferred.promise;
        wgt = new defaultWidgetCls(config);

        if (storage) {

            outerPromise = that.getOrRegisterPromise(config);

            outerPromise.done(
                function(widget) {
                    deferred.resolve(widget);
                }
            );

        } else {
            //прозрачный режим когда неиспользуется хранилище
            deferred.resolve(wgt);
        }
        
        return outerPromise;
    };

    this.runWarmUp = function(staticList) {
        //запускаем режим прогрева (загрузка всех виджетов)
        //если выставлен атрибут ленивой инициализации окон
        //окна запрошенные после запуска этого режима будут
        //ожидать завершения режима прогрузки

        var chain = [], df = this.warmDeferred;

        //режим прогрузки будет проигнорирован
        if (staticList.length == 0) {
            df.resolve();
            return df.promise;
        }

        for (var l = 0; l < staticList.length; l++) {

            var fc = (function(id) {
                // console.log("warming -> " + id);
                // console.dir(staticList[id]);
                var undoneFunction = function() {
                    return waitLoad(staticList[id]);
                };

                var doneFunction = function() {
                    var p;
                    p = undoneFunction().done(function() {
                        df.resolve();
                        that.warmUpModeOff = true;
                    });
                    return p;
                };
                var retfunc;

                retfunc = undoneFunction;
                if (id == (staticList.length - 1)) {
                    retfunc = doneFunction;
                }

                return retfunc;

            })(l);

            chain.push(fc);
        }
        //shortcut для цепочного исполнения promises
        //привязан к реализации библиотеки Q.js
        return chain.reduce(Q.when, Q());
    };

    var onPostWarmUpMode = function(widget, configExtension) {
        //метод для финальной отрисовки окна/виджета
        //вызов метода происходит после окончания процесса подготовки (warmUp)
        
        var widgetConfig, confFromStorage;

        confFromStorage = storage.getConfig(widget.xtype);
        widgetConfig = confFromStorage;
        //добавляем параметры в загруженную конфигурацию
        console.log("TEST");
        console.dir(configExtension);
        if (configExtension) {
            widgetConfig = Ext.apply(widgetConfig, configExtension);
        }

        if (typeof(widget) == "object") {
            var unionConf = Ext.apply(widget, configExtension);
            widget = ns.create(unionConf);
        }

        //передали конструктор ранее зарегистрированного окна/виджета
        if (typeof(widget) == "function") {
            widget = new widget(widgetConfig || {});
        }

        return widget;
    };

    this.create = function(config) {
        /**
            @config {Object} - конфигурацию которой будет доопределена конфигурация из хранилища
         */
        var that = this, outerPromise, innerDeferred = M3.Ui.Deferred();

        outerPromise = innerDeferred.promise;

        that.warmPromise.done(function() {

            that.getOrRegisterPromise(config)
            .then(
            function(widget) {
                var win = onPostWarmUpMode(widget, config); 
                innerDeferred.resolve(win);
            },
            function() {
                innerDeferred.reject(new Error("config load failed!"));
            });

        });

        outerPromise.timeout(3000, "Время ожидания истекло").catch(
            function() {
            console.log("Window not rendered!");
        });

        return outerPromise;
    };

    this.destroy = function(widget) {
        widget.destroy();
    }
};