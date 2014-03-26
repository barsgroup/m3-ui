
var M3 = M3 || {Ui: {}};

M3.AbcUiMgr = {
    setConfig: function(config) {
        //переконфигурирование не разрешено
        //установка глобального конфига оформлена в виде getterа
        //чтобы исключить переписывание конфига
        //переменная конфиг скрыта (private)

        var _config = this._config || {};

        if (_config === undefined || !this.configAsSingleton) {

            if (!config.storage) {
                throw new Error("Config Error - Storage must be specified!");
            }

            if (!config.loader) {
                throw new Error("Config Error - Loader must be specified!");
            }

            _config = Ext.apply({}, config);

            //создаем новую фабрику

            this._config = _config;
            _config.fabric = this._createFabric(config.loader, config.storage);

        } else {
            throw new Error("Config Error - Trying to overwrite config!");
        }
    },
    getConfig: function() {
        var conf = this._config;
        //возвращаем копию конфига
        return Ext.apply({}, conf);
    },

    getLoader: function() {
        return this._config.loader;
    },

    setLoader: function(loader) {
        //при изменениях загрузчика нужно создать новую фабрику
        this._config.loader = loader;
        this._config.fabric = this._createFabric(loader, this._config.storage);
    },

    getStorage: function() {
        return this._config.storage;
    },

    setStorage: function(storage) {
        //при изменениях хранилища также нужно создать новую фабрику
        this._config.storage = storage;
        this._config.fabric = this._createFabric(this._config.loader, storage);
    },

    create: function(config) {
        //public метод для создания окон
        return this._config.fabric.create(config);
    }
};

M3.UiMgr = function(config) {

    //конструктор объекта менеджера
    //@config - глобальный объект конфигурации менеджера
    this._createFabric = function(loader, storage) {

        var fabric = new M3.Ui.Fabric(
            Ext, {
                strictConfigLoad: true,
                useLoading: true,
                waitWarmUp: true,
                loader: loader,
                storage: storage
            }
        );

        var preloadConfig = this._config.preloadWindows || [];

        //у фабрики можно запустить режим предварительной загрузки
        //всех конфигураций, сохранении их в хранилище и регистрации классов в менеджере
        //все вызовы функции рисования виджетов будут ожидать окончания этого процесса
        fabric.runWarmUp(preloadConfig);

        return fabric;
    };
    //параметр отключающий проверку единственности конфига
    //(т.е возможности переконфигурировать в рантайме)
    this.configAsSingleton = false;
    //копируем конфиг
    this.setConfig(config);
};

M3.UiMgr.prototype = M3.AbcUiMgr;