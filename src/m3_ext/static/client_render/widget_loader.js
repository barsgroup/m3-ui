

var M3Rendering = M3Rendering || {};


M3Rendering.WidgetLoader = (function() {
    "use_strict";
    
    var _SimpleLoader = {
        /**базовый тип загрузчика использующий примитивный способ GET-запроса
         */
        baseUrl: null,

        init: function(ns, config) {
            this._loader = (ns && ns.Ajax && ns.Ajax.request),
            this.baseUrl = config['baseUrl'];
        },
        require: function(depency, callback) {

            var deferred = M3Rendering.Deferred();

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

    var _ExtJSLoader = function(ns, config) {
        /** загрузчик на базе ExtJS
         */
        this.init = function(ns, config) {

            loaderCls = (ns && ns.Loader);
            this._loader = Ext.Loader;
            this.baseUrl = config['baseUrl'];
        };

        this.require = function(depency, callback) {

            var depencies = [], deferred = M3Rendering.Deferred();

            if (depency.constructor != Array) {
                depencies.push(depency);
            } else {
                depencies = depency;
            }

            for (var i=0; i < depencies.length; i++) {
                depencies[i] = this.baseUrl + depencies[i] + '.js';
            }

            this._loader.load(depencies, function() {
                
                var loadedFile = window[depency],
                    conf = Ext.apply({}, loadedFile);

                delete window[depency];
                deferred.resolve(conf);
            });

            deferred.promise.timeout(2000, '').catch(function() {
                console.log("ERROR -> LOAD TIMEOUT!");
                deferred.reject();
            });

            return deferred.promise;
        };

        this.init(ns, config);
    };

    _ExtJSLoader.prototype = _SimpleLoader;

    var Module = {

        create: function(namespace, config) {
            /**
             * создание экземпляра загрузчика конфигураций
             */

            var loader;

            if (Ext !== undefined && namespace === Ext) {
                loader = new _ExtJSLoader(namespace, config);
            }

            return loader;
        }

    };

    return Module;
})();