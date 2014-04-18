/**
 *
 * @type {*|void}
 */

// FIXME: Если дерево небольшое по размерам, узлы могут не отображаться
Ext.m3.Tree = Ext.extend(Ext.ux.tree.TreeGrid, {

        useArrows: true,
        autoScroll: false,
        animate: true,
        containerScroll: true,
        border: false,
        split: true,
        customLoad: false,

        initComponent: function () {

            // если выставлен флаг read_only, выключаем drag&drop
            if (this.readOnly) {
                this.enableDD = false;
                this.enableDrag = false;
                this.enableDrop = false;
            }

            // если не указан корневой элемент, содаем тут
            this.root = new Ext.tree.AsyncTreeNode(this.root);

            // Контекстное меню на узлы
            if (this.contextMenu) {
                this.contextMenu = Ext.create(this.contextMenu);
                this.addListener('contextmenu', function (node, e) {
                    node.select();
                    this.contextMenu.contextNode = node;
                    this.contextMenu.showAt(e.getXY());
                }, this);
            }

            // Контекстное меню на контейнер
            if (this.containerContextMenu) {
                this.containerContextMenu = Ext.create(this.containerContextMenu);
                this.addListener('containercontextmenu', function (node, e) {
                    e.stopEvent();
                    this.containerContextMenu.showAt(e.getXY());
                }, this);
            }

            if (this.customLoad) {
                assert(this.dataUrl, "Url must be specified!");

                this.on('expandnode', function (node) {
                    var nodeList = [];
                    if (node.hasChildNodes()) {
                        for (var i = 0; i < node.childNodes.length; i++) {
                            if (!node.childNodes[i].isLoaded()) {
                                nodeList.push(node.childNodes[i].id);
                            }
                        }
                    }
                    if (nodeList.length > 0)
                        Ext.Ajax.request({
                            url: this.dataUrl,
                            params: {
                                'list_nodes': nodeList.join(',')
                            },
                            success: function (response, opts) {
                                var res = Ext.decode(response.responseText);

                                if (res) {
                                    for (var i = 0; i < res.length; i++) {
                                        var currNode = node.childNodes[i];
                                        for (var j = 0; j < res[i].children.length; j++) {
                                            var newNode = new Ext.tree.AsyncTreeNode(res[i].children[j]);
                                            currNode.appendChild(newNode);
                                            currNode.loaded = true;
                                        }
                                    }
                                }
                            },
                            failure: function (response, opts) {
                                Ext.Msg.alert('', 'failed');
                            }
                        });
                });

            }

            Ext.m3.Tree.superclass.initComponent.call(this);
        }
    }
);

Ext.reg('m3-tree', Ext.m3.Tree);

// hack, позволяющий в TreeGrid использовать колонки с родным xtype=gridcolumn
Ext.reg('tggridcolumn', Ext.tree.Column);