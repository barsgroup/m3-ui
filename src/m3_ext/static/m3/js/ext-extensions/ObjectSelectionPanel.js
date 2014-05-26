/**
 * Created by prefer on 31/01/14.
 *
 * Компонент, который отражает слева грид, например с пэйджингом,
 * а справа выделенные в нем элементы
 */

Ext.define('Ext.m3.ObjectSelectionPanel', {
    extend: 'Ext.Container',
    xtype: 'm3-object-selection-panel',

    selectionColumns: [],

    selectionGridConf: {},

    constructor: function (cfg) {
        assert(cfg.selectionColumns, 'Columns for selection is undefined!');

        if (!(cfg.grid instanceof Ext.grid.GridPanel)) {
            cfg.grid.sm = new Ext.grid.CheckboxSelectionModel();
        } else {
            assert(this.grid.sm instanceof Ext.grid.CheckboxSelectionModel,
                'sm has been Ext.grid.CheckboxSelectionModel')
        }

        var fields = ['_check'];
        for (var i = 0; i < cfg.selectionColumns.length; i++) {
            fields.push(cfg.selectionColumns[i]['data_index']);
        }

        var sm = new Ext.grid.CheckboxSelectionModel();
        cfg.selectionColumns.unshift(sm);

        var selectionConf = Ext.applyIf(cfg.selectionGridConf, {
            region: 'east',
            width: 200,
            sm: sm,
            title: 'Выбранные записи',
            store: new Ext.data.ArrayStore({
                autoDestroy: true,
                fields: fields
            }),
            colModel: new Ext.grid.ColumnModel({
                columns: cfg.selectionColumns
            })
        });

        cfg.selectionGrid = new Ext.grid.GridPanel(selectionConf);

        cfg.items = cfg.items || [];
        cfg.items.unshift(cfg.selectionGrid);
        cfg.items.unshift(cfg.grid);

        Ext.m3.ObjectSelectionPanel.superclass.constructor.call(this, cfg);
    },

    initComponent: function () {
        this.callParent();
        // в object-grid-e вызывается getComponent поэтому Ext.create делать нельзя, пока окно не сформируется
        this.grid = this.items.first();

        this.grid.getSelectionModel().on('rowdeselect', this.onRowDeselect, this);
        this.grid.getSelectionModel().on('rowselect', this.onRowSelect, this);
        this.grid.getStore().on('load', this.onLoad, this);
        this.selectionGrid.getSelectionModel().on('rowdeselect', this.onRemoveSelected, this);
    },

    onRowSelect: function (selModel, rowIndex, record) {
        if (this.selectionGrid.store.indexOfId(record.id) < 0) {
            this.selectionGrid.store.add(record);
            this.selectionGrid.selModel.selectLastRow(true);
        }
    },

    onRowDeselect: function (selModel, rowIndex, record) {
        var index = this.selectionGrid.store.indexOfId(record.id);
        if (index >= 0) {
            this.selectionGrid.store.removeAt(index);
        }
    },

    onLoad: function (store) {
        var selectionRange = this.selectionGrid.store.getRange(),
            range = this.grid.store.getRange(),
            i = 0, j = 0;
        for (i = 0; i < selectionRange.length; i++) {
            for (j = 0; j < range.length; j++) {
                if (selectionRange[i]['id'] == range[j]['id']) {
                    this.grid.getSelectionModel().selectRow(j, true);
                }
            }
        }
    },
    /**
     * Возвращает выбранные в основном гриде элементы
     *
     * @returns {*|Array|Ext.data.Record[]}
     */
    getSelectedRecords: function () {
        return this.selectionGrid.store.getRange();
    },
    onRemoveSelected: function (selModel, rowIndex, record) {
        var index = this.grid.store.indexOfId(record.id);
        if (index >= 0) {
            this.grid.getSelectionModel().deselectRow(index);
        }
    }
});