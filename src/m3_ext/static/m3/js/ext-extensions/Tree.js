// FIXME: Если дерево небольшое по размерам, узлы могут не отображаться,
// но ресайз окна/контрола возвращает их обратно
// FIXME: Здесь также должен быть проброс action context'a

Ext.define('Ext.m3.Tree', {
    extend: 'Ext.ux.tree.TreeGrid',
    xtype: 'm3-tree',

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

        // создание корневого элемента из конфига
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

        Ext.m3.Tree.superclass.initComponent.call(this);
    }
});

// hack, позволяющий в TreeGrid использовать колонки с родным xtype=gridcolumn
Ext.reg('tggridcolumn', Ext.tree.Column);