
M3 = {};

M3.Ext = (function() {

    var _config;

    function createFabric() {

        var fabric = new M3.Ext.Fabric(
            Ext, {
                strictConfigLoad: true,
                useLoading: true,
                waitWarmUp: true
            }
        );

        var preloadConfig = _config.preloadWindows || [];

        //у фабрики можно запустить режим предварительной загрузки
        //всех конфигураций, сохранении их в хранилище и регистрации классов в менеджере
        //все вызовы функции рисования виджетов будут ожидать окончания этого процесса
        fabric.runWarmUp(preloadConfig);

        return fabric;
    }

    return {

        setConfig: function(config) {
            //переконфигурирование не разрешено
            //установка глобального конфига оформлена в виде getterа 
            //чтобы исключить переписывание конфига
            //переменная конфиг скрыта (private)
            if (_config === undefined) {

                var storage, loader;

                if (!config.storage) {
                    throw new Error("Config Error - Storage must be specified!");
                }

                if (!config.loader) {
                    throw new Error("Config Error - Loader must be specified!");
                }

                _config = Ext.apply({}, config);

                //создаем новую фабрику
                
                _config.fabric = createFabric(config.loader, config.storage);

            } else {
                throw new Error("Config Error - Trying to overwrite config!");
            }
        },

        getLoader: function() {
            return _config.loader;  
        },

        setLoader: function(loader) {
            //при изменениях загрузчика нужно создать новую фабрику
            _config.loader = loader;
            _config.fabric = createFabric(loader, _config.storage);
        },

        getStorage: function() {
            return _config.storage;
        },

        setStorage: function(storage) {
            //при изменениях хранилища также нужно создать новую фабрику
            _config.storage = storage;
            _config.fabric = createFabric(_config.loader, storage);
        },

        create: function(config) {
            //public метод для создания окон
            return _config.fabric.create(config);
        }
    }
})();