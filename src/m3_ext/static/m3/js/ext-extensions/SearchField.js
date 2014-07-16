/**
 * Модифицированный контрол поиска, за основу был взят контрол от ui.form.SearchField
 * @class {Ext.m3.SearchField} Контрол поиска
 * @extends {Ext.form.TwinTriggerField} Абстрактный класс как раз для разного рода таких вещей, типа контрола поиска
 */
Ext.define('Ext.m3.SearchField', {
    extend: 'Ext.form.TwinTriggerField',
    xtype: 'm3-search-field',

    initComponent: function () {
        Ext.m3.SearchField.superclass.initComponent.call(this);
        this.on('specialkey', function (f, e) {
            if (e.getKey() == e.ENTER) {
                this.onTrigger2Click();
            }
        }, this);
    },
    validationEvent: false,
    validateOnBlur: false,
    trigger1Class: 'x-form-clear-trigger',
    trigger2Class: 'x-form-search-trigger',
    hideTrigger1: true,
    width: 180,
    hasSearch: false,
    paramName: 'filter',
    paramId: 'id',
    nodeId: '-1',
    componentItemId: null,
    _getMainParent: function(parent){
        if (parent.ownerCt){
            return this._getMainParent.call(this, parent.ownerCt);
        }
        return parent;
    },
    _getComponentForSearch: function(){
        var mainParent = this._getMainParent.call(this, this.ownerCt);
        var result = mainParent.find('itemId', this.componentItemId);
        if (result.length > 0){
            return result[0];
        }
        return null;
    },
    onTrigger1Click: function () {
        if (this.hasSearch) {

            this.el.dom.value = '';
            var cmp = this._getComponentForSearch();
            if (cmp instanceof Ext.grid.GridPanel) {
                var o = {start: 0};
                var store = cmp.getStore();
                store.baseParams = store.baseParams || {};
                store.baseParams[this.paramName] = '';
                store.baseParams[this.paramId] = this.nodeId || '';
                store.reload({params: o});

            } else if (cmp instanceof Ext.ux.tree.TreeGrid) {
                this.el.dom.value = '';

                var loader = cmp.getLoader();
                loader.baseParams = loader.baseParams || {};
                loader.baseParams[this.paramName] = '';
                var rootNode = cmp.getRootNode();
                loader.load(rootNode);
                rootNode.expand();
            }

            this.triggers[0].hide();
            this.hasSearch = false;
        }
    },
    onTrigger2Click: function () {

        var value = this.getRawValue();
        var cmp = this._getComponentForSearch();
        if (cmp instanceof Ext.grid.GridPanel) {
            var o = {start: 0};
            var store = cmp.getStore();
            store.baseParams = store.baseParams || {};
            store.baseParams[this.paramName] = value;
            store.baseParams[this.paramId] = this.nodeId || '';
            store.reload({params: o});
        } else if (cmp instanceof Ext.ux.tree.TreeGrid) {
            var loader = cmp.getLoader();
            loader.baseParams = loader.baseParams || {};
            loader.baseParams[this.paramName] = value;
            var rootNode = cmp.getRootNode();
            loader.load(rootNode);
            rootNode.expand();
        }

        if (value) {
            this.hasSearch = true;
            this.triggers[0].show();
        }
    },
    clear: function (node_id) {
        this.onTrigger1Click();
    },
    search: function (node_id) {
        this.onTrigger2Click();
    }
});
