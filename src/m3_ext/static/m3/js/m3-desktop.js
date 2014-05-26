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
                    }).then(UI.evalResult);
                };
            }
        }
        return res;
    }

    /**
     * Генератор модулей - потомков от Ext.app.Module
     */
    function makeModule(data, idPrefix, idx, inStartMenu) {
        /**
         * Генератор словарей, описывающих элементы (под)меню
         */
        var Module = Ext.extend(Ext.app.Module, {
            id: idPrefix + idx, init: function () {
                assert(data != '-', "Separator at top level!");
                this.launcher = makeItem(data);
                if (inStartMenu) {
                    this.launcher.in_start_menu = true;
                }
            }
        });
        return new Module();
    }

    /**
     * Добавляет каждый элемент @source@ в @target@, как модуль
     * с id вида (@prefix@ + N).
     * Флаг inStartMenu=true добавит модуль в меню
     */
    function addEachModuleTo(target, source, prefix, inStartMenu) {
        for (var i = 0; i < source.length; i += 1) {
            target.push(makeModule(source[i], prefix, i + 1, inStartMenu));
        }
    }

    var mask = new Ext.LoadMask(document.body, {msg: 'Загрузка...'});
    return new Q()
        .then(mask.show.createDelegate(mask))
        .then(function () {
            var result = Q.defer();
            Ext.Ajax.request({
                url: desktopUrl,
                success: function () {
                    result.resolve.apply(this, arguments);
                },
                failure: function (response) {
                    result.reject(response);
                }

            });
            return result.promise;
        })
        .then(UI.evalResult)
        .then(function (cfg) {

            var children = [];
            cfg['desktopIcons'].forEach(function (value, index) {
                children.push({
                    tag: 'td',
                    id: "desktop-item-" + value.id + "-shortcut",
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
                                    html: value.name
                                }
                            ]
                        }
                    ]
                });

            });

            Ext.DomHelper.append('x-shortcuts', {tag: 'tr', children: children});
            return cfg;
        })
        .then(function (cfg) {
            var desktopConfig = cfg['desktop'];

            // Основной объект web-desktop'a
            var AppDesktop = new Ext.app.App({
                // Реализация функции, которая выводит список
                getModules: function () {
                    var res = [];

                    // пункты Главного Меню
                    addEachModuleTo(
                        res, desktopConfig.menuItems, 'menu-item-', true
                    );

                    // элементы собственно Рабочего Стола
                    addEachModuleTo(
                        res, desktopConfig.desktopItems, 'desktop-item-'
                    );

                    // верхняя панель
                    addEachModuleTo(
                        res, desktopConfig.topToolbarItems, 'toptoolbar-item-'
                    );

                    return res;
                },

                // Обязательные настройки меню "Пуск"
                getStartConfig: function () {
                    var items = [];
                    for (var i = 0; i < desktopConfig.toolboxItems.length; i += 1) {
                        var item = desktopConfig.toolboxItems[i];
                        items.push(makeItem(item));
                    }
                    return Ext.applyIf(startMenuCfg, {
                        toolItems: items,
//                        title: '{{ user }}',
                        toolsPanelWidth: 120,
                        width: 330
//                        iconCls: '{{ user_icon }}'

                    });
                }
            });
            return [cfg, AppDesktop];
        })
        .catch(uiAjaxFailMessage)
        .finally(mask.hide.createDelegate(mask))
        .spread(function (cfg, desktop) {

            new UI({
                desktop: desktop,
                staticPrefix: staticUrl,
                confStorage: function (key) {
                    // Загрузка конфигов с сервера
                    return UI.ajax({
                        url: key,
                        params: {'mode': 'ui'}
                    }).then(UI.evalResult);
                },
                uiFabric: Ext.create
            });
            return cfg;
        });
};