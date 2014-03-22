
function assert(condition, errorMsg) {
  if (!condition) {
      console.error(errorMsg);
      throw new Error(errorMsg);
  }
}

var UiManager = UiManager || (function() {
    'use_strict';

    var defaultFabric ,  concreteFabric,
        defaultStorage,  concreteStorage,
        defaultLoader ,  concreteLoader;

    function createWidgetsFabric(custom_fabric) {
        //создаем фабрику виджетов для UI
        var fabric_;
            widgetConstructor = !custom_fabric ?
            (Ext && Ext.window && Ext.window.Window) || (Ext && Ext.Window)
            :custom_fabric;

        if (widgetConstructor) {

            var fabric = function(widget) {
                this.widget = widget;

                this.createWindow = function(config) {
                    debugger;
                    return new widget(config);
                }
            };

            fabric_ = new fabric(widgetConstructor);
        }

        return fabric_;
    }

    function createWidgetsStorage(custom_storage, loader) {
        //создаем хранилище виджетов в статическом хранилище
        //есть одна жесткая зависимость на загрузчик статики

        var ExtStorage = function() {

            this.registerWidgetWithConfig = function(namespace, xtype, baseClass, config) {
                /**
                 * регистрируем класс виджета в менеджере
                 */
                var class_ = Ext.extend(baseClass, {
                    initComponent: function(config) {
                        Ext.apply(this, config);
                        class_.superclass.initComponent.call(this, config);
                    }
                });

                namespace.reg(xtype, class_);
            }
        }

        var SimpleStorage = function () {

            this.getByXtype = function() {
                var service_callback = function() {
                    callback(arguments);
                }

                var widget_cls = this._storage[xtype];

                if (!widget_cls && this.useLoading) {
                    loader.require(widget_cls, service_callback);
                    setTimeout(function() {
                        var last_request = loader.shift();
                        last_request.discard();
                    }, 5000);
                    return 
                }
            }

        }

        var storage_,
            extStorage = Ext && Ext.data && Ext.data.Store,

        defaultStorage = !custom_storage ?
                         extStorage || simpleStorage
                         :custom_storage;

        var storagePrototype;

        baseStoragePrototype = {
            keyName: 'xtype',
            useLoading: false,
            registerWidgetWithConfig: function() {
                //template
            }
        }

        //для хранения конфигов используется Store
        if (defaultStorage == (Ext && Ext.data.Store)) {
            storage_ = new ExtStorage();

        } else {
            //используем упрощенное хранилище конфигов
            storage_ = function() {

                this.setXtype = function() {

                    var xtype_stored = this._storage[xtype],
                        config_stored = this._config_storage[xtype];

                    if (!stored) {
                        this._storage[xtype] = cls;
                    } else {
                        //проверяем загружен ли конфиг
                        if (!config_stored && !this.useDeferredConfig) {
                            throw new Error("Deferred mode is not used! Provide config!");
                        }
                    }                  

                    //если конфиги загружаются отложенно
                    if (this.useDeferredConfig && !config) {
                        loader.require(function(storage, xt) {
                            var w = function() {
                                storage[xt] = config;
                            }
                            return w;
                        })(this._config_storage, xtype);
                    } else {
                        //берем конфиги из хранилища
                        if (config_stored) {
                            this._config_storage[xtype] = config;
                        }
                    }
                };

                this.getByXtype = function() {

                }
            }
        }

        if (defaultStorage) {

            var storage = function(cls) {
                this.cls = cls;

                this.setXtype = function() {

                };

                this.getByXtype = function(xtype) {
                    var cls = Ext.ComponentMgr.get(xtype);
                    //если используется хранение конфигов и регистрация виджетов в менеджере
                    if (this.useWidgetRegistration) {

                    }
                };

                this.getOrSet = function(xtype) {
                    //достаем из хранилища виджет
                    //если не нашли то устанавливаем по ключу
                    var config;

                    if (!this.simplified) {
                        config = this._storage.get(xtype);
                    }

                    if (!config) {
                        if (this.namespace === Ext) {
                            this._storage.addRecord(
                                new Ext.data.Record({
                                    id: xtype,
                                    config: 
                            }))
                        }
                    } else {
                        if (this.namespace === Ext) {
                            registerWidgetWithConfig(this.namespace)
                        }
                    }
                }
            };

            storage_ = new storage;
        }

        return storage_;
    }

    function createStaticLoader(custom_loader, baseUrl, useSimpleLoader) {
        /**
         * useSimpleLoader {Boolean} - если True то используется упрощенный загрузчик
         */
        var loader_;

        defaultLoader = !custom_loader?
            (!simpleLoader && Ext && Ext.Loader) || 
            (simpleLoader && Ext && Ext.Ajax): custom_loader;

        if (defaultLoader) {

            var loader = function(baseUrl) {

                this.baseUrl = baseUrl;

                var afterLoad = function(data, callback, args) {
                    //если используется хранилище то кешируем json-конфиги
                    if (this.useStorage) {
                        var key = this.widgetStorage.keyName;

                        if (data[key]) {
                            this.widgetStorage.getOrSet(data[key]);
                        }
                    };

                    callback.apply(this, args);
                }

                this.require = function(depency, callback) {
                    var fetch_method = defaultLoader.require || defaultLoader.load;
                    if (fetch_method) {
                        fetch_method(depency, afterLoad(callback));
                    } else {
                        if (defaultLoader.request) {
                            defaultLoader.request({
                                url: baseUrl + depency
                                type: 'GET',
                                success: function(data) {
                                    var file = eval(data);
                                    afterLoad(file, callback);
                                }
                            })
                        }
                    }
                }
            };

            loader_ = new loader({baseUrl:baseUrl});
        }

        return loader_;
    }

    var uiMgr = function(config) {

        this.namespace = config['globalNamespace'] || null;

        //создаем
        concreteFabric = createWidgetsFabric(config['custom_fabric']);
        concreteLoader = createStaticLoader(config['custom_loader']);
        //механизм хранения виджетов использует загрузчик
        debugger;
        concreteStorage = createWidgetsStorage(config['custom_storage'], concreteLoader);

        this.widgetFabric = concreteFabric;
        this.widgetStorage = concreteStorage;
        this.widgetLoader = concreteLoader;

        //фабрика должна обеспечивать метод createWindow
        assert(this.widgetFabric.createWindow, "Fabric must provide createWindow method!");
        assert(this.widgetStorage.setXtype, "Storage must provide setXtype method!");
        assert(this.widgetStorage.getByXtype, "Storage must provide getByXtype method");

        this.makeWindow = function(widget_config) {
            /**
             * метод рендеринга представления
             * @widget_config {Object} - json-конфигурация окна
             */
            //достаем объект виджета из хранилища
            var widget_class, key;

            if (this.useStorage) {
                key = concreteStorage.keyName;
                key_value = widget_config[key];
                assert(key_value, 'Key not provided!');
                widget_class = this.getWidgetFromStorage(key, key_value);
            }

            this.widgetFabric.createWindow(widget_class, widget_config);
        };

        this.doFormDataBinding = function() {
            /**
             * метод для загрузки форм
             */
        };

        this.getWidgetFromStorage = function(key, keyValue) {
            /**
             * метод получения объекта виджета из хранилища
             */
             cls = this.widgetLoader.getByXtype(keyValue);
        }

    };

    return uiMgr;
})();

Ext.onReady(function() {
    debugger;
    var mgrExt = new UiManager({globalNamespace: Ext});
    var mgrNonExt = new UiManager({globalNamespace: null});

    //тестим создание окна
    mgrExt.makeWindow({xtype: 'window', 
        width: 600,
        height: 600,
        items: [
        {
            layout: 'border',
            items: [
                {   
                    xtype: 'panel',
                    items: [{
                        xtype: 'text'}
                    ]
                }
            ]
        }
    ]});
})
