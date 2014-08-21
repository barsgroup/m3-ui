/**
 * Преобразователь конфигов для элементов в собственно элементы
 */
UI.buildDesktop = function (desktopUrl, staticUrl, startMenuCfg) {

    function makeItem(data) {
        var res;
        if (data == '-') {
            res = data; // разделитель
        } else {
            res = {
                scope: this,
                text: data.text,
                iconCls: data.icon
            };

            if (data.items != undefined && data.items.length > 0) {
                res.handler = function () {
                    return false;
                };
                res.menu = [];
                for (var i = 0; i < data.items.length; i += 1) {
                    res.menu.push(makeItem(data.items[i]))
                }
            } else {
                res.handler = function () {
                    UI.ajax({
                        url: data.url,
                        params: data.context
                    })
                        .then(UI.evalResult)
                        .catch(uiAjaxFailMessage)
                    ;
                };
            }
        }
        return res;
    }

    /**
     * Создает html-элементы на рабочем столе
     * @param cfg - json-конфигурация рабочего стола
     * @returns cfg
     */
    function createDesktopIcons(cfg) {

        var children = [];
        cfg['desktop']['desktopItems'].forEach(function (value, index) {
            children.push({
                tag: 'td',
                id: "desktop-item-" + (index + 1) + "-shortcut",
                children: [
                    {
                        tag: 'a',
                        children: [
                            {
                                tag: 'div',
                                cls: "base-desktop-image " + value.icon
                            },
                            {
                                tag: 'div',
                                html: value.text
                            }
                        ]
                    }
                ]
            });

        });

        Ext.DomHelper.append('x-shortcuts', {tag: 'tr', children: children});
        return cfg;
    }

    /**
     * Создает основной объект рабочего стола
     * @param cfg - json-конфигурация рабочего стола
     * @returns {*}
     */
    function createApp(cfg) {
        var desktopConfig = cfg['desktop'];

        // Основной объект web-desktop'a
        var AppDesktop = new Ext.app.App({
            // Реализация функции, которая выводит список
            getModules: function () {

                function appendModule(dst, prefix, inStartMenu) {
                    return function (value, index) {

                        var Module = Ext.extend(Ext.app.Module, {
                            id: prefix + (index + 1),
                            init: function () {
                                assert(value != '-', "Separator at top level!");

                                this.launcher = makeItem(value);
                                if (inStartMenu) {
                                    this.launcher.in_start_menu = true;
                                }
                            }
                        });
                        dst.push(new Module())
                    }
                }

                var res = [];
                desktopConfig['menuItems'].forEach(appendModule(res, 'menu-item-', true));
                desktopConfig['desktopItems'].forEach(appendModule(res, 'desktop-item-'));
                desktopConfig['topToolbarItems'].forEach(appendModule(res, 'toptoolbar-item-'));
                return res;
            },

            // Обязательные настройки меню "Пуск"
            getStartConfig: function () {
                var items = [];
                for (var i = 0; i < desktopConfig['toolboxItems'].length; i += 1) {
                    var item = desktopConfig['toolboxItems'][i];
                    items.push(makeItem(item));
                }
                return Ext.applyIf(startMenuCfg, {
                    toolItems: items,
                    toolsPanelWidth: 120,
                    width: 330
                });
            }
        });

        new UI({
            desktop: AppDesktop,
            staticPrefix: staticUrl,
            storage: function (key) {
                // Загрузка конфигов с сервера
                return UI.ajax({
                    url: key,
                    params: {}
                }).then(UI.evalResult);
            },
            create: Ext.create
        });
        return cfg;
    }

    var mask = new Ext.LoadMask(document.body, {msg: 'Загрузка...'});
    return new Q()
        .then(mask.show.createDelegate(mask))
        .then(function () {
            return {url: desktopUrl};
        })
        .then(UI.ajax)
        .then(UI.evalResult)
        .then(createDesktopIcons)
        .then(createApp)
        .catch(uiAjaxFailMessage)
        .finally(mask.hide.createDelegate(mask));
};
