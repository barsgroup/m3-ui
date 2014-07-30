/**
 * Объектный грид, включает в себя тулбар с кнопками добавить, редактировать и удалить
 */

(function () {

    // Чтобы можно было делать initComponent.apply и использовать разные scope в grid'e и editgrid'e
    var initComponent = function () {

        var params = this.params || {};
        assert(params.allowPaging !== undefined, 'allowPaging is undefined');
        assert(params.rowIdName !== undefined, 'rowIdName is undefined');
        params.actions = params.actions || {};

        this.allowPaging = params.allowPaging;
        this.rowIdName = params.rowIdName;
        // используется при режиме выбора ячеек.
        // через этот параметр передается имя выбранной колонки
        this.columnParamName = params.columnParamName;
        this.actionNewUrl = params.actions.newUrl;
        this.actionEditUrl = params.actions.editUrl;
        this.actionDeleteUrl = params.actions.deleteUrl;
        this.actionDataUrl = params.actions.dataUrl;

        // признак клиентского редактирования
        this.localEdit = params.localEdit;
        // имя для сабмита в режиме клиентского редактирования
        this.name = params.name;

        // проставление адреса запроса за данными
        if (this.store && !this.store.url) {
            this.store.url = this.actionDataUrl;
        }

        // настроим кнопки тулбара
        this.configureItem(
            this.getTopToolbar(),
            "button_new",
            this.actionNewUrl,
            this.onNewRecord);

        var edit_item = this.configureItem(
            this.getTopToolbar(),
            "button_edit",
            this.actionEditUrl,
            this.onEditRecord);

        if (edit_item && this.actionEditUrl) {
            this.on('dblclick', edit_item.handler);
        }

        this.configureItem(
            this.getTopToolbar(),
            "button_delete",
            this.actionDeleteUrl,
            this.onDeleteRecord);

        this.configureItem(
            this.getTopToolbar(),
            "button_refresh",
            this.actionDataUrl,
            this.refreshStore);

        // настроим меню в зависимости от переданных адресов
        if (params.contextMenu) {
            this.configureItem(
                params.contextMenu,
                "menuitem_new",
                this.actionNewUrl,
                this.onNewRecord);
            this.configureItem(
                params.contextMenu,
                "menuitem_edit",
                false,
                this.onEditRecord);
            this.configureItem(
                params.contextMenu,
                "menuitem_delete",
                false,
                this.onDeleteRecord);
        }
        if (params.rowContextMenu) {
            this.configureItem(
                params.rowContextMenu,
                "menuitem_new",
                this.actionNewUrl,
                this.onNewRecord);
            this.configureItem(
                params.rowContextMenu,
                "menuitem_edit",
                this.actionEditUrl,
                this.onEditRecord);
            this.configureItem(
                params.rowContextMenu,
                "menuitem_delete",
                this.actionDeleteUrl,
                this.onDeleteRecord);
        }

        this.configureItem(
            params.contextMenu,
            "menuitem_refresh",
            this.actionDataUrl,
            this.refreshStore);

        this.configureItem(
            params.rowContextMenu,
            "menuitem_refresh",
            this.actionDataUrl,
            this.refreshStore);

        var store = this.getStore();
        store.on('beforeload', function (st) {
            st.baseParams = Ext.apply(st.baseParams || {}, this.getContext());
        }, this);

        store.on('beforeload',
            this.fireEvent.createDelegate(this, ['mask', this, 'Загрузка...']));
        store.on('load',
            this.fireEvent.createDelegate(this, ['unmask', this]));
        store.on('loadexception',
            this.fireEvent.createDelegate(this, ['unmask', this]));

        this.addEvents(
            /**
             * Событие до запроса добавления записи - запрос отменится при возврате false
             * @param ObjectGrid this
             * @param JSON request - AJAX-запрос для отправки на сервер
             */
            'beforenewrequest',
            /**
             * Событие после запроса добавления записи - обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат запроса
             * @param opt - параметры запроса
             */
            'afternewrequest',
            /**
             * Событие до запроса редактирования записи - запрос отменится при возврате false
             * @param ObjectGrid this
             * @param JSON request - AJAX-запрос для отправки на сервер
             */
            'beforeeditrequest',
            /**
             * Событие после запроса редактирования записи - обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат запроса
             * @param opt - параметры запроса
             */
            'aftereditrequest',
            /**
             * Событие до запроса удаления записи - запрос отменится при возврате false
             * @param ObjectGrid this
             * @param JSON request - AJAX-запрос для отправки на сервер
             */
            'beforedeleterequest',
            /**
             * Событие после запроса удаления записи - обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат запроса
             * @param opt - параметры запроса
             */
            'afterdeleterequest',
            /**
             * Событие после успешного диалога добавления записи - встроенная обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат добавления (ответ сервера)
             */
            'rowadded',
            /**
             * Событие после успешного диалога редактирования записи - встроенная обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат редактирования  (ответ сервера)
             */
            'rowedited',
            /**
             * Событие после успешного диалога удаления записи - встроенная обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат удаления (ответ сервера)
             */
            'rowdeleted'
        );
    };

    var baseObjectGrid = {

        bubbleEvents: [
            'mask',
            'unmask',
            'getcontext'
        ],

        /**
         * Внутренняя функция для поиска и настройки элементов тулбара и контекстного меню
         */
        configureItem: function (container, itemId, enabled, handler) {
            var item = container.getComponent(itemId);
            if (item) {
                if (!enabled) {
                    item.hide();
                }
                if (!item.handler) {
                    item.setHandler(handler, this);
                }
            }
            return item;
        },

        /**
         * Нажатие на кнопку "Новый"
         */
        onNewRecord: function () {
            assert(this.actionNewUrl, 'actionNewUrl is not define');

            var params = Ext.apply({}, this.getContext());
            params[this.rowIdName] = '';

            var request = {
                url: this.actionNewUrl,
                params: params,
                success: this.newRecord.createDelegate(this),
                failure: uiAjaxFailMessage,
                mode: "Режим создания"
            };
            if (this.fireEvent('beforenewrequest', this, request)) {
                UI.callAction.call(this, request);
            }
        },
        /**
         * Нажатие на кнопку "Редактировать"
         */
        onEditRecord: function () {
            assert(this.actionEditUrl, 'actionEditUrl is not define');
            assert(this.rowIdName, 'rowIdName is not define');
            // выходим, если кнопка редактирования заблокирована
            // т.к. этот же обработчик висит на двойном клике
            if (this.getTopToolbar().getComponent("button_edit").disabled) {
                return;
            }

            if (this.getSelectionModel().hasSelection()) {
                // при локальном редактировании запросим также текущую строку
                var baseConf = this.getSelectionContext(this.localEdit);
                // грязный хак
                if (String(baseConf[this.rowIdName]).indexOf(",") != -1) {
                    Ext.Msg.show({
                        title: 'Редактирование',
                        msg: 'Редактирование возможно лишь в том случае, если выбран только один элемент!',
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.INFO
                    });
                } else {

                    var request = {
                        url: this.actionEditUrl,
                        params: baseConf,
                        success: this.editRecord.createDelegate(this),
                        failure: uiAjaxFailMessage,
                        mode: "Режим редактирования"
                    };
                    if (this.fireEvent('beforeeditrequest', this, request)) {
                        UI.callAction.call(this, request);
                    }
                }
            } else {
                Ext.Msg.show({
                    title: 'Редактирование',
                    msg: 'Элемент не выбран',
                    buttons: Ext.Msg.OK,
                    icon: Ext.MessageBox.INFO
                });
            }
        },
        /**
         * Нажатие на кнопку "Удалить"
         */
        onDeleteRecord: function () {
            assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
            assert(this.rowIdName, 'rowIdName is not define');

            if (this.getSelectionModel().hasSelection()) {
                Ext.Msg.show({
                    title: 'Удаление записи',
                    msg: 'Вы действительно хотите удалить выбранную запись?',
                    icon: Ext.Msg.QUESTION,
                    buttons: Ext.Msg.YESNO,
                    fn: function (btn) {
                        if (btn == 'yes') {

                            var request = {
                                url: this.actionDeleteUrl,
                                method: 'POST',
                                params: this.getSelectionContext(this.localEdit),
                                success: this.deleteRecord.createDelegate(this),
                                failure: uiAjaxFailMessage
                            };
                            if (this.fireEvent('beforedeleterequest', this, request)) {
                                UI.callAction.call(this, request);
                            }

                        }
                    }.bind(this)
                });
            } else {
                Ext.Msg.show({
                    title: 'Удаление',
                    msg: 'Элемент не выбран',
                    buttons: Ext.Msg.OK,
                    icon: Ext.MessageBox.INFO
                });
            }
        },

        /**
         * Показ и подписка на сообщения в дочерних окнах
         * @param {Object} win Окно
         */
        newRecord: function (win) {
            if (this.fireEvent('afternewrequest', this, win) && win instanceof Ext.Component) {
                win.on('closed_ok', function (data) {
                    if (this.fireEvent('rowadded', this, data)) {
                        // если локальное редактирование
                        if (this.localEdit) {
                            // то на самом деле нам пришла строка грида
                            var obj = Ext.decode(data),
                                record = new Ext.data.Record(obj.data),
                                store = this.getStore(),
                                sm = this.getSelectionModel();

                            record.json = obj.data;

                            store.add(record);
                            sm.selectRecords([record]);
                        } else {
                            this.refreshStore();
                        }
                    }
                }, this);
            }
            return win;
        },
        editRecord: function (win) {
            if (this.fireEvent('aftereditrequest', this, win) && win instanceof Ext.Component) {
                win.on('closed_ok', function (data) {
                    if (this.fireEvent('rowedited', this, data)) {
                        // если локальное редактирование
                        if (this.localEdit) {
                            // то на самом деле нам пришла строка грида
                            var obj = Ext.decode(data),
                                record = new Ext.data.Record(obj.data),
                                store = this.getStore(),
                                sm = this.getSelectionModel();

                            record.json = obj.data;
                            if (sm.hasSelection()) {
                                // пока только для режима выделения строк
                                if (sm instanceof Ext.grid.RowSelectionModel) {
                                    var rec = sm.getSelected(),
                                        index = store.indexOf(rec);

                                    store.remove(rec);
                                    if (index < 0) {
                                        index = 0;
                                    }
                                    store.insert(index, record);
                                    sm.selectRow(index);
                                }
                            }
                        } else {
                            this.refreshStore();
                        }
                    }
                }, this);
            }
            return win;
        },
        /**
         * Хендлер на удаление записи
         * @param {Object} res json-ответ
         */
        deleteRecord: function (res) {
            if (this.fireEvent('rowdeleted', this, res)) {
                // если локальное редактирование
                if (this.localEdit) {
                    // проверка на ошибки уровня приложения
                    if (!res.success) {
                        return;
                    }
                    var store = this.getStore(),

                    // и надо ее заменить в сторе
                        sm = this.getSelectionModel();

                    if (sm.hasSelection()) {
                        // только для режима выделения строк
                        if (sm instanceof Ext.grid.RowSelectionModel) {
                            var rec = sm.getSelections();
                            store.remove(rec);
                        }
                    }
                } else {
                    this.refreshStore();
                }
            }
        },
        refreshStore: function () {
            if (this.allowPaging) {
                var pagingBar = this.getBottomToolbar();
                if (pagingBar && pagingBar instanceof Ext.PagingToolbar) {
                    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
                    pagingBar.changePage(active_page);
                } else {
                    this.getStore().load();
                }
            } else {
                this.getStore().load();
            }

        },
        /**
         * Получение контекста выделения строк/ячеек
         * Используется при ajax запросах
         * @param {boolean} withRow Признак добавление в контекст текущей выбранной записи
         */
        getSelectionContext: function (withRow) {
            var baseConf = Ext.apply({}, this.getContext()),
                sm = this.getSelectionModel(),
                record, sels, ids, i, len;
            // для режима выделения строк
            if (sm instanceof Ext.grid.RowSelectionModel) {
                if (sm.singleSelect) {
                    record = sm.getSelected();
                    baseConf[this.rowIdName] = record.id;
                } else {
                    // для множественного выделения
                    sels = sm.getSelections();

                    ids = [];
                    record = [];
                    for (i = 0, len = sels.length; i < len; i++) {
                        record.push(sels[i]);
                        ids.push(sels[i].id);
                    }
                    baseConf[this.rowIdName] = ids.join();
                }
            }
            // для режима выделения ячейки
            else if (sm instanceof Ext.grid.CellSelectionModel) {
                assert(this.columnParamName, 'columnParamName is not define');

                var cell = sm.getSelectedCell();
                if (cell) {
                    record = this.getStore().getAt(cell[0]);
                    baseConf[this.rowIdName] = record.id;
                    baseConf[this.columnParamName] = this.getColumnModel().getDataIndex(cell[1]);
                }
            }
            // если просят выделенную строку
            if (withRow) {
                // то нужно добавить в параметры текущую строку грида
                if (Ext.isArray(record)) {
                    // пока х.з. что делать - возьмем первую
                    baseConf = Ext.applyIf(baseConf, record[0].json);
                } else {
                    baseConf = Ext.applyIf(baseConf, record.json);
                }
            }
            return baseConf;
        },
        setBlocked: function (blocked, exclude) {
            exclude.push("button_refresh");
            this.callParent(arguments);
        }
    };

    Ext.define('Ext.m3.ObjectGrid',

        Ext.apply({

            extend: 'Ext.m3.GridPanel',
            xtype: 'm3-object-grid',
            initComponent: function () {
                this.callParent();
                initComponent.apply(this);
            }

        }, baseObjectGrid)
    );

    Ext.define('Ext.m3.EditorObjectGrid',

        Ext.apply({

            extend: 'Ext.m3.EditorGridPanel',
            xtype: 'm3-edit-object-grid',
            initComponent: function () {
                this.callParent();
                initComponent.apply(this);
            }
        }, baseObjectGrid)
    );

})();
