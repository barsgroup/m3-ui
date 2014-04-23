/**
 * "Класс" для построения UI
 */
function UI(config) {
    var that = this;

    this.confStorage = config['confStorage']; // хранилище базовых конфигураций окон
    this.uiFabric = config['uiFabric'];       // собственно, формирователь UI

    this.create = function (data) {         // словарь параметров должен содержать
        var customConfig = data['config'], // - config экземпляра окна
            initialData = data['data'],    // - словарь данных для инициализации
            key = data['ui'];              // - key, однозначно идентифицирующий окно в хранилище


        // грузим конфиг из хранилища...
        return that.confStorage(key).then(function (result) {
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
                    if (config['debug']){
                        require.undef(config['staticPrefix'] + module + '.js');
                    }

                    result.resolve(cfg);
                });

            }

            return result.promise;

        }).then(function (cfgAndData) {
            // формируем UI widget
            return that.uiFabric(cfgAndData[0]);
        });
    };
}

/**
 * Загружает JSON AJAX-запросом и кладёт в promise
 */
UI.ajax = function (url, params, queryString) {
    var result = Q.defer(),
        fullUrl = url + (queryString != undefined ? ("?" + queryString) : "");

    Ext.Ajax.request({
        url: fullUrl,
        method: 'GET',
        params: params || {},
        success: function (response) {
            result.resolve(response.responseText);
        },
        failure: function (response) {
            result.reject(new Error(response.responseText));
        }
    });
    return result.promise;
};
