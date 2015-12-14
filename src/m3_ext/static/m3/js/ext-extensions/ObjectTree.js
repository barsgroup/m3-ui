/**
 * Объектное дерево, включает в себя тулбар с кнопками добавить (в корень и дочерний элемент), редактировать и удалить
 * @param {Object} config
 */
Ext.m3.ObjectTree = Ext.extend(Ext.ux.tree.TreeGrid, {
    constructor: function (baseConfig, params) {
        assert(params.rowIdName !== undefined, 'rowIdName is undefined');
        assert(params.actions !== undefined, 'actions is undefined');

        this.rootVisible = params.rootVisible;
        this.allowPaging = params.allowPaging;
        this.rowIdName = params.rowIdName;
        this.actionNewUrl = params.actions.newUrl;
        this.actionEditUrl = params.actions.editUrl;
        this.actionDeleteUrl = params.actions.deleteUrl;
        this.actionDataUrl = params.actions.dataUrl;
        this.actionContextJson = params.actions.contextJson;
        this.parentIdName = params.parentIdName;
        this.incrementalUpdate = params.incrementalUpdate;
        this.enableTreeSort = params.enableTreeSort;
        if (params.customLoad) {
            var ajax = Ext.Ajax;
            this.on('expandnode', function (node) {
                var nodeList = [];
                if (node.hasChildNodes()) {
                    for (var i = 0; i < node.childNodes.length; i++) {
                        if (!node.childNodes[i].isLoaded()) {
                            nodeList.push(node.childNodes[i].id);
                        }
                    }
                }
                if (nodeList.length > 0) {
                    ajax.request({
                        url: params.actions.dataUrl,
                        params: {'list_nodes': nodeList.join(',')},
                        success: function (response, opts) {
                            var res = Ext.util.JSON.decode(response.responseText);
                            if (res) {
                                for (var i = 0; i < res.length; i++) {
                                    var curr_node = node.childNodes[i];
                                    for (var j = 0; j < res[i].children.length; j++) {
                                        var newNode = new Ext.tree.AsyncTreeNode(res[i].children[j]);
                                        curr_node.appendChild(newNode);
                                        curr_node.loaded = true;
                                    }
                                }
                            }
                        }, failure: function (response, opts) {
                            Ext.Msg.alert('', 'failed');
                        }
                    });
                }
            });
        }
        // Параметр "Сортировать папки"
        // если true, то папки всегда будут выше простых элементов
        // если false, то папки ведут себя также как элементы
        baseConfig.folderSort = true;
        baseConfig.enableSort = false;
        if (params.folderSort != undefined) {
            baseConfig.folderSort = params.folderSort;
        }
        Ext.m3.ObjectTree.superclass.constructor.call(this, baseConfig, params);
    },

    initComponent: function () {
        var loader = this.getLoader();
        loader.baseParams = this.getMainContext();

        Ext.m3.ObjectTree.superclass.initComponent.call(this);
        // Созадем свой сортировщик с переданными параметрами
        if (this.enableTreeSort) {
            var sorter = new Ext.ux.tree.TreeGridSorter(this, {
                folderSort: this.folderSort,
                property: this.columns[0].dataIndex || 'text'
            });
        }
        // Повесим отображение маски при загрузке дерева
        loader.on('beforeload', this.onBeforeLoad, this);
        loader.on('load', this.onLoad, this);
        loader.on('loadexception', this.onLoadException, this);
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

    showMask: function (visible) {
        var loader = this.getLoader();
        if (this.treeLoadingMask == undefined) {
            this.treeLoadingMask = new Ext.LoadMask(this.el, {msg: "Загрузка..."});
        }
        if (visible) {
            this.treeLoadingMask.show();
        } else {
            this.treeLoadingMask.hide();
        }
    },

    onBeforeLoad: function (treeloader, node, callback) {
        this.showMask(true);
    },

    onLoad: function (treeloader, node, response) {
        this.showMask(false);
    },

    onLoadException: function (treeloader, node, response) {
        this.showMask(false);
    },

    onNewRecord: function () {
        assert(this.actionNewUrl, 'actionNewUrl is not define');

        var req = {
            url: this.actionNewUrl,
            method: 'POST',
            params: this.getMainContext(),
            scope: this,
            success: function (res, opt) {
                return this.childWindowOpenHandler(res, opt, 'new');
            },
            failure: function () {
                uiAjaxFailMessage.apply(this, arguments);
            }
        };

        if (this.fireEvent('beforenewrequest', this, req, false)) {
            Ext.Ajax.request(req);
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
        var scope = this;

        var req = {
            url: this.actionNewUrl,
            scope: this,
            method: "POST",
            params: baseConf,
            success: function (res, opt) {
                return this.childWindowOpenHandler(res, opt, 'newChild');
            },
            failure: function () {
                uiAjaxFailMessage.apply(this, arguments);
            }
        };

        if (this.fireEvent('beforenewrequest', this, req, true)) {
            Ext.Ajax.request(req);
        }
    },

    onEditRecord: function () {
        assert(this.actionEditUrl, 'actionEditUrl is not define');
        assert(this.rowIdName, 'rowIdName is not define');

        if (this.getSelectionModel().getSelectedNode()) {
            var baseConf = this.getSelectionContext();

            var req = {
                url: this.actionEditUrl,
                scope: this,
                method: 'POST',
                params: baseConf,
                success: function (res, opt) {
                    return this.childWindowOpenHandler(res, opt, 'edit');
                },
                failure: function () {
                    uiAjaxFailMessage.apply(this, arguments);
                }
            };

            if (this.fireEvent('beforeeditrequest', this, req)) {
                Ext.Ajax.request(req);
            }
        }
    },

    onDeleteRecord: function () {
        assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
        assert(this.rowIdName, 'rowIdName is not define');
        var node = this.getSelectionModel().getSelectedNode()
        if (node) {

            Ext.Msg.show({
                title: 'Удаление записи',
                scope: this,
                msg: 'Вы действительно хотите удалить выбранную запись?',
                icon: Ext.Msg.QUESTION,
                buttons: Ext.Msg.YESNO,
                fn: function (btn, text, opt) {
                    if (btn != 'yes')
                        return;

                    if (this.getSelectionModel().getSelectedNode()) {
                        var baseConf = this.getSelectionContext();

                        var req = {
                            url: this.actionDeleteUrl,
                            scope: this,
                            params: baseConf,
                            success: function (res, opt) {
                                return this.deleteOkHandler(res, opt);
                            },
                            failure: function () {
                                uiAjaxFailMessage.apply(this, arguments);
                            }
                        };

                        if (this.fireEvent('beforedeleterequest', this, req)) {
                            Ext.Ajax.request(req);
                        }
                    }
                }
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

    childWindowOpenHandler: function (response, opts, operation) {

        var window = smart_eval(response.responseText);
        if (window) {
            window.on('closed_ok', function (data) {
                if (this.incrementalUpdate) {
                    // нам пришел узел дерева
                    var obj = Ext.util.JSON.decode(data);
                    var selectedNode = this.getSelectionModel().getSelectedNode();
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
                    return this.refreshStore()
                }
            }, this);
        }
    },
    deleteOkHandler: function (response, opts) {
        if (this.incrementalUpdate) {
            // проверка на ошибки уровня приложения
            var res = Ext.util.JSON.decode(response.responseText);
            if (!res.success) {
                smart_eval(response.responseText);
                return;
            }
            // нам просто надо удалить выделенный элемент
            var selectedNode = this.getSelectionModel().getSelectedNode();
            var parentNode = selectedNode.parentNode;
            parentNode.removeChild(selectedNode);
            parentNode.select();
        } else {
            smart_eval(response.responseText);
            this.refreshStore();
        }
    },
    refreshStore: function () {
        this.getLoader().baseParams = this.getMainContext();
        this.getLoader().load(this.getRootNode());
    },
    /**
     * Получение основного контекста дерева
     * Используется при ajax запросах
     */
    getMainContext: function () {
        return Ext.applyIf({}, this.actionContextJson);
    },
    /**
     * Получение контекста выделения строк/ячеек
     * Используется при ajax запросах
     * @param {bool} withRow Признак добавление в контекст текущей выбранной записи
     */
    getSelectionContext: function (withRow) {
        var baseConf = this.getMainContext();
        if (this.getSelectionModel().getSelectedNode()) {
            baseConf[this.rowIdName] = this.getSelectionModel().getSelectedNode().id;
        }
        return baseConf;
    }
});

Ext.reg('m3-object-tree', Ext.m3.ObjectTree);
