Ext.ns('Ext.m3.utils');

Ext.m3.ExtJS_version = (function() {
    return Ext.version.split(".").slice(0, 2).join(".");
})();
Ext.m3._future = true;

Ext.m3.utils = {
    critical: function(msg) {
        Ext.Msg.show({
            title: 'Внимание'
            ,msg: msg
            ,buttons: Ext.Msg.OK
            ,fn: Ext.emptyFn
            ,animEl: 'elId'
            ,icon: Ext.MessageBox.WARNING
        });
    },
    makeWindowRequest: function(window_url, postload_data, custom_load_function) {
        //запрос на окно
        var mask = new Ext.LoadMask(Ext.getBody());
        mask.show();

        Ext.Ajax.request({
            url: window_url
            , type: 'json'
            , method: 'POST'
            , params: {}
            , success: function(result, options) {
                var loadDataToWindow = function(win, load_data) {
                    if (win.form) {
                        win.form.loadData(load_data);
                    }
                    if (custom_load_function &&
                        typeof(custom_load_function) == "function")
                    {
                        custom_load_function();
                    }
                };
                try {
                    var win = Ext.m3.utils.evaluate(result);
                }
                finally {
                    mask.hide();
                }
                //производим загрузку данных в окно
                if (postload_data) {
                    loadDataToWindow(win, postload_data)
                }
                if (!(win instanceof Ext.Window)) {
                    throw new Error("Ответ на запрос должен быть кодом окна!")
                }
            }
            , failure: function() {
                uiAjaxFailMessage.apply(this, arguments);
                mask.hide();
            }
        })
    },
    evaluate: function(rendering_string, load_data) {
        /*
         * интерпретация строковых данных в одном из двух вариантов
         * json данные или код окна
         * @param {String} rendering_string - текст который является валидным JS кодом
         * @param {Object} load_data - данные для загрузки в окно
         */
        console.log("!!!eval!!!");
        var renderAsWindow = function(str) {
            try {
                var win = eval(str);
                if (win instanceof Ext.Window) {
                    AppDesktop.getDesktop().createWindow(win);
                    //если выставлен признак загрузки данных
                    //то запрашиваем данные
                    Ext.m3.utils.bindDataToWindow(win);
                }
            } catch(e) {
                Ext.m3.utils.critical("Произошла непредвиденная ошибка");
                throw e;
            }
            return win;
        };
        var renderAsData = function(data) {
            //обработка запроса типа "Данные"
            var result = null;
            if (data.code && typeof(data.code) == "function") {
                result = data.code();
            }
            return result
        };

        var eval_result;
        if (rendering_string.substring(0, 1) == '{') {
            var data_object = Ext.decode(rendering_string);

            if (data_object && data_object.data && data_object.data['_window_request_url']) {
                //обработка последующего запроса на окно
                this.makeWindowRequest(data_object.data['_window_request_url']);
            } else {
                //пришли данные
                eval_result = renderAsData(data_object);
            }
        }
        else {
            eval_result = renderAsWindow(rendering_string);
        }
        return eval_result;
    }
    , sendRequest: function(url, params, callback, mask) {
        /*
            функция посылающая запрос на рендеринг окна
         */
        Ext.Ajax.request({
            url: url,
            params: params,
            method: "POST",
            success: function(res, opt) {
                callback(res, opt);
                if (mask) mask.hide();
            },
            failure: function() {
                uiAjaxFailMessage.apply(this, arguments);
                if (mask) mask.hide();
            }
        });
    }
    , getComplexFieldsWithData : function(form, responseData) {
        //достаем все поля с формы имеющих комплесные данные состоящие
        //из нескольких полей и привязываем их
        //к соответствующим данным из ответа на запрос
        var items_with_data = [], items = [], field,
            complex_data = responseData['complex_data'];

        var hasOwner = Object.prototype.hasOwnProperty;
        if (complex_data) {
            for (var fieldName in complex_data) {
                if (hasOwner.apply(complex_data, [fieldName])) {
                    field = form.findField(fieldName);
                    var assoc_data = complex_data[fieldName];
                    if (field && assoc_data) {
                        items_with_data.push([field, assoc_data]);
                        items.push(field);
                    }
                }
            }
        }
        return [items, items_with_data];
    }
    , bindDataToWindow: function(win, object) {
        /*
            Привязка данных объекта к форме
        */
        if (!win.createNew && win.urlGetData) {
            var url = win.urlGetData.slice(1, win.urlGetData.length-1);
            var callback = function(res, opt) {
                var form = win.getForm(),
                    response = Ext.decode(res.responseText),
                    record_data = response.data;

                if (form && record_data) {
                    var record = new Ext.data.Record(record_data);
                    form.loadRecord(record);
                }
                //загружаем хитрые компоненты не имеющие совместимого интерфейса загрузки
                //в форму
                var items_and_data = Ext.m3.utils.getComplexFieldsWithData(form, record_data);
                var items = items_and_data[0], associated_data = items_and_data[1];

                Ext.m3.actionManager.dispatch('load', items, associated_data);
            };
            if (!object) {
                win.mask = new Ext.LoadMask(win.getEl());
                //делаем запрос за данными
                var context = Ext.applyIf({mode: 2}, win.actionContextJson);
                Ext.m3.utils.sendRequest(url, context, callback);
            }
        }

    }
};
