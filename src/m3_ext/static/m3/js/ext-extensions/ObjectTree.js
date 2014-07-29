/**
 * Объектное дерево, включает в себя тулбар с кнопками добавить (в корень и дочерний элемент), редактировать и удалить
 * @param {Object} config
 */

Ext.define('Ext.m3.ObjectTree', {
    extend: 'Ext.m3.Tree',
    xtype: 'm3-object-tree',

    bubbleEvents: [
        'mask',
        'unmask',
        'getcontext'
    ],

    allowPaging: false,
    rowIdName: 'id',
    parentIdName: 'parent_id',

    actionNewUrl: null,
    actionEditUrl: null,
    actionDeleteUrl: null,

    incrementalUpdate: false,

    folderSort: true,
    enableSort: false,

    configure: function () {

        var contextMenu = Ext.create({}, 'menu'),
            containerContextMenu = Ext.create({}, 'menu'),
            tbar = Ext.create(this.tbar),
            buff,

            buttonNewInRoot = {
                text: 'Новый в корне',
                iconCls: 'add_item',
                handler: this.onNewRecord,
                scope: this
            },
            buttonNewInChild = {
                text: 'Новый дочерний',
                iconCls: 'add_item',
                handler: this.onNewRecordChild,
                scope: this
            },
            buttonEdit = {
                text: 'Изменить',
                iconCls: 'edit_item',
                handler: this.onEditRecord,
                scope: this
            },
            buttonRemove = {
                text: 'Удалить',
                iconCls: 'delete_item',
                handler: this.onDeleteRecord,
                scope: this
            },
            buttonRefresh = {
                text: 'Обновить',
                iconCls: 'x-tbar-loading',
                handler: this.refreshStore,
                scope: this
            };

        // сохраняем пользовательские кнопки
        buff = tbar.removeAll(false);

        if (this.actionNewUrl) {
            contextMenu.add(buttonNewInRoot);
            contextMenu.add(buttonNewInChild);
            containerContextMenu.add(buttonNewInRoot);

            tbar.add({
                text: 'Добавить',
                iconCls: 'add_item',
                menu: {
                    items: [buttonNewInRoot, buttonNewInChild]
                }

            });

        }
        if (this.actionEditUrl) {
            contextMenu.add(buttonEdit);
            tbar.add(buttonEdit);

            this.on('dblclick', this.onEditRecord, this);
        }
        if (this.actionDeleteUrl) {
            contextMenu.add(buttonRemove);
            tbar.add(buttonRemove);
        }

        // add separator
        if (this.actionNewUrl || this.actionEditUrl || this.actionDeleteUrl) {
            tbar.add('-');
            contextMenu.add('-');
            containerContextMenu.add('-');
        }

        if (this.dataUrl) {
            tbar.add(buttonRefresh);
            contextMenu.add(buttonRefresh);
            containerContextMenu.add(buttonRefresh);
        }

        if (contextMenu.items && contextMenu.items.length > 0) {
            this.contextMenu = contextMenu;
        }
        if (containerContextMenu.items && containerContextMenu.items.length > 0) {
            this.containerContextMenu = containerContextMenu;
        }

        // восстанавливаем пользовательские кнопки
        tbar.add(buff);

        this.tbar = tbar;
    },

    initComponent: function () {

        this.configure();

        this.callParent();

        var loader = this.getLoader();
            _self = this;
        loader.on('beforeload', function(ldr) {
            ldr.baseParams = Ext.apply(ldr.baseParams || {}, _self.getContext());
        });
        // Повесим отображение маски при загрузке дерева
        loader.on('beforeload', this.fireEvent.createDelegate(this, ['mask', this, 'Загрузка...']), this);
        loader.on('load', this.fireEvent.createDelegate(this, ['unmask', this]), this);
        loader.on('loadexception', this.fireEvent.createDelegate(this, ['unmask', this]), this);

        // еще настроим loader, чтобы правильно передавал узел через параметр
        loader.nodeParameter = this.rowIdName;

        this.addEvents(
            /**
             * Событие до запроса добавления записи - запрос отменится при возврате false
             * @param {ObjectTree} this - само дерево
             * @param {JSON} request - AJAX-запрос для отправки на сервер
             * @param isChild - флаг того, что запрос идет на дочерний узел
             */
            'beforenewrequest',

            /**
             * Событие до запроса редактирования записи - запрос отменится при возврате false
             * @param {ObjectTree} this - само дерево
             * @param {JSON} request - AJAX-запрос для отправки на сервер
             */
            'beforeeditrequest',

            /**
             * Событие до запроса удаления записи - запрос отменится при возврате false
             * @param {ObjectTree} this - само дерево
             * @param {JSON} request - AJAX-запрос для отправки на сервер
             */
            'beforedeleterequest'
        );
    },


    onNewRecord: function () {
        assert(this.actionNewUrl, 'actionNewUrl is not define');

        var request = {
            url: this.actionNewUrl,
            params: this.getContext(),
            success: this.childWindowOpenHandler.createDelegate(this, ['new'], true),
            failure: uiAjaxFailMessage,
            mode: "Режим создания..."
        };
        if (this.fireEvent('beforenewrequest', this, request)) {
            UI.callAction.call(this, request);
        }
    },

    onNewRecordChild: function () {
        assert(this.actionNewUrl, 'actionNewUrl is not define');

        if (!this.getSelectionModel().getSelectedNode()) {
            Ext.Msg.show({
                title: 'Новый',
                msg: 'Элемент не выбран',
                buttons: Ext.Msg.OK,
                icon: Ext.MessageBox.INFO
            });
            return;
        }
        var baseConf = this.getSelectionContext();
        baseConf[this.parentIdName] = baseConf[this.rowIdName];
        delete baseConf[this.rowIdName];


        var request = {
            url: this.actionNewUrl,
            params: baseConf,
            success: this.childWindowOpenHandler.createDelegate(this, ['newChild'], true),
            failure: uiAjaxFailMessage,
            mode: "Режим создания..."
        };
        if (this.fireEvent('beforenewrequest', this, request)) {
            UI.callAction.call(this, request);
        }

    },

    onEditRecord: function () {
        assert(this.actionEditUrl, 'actionEditUrl is not define');
        assert(this.rowIdName, 'rowIdName is not define');

        if (this.getSelectionModel().getSelectedNode()) {

            var request = {
                url: this.actionEditUrl,
                params: this.getSelectionContext(),
                success: this.childWindowOpenHandler.createDelegate(this, ['edit'], true),
                failure: uiAjaxFailMessage,
                mode: "Режим редактирования..."
            };
            if (this.fireEvent('beforeeditrequest', this, request)) {
                UI.callAction.call(this, request);
            }

        }
    },

    onDeleteRecord: function () {
        assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
        assert(this.rowIdName, 'rowIdName is not define');
        var node = this.getSelectionModel().getSelectedNode();
        if (node) {

            Ext.Msg.show({
                title: 'Удаление записи',
                msg: 'Вы действительно хотите удалить выбранную запись?',
                icon: Ext.Msg.QUESTION,
                buttons: Ext.Msg.YESNO,
                fn: function (btn) {
                    if (btn != 'yes')
                        return;

                    if (this.getSelectionModel().getSelectedNode()) {

                        var request = {
                            url: this.actionDeleteUrl,
                            method: 'POST',
                            params: this.getSelectionContext(),
                            success: this.deleteOkHandler.createDelegate(this),
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

    childWindowOpenHandler: function (win, operation) {
        if (win) {
            win.on('closed_ok', function (data) {
                if (this.incrementalUpdate) {
                    // нам пришел узел дерева
                    var obj = Ext.decode(data),
                        selectedNode = this.getSelectionModel().getSelectedNode();
                    var newSelectNode = this.getLoader().createNode(obj.data);
                    switch (operation) {
                        case 'edit':
                            // при редактировании заменим старый узел на новый
                            var parentNode = selectedNode.parentNode;
                            parentNode.removeChild(selectedNode);
                            if (!parentNode.expanded) {
                                parentNode.expand(false, false);
                            }
                            parentNode.appendChild(newSelectNode);
                            break;

                        // Добавление нового узла в корень
                        case 'new':
                            var rootNode = this.getRootNode();
                            rootNode.appendChild(newSelectNode);
                            break;

                        // Добавление происходит в текущий выделенный узел
                        case 'newChild':
                            // если детки уже загружены, то сразу добавляем
                            if (selectedNode.children) {
                                if (!selectedNode.expanded) {
                                    selectedNode.expand(false, false);
                                }
                                selectedNode.appendChild(newSelectNode);
                            } else {
                                // если узел еще не раскрыт
                                if (!selectedNode.expanded) {
                                    // если узел еще не загружен
                                    if (!selectedNode.leaf && selectedNode.childNodes.length == 0) {
                                        // загружаем его так, чтобы после загрузки выделить элемент
                                        selectedNode.on('expand', function () {
                                            var newSelectNode = this.getNodeById(obj.data.id);
                                            newSelectNode.select();
                                        }, this, {single: true});
                                        selectedNode.expand(false, false);
                                        newSelectNode = undefined;
                                    } else {
                                        // если загружен, то добавляем
                                        selectedNode.leaf = false;
                                        selectedNode.expand(false, false);
                                        selectedNode.appendChild(newSelectNode);
                                    }
                                } else {
                                    // если раскрыт, то сразу добавляем
                                    selectedNode.appendChild(newSelectNode);
                                }
                            }
                            break;
                    }
                    if (newSelectNode) {
                        newSelectNode.select();
                    }
                }
                else {
                    this.refreshStore();
                }
            }, this);
        }
        return win;
    },
    deleteOkHandler: function (res) {
        if (this.incrementalUpdate) {
            if (!res.success) {
                return;
            }
            // нам просто надо удалить выделенный элемент
            var selectedNode = this.getSelectionModel().getSelectedNode();
            var parentNode = selectedNode.parentNode;
            parentNode.removeChild(selectedNode);
            parentNode.select();
        } else {
            this.refreshStore();
        }
    },
    refreshStore: function () {
        this.getLoader().baseParams = Ext.apply({}, this.getContext());
        this.getLoader().load(this.getRootNode());
    },
    /**
     * Получение контекста выделения строк/ячеек
     * Используется при ajax запросах
     */
    getSelectionContext: function () {
        var baseConf = Ext.apply({}, this.getContext());
        if (this.getSelectionModel().getSelectedNode()) {
            baseConf[this.rowIdName] = this.getSelectionModel().getSelectedNode().id;
        }
        return baseConf;
    }
});
