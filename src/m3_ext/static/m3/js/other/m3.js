/**
 * Содержит общие функции вызываемые из разных частей
 */
Ext.QuickTips.init();

/**
 * Чтобы ie и прочие не правильные браузеры, где нет console не падали
 */
if (typeof console == "undefined") var console = { log: function () {
}};

Ext.namespace('Ext.m3');

/**
 *  Реализация стандартного assert
 * @param {Boolean} condition
 * @param {String} errorMsg
 */
function assert(condition, errorMsg) {
    if (!condition) {
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}

/**
 * В поле добавим функционал отображения того, что оно изменено.
 */
Ext.override(Ext.form.Field, {
    /**
     * Признак, что поле используется для изменения значения,
     * а не для навигации - при Истине будут повешаны обработчики на изменение окна
     * */
    isEdit: true,
    isModified: false,
    updateLabel: function () {
        this.setFieldLabel(this.fieldLabel);
    },
    setFieldLabel: function (text) {
        if (text != undefined) {
            if (this.rendered) {
                var newtext = text + ':';
                if (this.isModified) {
                    newtext = '<span style="color:darkmagenta;">' + newtext + '</span>';
                }

                //if (this.isModified) {newtext = '<span">*</span>' + newtext; };
                var lab = this.el.up('.x-form-item', 10, true);
                if (lab) {
                    lab.child('.x-form-item-label').update(newtext);
                }
            }
            this.fieldLabel = text;
        }
    },
    // переопределим клавишу ENTER для применения изменений поля
    fireKey: function (e) {
        if (e.isSpecialKey()) {
            if (e.getKey() == e.ENTER) {
                // этот метод делает применение изменений
                this.onBlur();
                // проставим значение, как будто мы ушли с поля и вернулись обратно
                this.startValue = this.getValue();
            }
            this.fireEvent('specialkey', this, e);
        }
    }
});

/**
 * Создаётся новый компонент: Панель с возможностью включения в заголовок
 * визуальных компонентов.
 */
Ext.define('Ext.m3.TitlePanel', {
    extend: 'Ext.Panel',
    xtype: 'm3-title-panel',

    titleItems: null,
    addTitleItem: function (itemConfig) {
        var item = Ext.ComponentMgr.create(itemConfig);
        var itemsDiv = Ext.DomHelper.append(this.header, {tag: "div", style: "float:right;margin-top:-4px;margin-left:3px;"}, true);
        item.render(itemsDiv);
    },
    onRender: function (ct, position) {
        Ext.m3.TitlePanel.superclass.onRender.apply(this, arguments);
        if (this.titleItems != null) {
            if (Ext.isArray(this.titleItems)) {
                for (var i = this.titleItems.length - 1; i >= 0; i--) {
                    this.addTitleItem(this.titleItems[i]);
                }
            } else {
                this.addTitleItems(this.titleItems);
            }

            if (this.header)
                this.header.removeClass('x-unselectable');
        }
    },
    getChildByName: function (name) {
        if (this.items)
            for (var i = 0; i < this.items.length; i++)
                if (this.items.items[i].name == name)
                    return this.items.items[i];

        if (this.titleItems)
            for (var i = 0; i < this.titleItems.length; i++)
                if (this.titleItems[i].name == name)
                    return this.titleItems[i];

        return null;
    }
});

/*
 * выполняет обработку failure response при submit пользовательских форм
 * context.action -- объект, передаваемый из failure handle
 * context.title -- заголовок окон с сообщением об ошибке
 * context.message -- текст в случае, если с сервера на пришло иного сообщения об ошибке
 */
function uiFailureResponseOnFormSubmit(context) {
    if (context.action.failureType == 'server') {
        obj = Ext.util.JSON.decode(context.action.response.responseText);
        Ext.Msg.show({title: context.title,
            msg: obj.error_msg,
            buttons: Ext.Msg.OK,
            icon: Ext.Msg.WARNING});
    } else {
        Ext.Msg.alert(context.title, context.message);
    }
}

/*
 * Если функция вызвана без параметров, то будет выдано простое сообщение об ошибке
 * Если передан параметр респонс, то будет нарисовано экстовое окно и в нем отображен
 * респонс сервера(предназначено для отладки серверных ошибок)
 */
function uiAjaxFailMessage(response, opt) {
    if (!response) {
        return;
    } else if (response.status === 0) {
        Ext.Msg.alert('', 'Извините, сервер временно не доступен.');
    }

    // response['status'] === 200 -- Пользовательская ошибка, success == false
    if (response['status'] === 200 || opt && opt['failureType'] === "server") {
        // Пришел OperationResult('success':False)
        // if (opt && opt.response && opt.response.responseText) {
        //     smart_eval(opt.response.responseText);
        // } else {
        //     // grid and tree load обрабатывается тут
        //     smart_eval(response.responseText);
        // }
    } else {
        var bodySize = Ext.getBody().getViewSize(),
            width = (bodySize.width < 500) ? bodySize.width - 50 : 500,
            height = (bodySize.height < 300) ? bodySize.height - 50 : 300,
            win;


        // Для submit'a response приходит вторым параметром
        if (!response.responseText && opt && opt.response) {
            response = opt.response;
        }

        var errorMsg = response.responseText;
        if (!errorMsg) {
            // Значит js-ошибка
            response.statusText = response.message;
            errorMsg = response.stack.replace(new RegExp("\n", 'g'), '<br />');
        }

        win = new Ext.Window({
//            modal: true,
//            width: width,
//            height: height,
            title: "Request Failure",
            layout: "fit",
            maximizable: true,
            maximized: true,
            listeners: {
//                "maximize": {
//                    fn: function (el) {
//                        var v = Ext.getBody().getViewSize();
//                        el.setSize(v.width, v.height);
//                    },
//                    scope: this
//                },

                "resize": {
                    fn: function (wnd) {
                        var editor = Ext.getCmp("__ErrorMessageEditor");
                        var sz = wnd.body.getViewSize();
                        editor.setSize(sz.width, sz.height - 42);
                    }

                }
//                "activate": {
//                    fn: function (el) {
//                        var v = Ext.getBody().getViewSize();
//                        debugger;
//                        el.setSize(v.width, v.height);
//                    },
//                    scope: this
//                }
            },
            items: new Ext.form.FormPanel({
                baseCls: "x-plain",
                layout: "absolute",
                defaultType: "label",
                items: [
                    {x: 5, y: 5,
                        html: '<div class="x-window-dlg"><div class="ext-mb-error" style="width:32px;height:32px"></div></div>'
                    },
                    {x: 42, y: 6,
                        html: "<b>Status Code: </b>"
                    },
                    {x: 125, y: 6,
                        text: response.status
                    },
                    {x: 42, y: 25,
                        html: "<b>Status Text: </b>"
                    },
                    {x: 125, y: 25,
                        text: response.statusText
                    },
                    {x: 0, y: 42,
                        id: "__ErrorMessageEditor",
                        xtype: "htmleditor",
                        value: errorMsg,
                        readOnly: true,
                        enableAlignments: false,
                        enableColors: false,
                        enableFont: false,
                        enableFontSize: false,
                        enableFormat: false,
                        enableLinks: false,
                        enableLists: false,
                        enableSourceEdit: false,
                        listeners: {
                            "push": {
                                fn: function (self, html) {

                                    // событие возникает когда содержимое iframe становится доступно

                                    function fixDjangoPageScripts(doc) {
                                        //грязный хак - эвалим скрипты в iframe

                                        try {
                                            var scripts = doc.getElementsByTagName('script');
                                            for (var i = 0; i < scripts.length; i++) {
                                                if (scripts[i].innerText) {
                                                    this.eval(scripts[i].innerText);
                                                }
                                                else {
                                                    this.eval(scripts[i].textContent);
                                                }
                                            }

                                            //и скрыта подробная информация, тк document.onLoad не будет
                                            //вызвано
                                            this.hideAll(this.getElementsByClassName(doc, 'table', 'vars'));
                                            this.hideAll(this.getElementsByClassName(doc, 'ol', 'pre-context'));
                                            this.hideAll(this.getElementsByClassName(doc, 'ol', 'post-context'));
                                            this.hideAll(this.getElementsByClassName(doc, 'div', 'pastebin'));

                                        }
                                        catch (er) {
                                            //
                                        }
                                    }

                                    //магия - меняем объект исполнения на window из iframe
                                    fixDjangoPageScripts.call(this.iframe.contentWindow,
                                        this.iframe.contentDocument);
                                    //TO DO: нужно еще поправлять стили странички в IE и Сафари
                                }
                            }

                        }
                    }
                ]
            })
        });

        win.show();
    }
}

// Проверяет есть ли в ответе сообщение и выводит его
// Возвращает серверный success
function uiShowErrorMessage(response) {
    var obj = Ext.decode(response.responseText);
    if (obj.error_msg)
        Ext.Msg.alert(SOFTWARE_NAME, obj.error_msg);
// Не понятно зачем нужен этот код.
//	if (obj.code)
//		alert('Пришел код на выполнение ' + obj.code);
    return obj.success;
}

/**
 * Для правильного отображения колонок в гриде для цен и сумм
 * Использовать в качестве renderer в колонке грида
 * param Значение в колонке
 */
function thousandCurrencyRenderer(val) {
    if (typeof (val) != 'number') {
        var num = val;
        try {
            num = parseFloat(val.replace(/,+/, ".").replace(/\s+/g, ""));
        }
        catch (ex) {
            num = NaN;
        }

        if (isNaN(num)) {
            return val;
        }
        else {
            val = num;
        }
    }

    var retVal = "";
    var x = val.toFixed(2).split('.');
    var real = x[0];
    var decimal = x[1];
    var g = 0;
    var i = 0;

    var offset = real.length % 3;

    if (offset != 0) {
        for (var i; i < offset; i++) {
            retVal += real.charAt(i);
        }
        retVal += ' ';
    }

    for (var i; i < real.length; i++) {
        if (g % 3 == 0 && g != 0) {
            retVal += ' ';
        }
        retVal += real.charAt(i);
        g++;

    }

    if (decimal) {
        retVal += ',' + decimal;
    }

    retVal = retVal.replace(/\s,/, ",");

    return retVal;
}

// Функция проверки существования элемента в массиве. В эксте её нет.
// Не работает под ие6, но для него тоже написана реализация, если понадобится:
// http://stackoverflow.com/questions/143847/best-way-to-find-an-item-in-a-javascript-array
function includeInArr(arr, obj) {
    return (arr.indexOf(obj) != -1);
}

//Cообщения
function showMessage(msg, title, icon) {
    title = title || 'Внимание';
    msg = msg || '';
    icon = icon || Ext.MessageBox.INFO;

    Ext.Msg.show({
        title: title,
        msg: msg,
        buttons: Ext.Msg.OK,
        icon: icon
    });
}

function showWarning(msg, title) {
    showMessage(msg, title, Ext.MessageBox.WARNING);
}
