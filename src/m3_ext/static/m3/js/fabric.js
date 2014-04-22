/**
 * "Класс" для построения UI
 */
function UI(config) {
    var that = this;

    // зависимости
    this.jsStorage = config['jsStorage'];     // хранилище JS
    this.confStorage = config['confStorage']; // хранилище базовых конфигураций окон
    this.uiFabric = config['uiFabric'];       // собственно, формирователь UI

    this.create = function(data) {         // словарь параметров должен содержать
        var customConfig = data['config'], // - config экземпляра окна
            initialData = data['data'],    // - словарь данных для инициализации
            key = data['ui'];              // - key, однозначно идентифицирующий окно в хранилище

        return Q.all([
            // грузим конфиг из хранилища...
            that.confStorage(key).then(function(result){
                // ..., который затем патчим конкретным конфигом,...
                var conf = Ext.apply(result.config||{}, customConfig||{}),
                    data = Ext.apply(result.data||{}, initialData||{});
                return [conf, data];
            }),
            // ... и параллельно (с загрузкой конфига) грузим JS
            that.jsStorage(key)
        ]).spread(function(cfgAndData, init){
            // формируем UI widget
            var widget = that.uiFabric(cfgAndData[0]);
            // и вызываем инициализирующую функцию (полученную из jsStorage)
            return Q.fcall(
                init, widget, cfgAndData[1]
            ).then(function(){
                // возвращаем настроенный widget
                return widget;
            });
        });
    };
}

/**
 * Загружает JSON AJAX-запросом и кладёт в promise
 */
UI.ajax = function(url, params, queryString) {
    var result = Q.defer(),
        fullUrl = url + (queryString != undefined ? ("?" + queryString) : "");

    Ext.Ajax.request({
        url: fullUrl,
        method: 'GET',
        params: params || {},
        success: function(response) {
            result.resolve(response.responseText);
        },
        failure: function(response) {
            result.reject(new Error(response.responseText));
        }
    });
    return result.promise
};
