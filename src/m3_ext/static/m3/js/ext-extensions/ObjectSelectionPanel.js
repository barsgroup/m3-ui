/**
 * Created by prefer on 31/01/14.
 *
 * Компонент, который отражает слева грид, например с пэйджингом,
 * а справа выделенные в нем элементы
 */

Ext.ns('Ext.m3');

Ext.m3.ObjectSelectionPanel = Ext.extend(Ext.Container, {

    selectionColumns: [],

    selectionGridConf: {},

    initComponent: function(){
        assert(this.selectionColumns, 'Columns for selection is undefined!');

        this.add(this.grid);

        var fields = ['_check'];
        for (var i=0; i<this.selectionColumns.length; i++){
            fields.push(this.selectionColumns[i]['data_index']);
        }

        var sm = new Ext.grid.CheckboxSelectionModel();
        this.selectionColumns.unshift(sm);

        var selectionConf = Ext.applyIf(this.selectionGridConf, {
             region: 'east',
             width: 200,
             sm: sm,
             title: 'Выбранные записи',
             store: new Ext.data.ArrayStore({
                autoDestroy: true,
                fields: fields
             }),
             colModel: new Ext.grid.ColumnModel({
                columns: this.selectionColumns
             })
         });

        this.selectionGrid = new Ext.grid.GridPanel(selectionConf);


        this.grid.getSelectionModel().on('rowdeselect', this.onRowDeselect, this);
        this.grid.getSelectionModel().on('rowselect', this.onRowSelect, this);
        this.grid.getStore().on('load', this.onLoad, this);
        this.selectionGrid.getSelectionModel().on('rowdeselect', this.onRemoveSelected, this);

        this.add(this.selectionGrid);
    },

    onRowSelect: function(selModel, rowIndex, record){
        if (this.selectionGrid.store.indexOfId(record.id) < 0) {
            this.selectionGrid.store.add(record);
            this.selectionGrid.selModel.selectLastRow(true);
        }
    },

    onRowDeselect: function(selModel, rowIndex, record){
        var index = this.selectionGrid.store.indexOfId(record.id);
        if (index >= 0){
            this.selectionGrid.store.removeAt(index);
        }
    },

    onLoad: function(store){
        var selectionRange = this.selectionGrid.store.getRange(),
            range = this.grid.store.getRange(),
            i = 0, j = 0;
        for (i=0; i<selectionRange.length; i++){
            for (j=0; j< range.length; j++){
                if (selectionRange[i]['id'] == range[j]['id']){
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
    getSelectedRecords: function(){
        return this.selectionGrid.store.getRange();
    },
    onRemoveSelected: function(selModel, rowIndex, record){
        var index = this.grid.store.indexOfId(record.id);
        if (index >= 0){
            this.grid.getSelectionModel().deselectRow(index);
        }
    }
});

Ext.reg('object-selection-panel', Ext.m3.ObjectSelectionPanel);