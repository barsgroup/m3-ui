
var M3 = M3 || {Ui: {}};

M3.Ui.SimpleLoader = {
    /**базовый тип загрузчика использующий примитивный способ GET-запроса
     */
    baseUrl: null,

    init: function(ns, config) {
        this._loader = (ns && ns.Ajax && ns.Ajax.request);
        this.baseUrl = config['baseUrl'];
    },

    require: function(depency, callback) {

        var deferred = M3.Ui.Deferred();

        this._loader({

            url: this.baseUrl + '/' + depency,

            success: function(file_) {
                var confObject = eval(file_.responseText);
                callback(confObject);
                deferred.resolve(confObject);
            },
            failure: function() {
                var msg = "Ошибка загрузки";
                alert(msg);
                deferred.reject(new Error(msg));
            }
        });

        return deferred.promise;
    }
};

M3.Ui.Loader = function(ns, config) {

    /** загрузчик на базе ExtJS
     */

    this.init = function(ns, config) {

        var loaderCls = (ns && ns.Loader);
        this._loader = Ext.Loader;
        this.baseUrl = config['baseUrl'];
    };

    this.require = function(depency, callback) {

        var depencies = [], deferred = M3.Ui.Deferred();

        if (depency.constructor != Array) {
            depencies.push(depency);
        } else {
            depencies = depency;
        }

        for (var i=0; i < depencies.length; i++) {
            depencies[i] = this.baseUrl + depencies[i] + '.js';
        }

        this._loader.load(depencies, function() {

            var config_name = depency.replace("-", "_");
            var loadedFile = window[config_name],
                conf = Ext.apply({}, loadedFile);

            if (window.hasOwnProperty(config_name)) {
                delete window[config_name];
            }

            deferred.resolve(conf);
        }, this, true);

        if (typeof(callback) == "function") {
            callback();
        }

        deferred.promise.timeout(5000, '').catch(function() {
            console.log("ERROR -> LOAD TIMEOUT!");
            deferred.reject();
        });

        return deferred.promise;
    };

    this.init(ns, config);

};

M3.Ui.Loader.prototype = M3.Ui.SimpleLoader;