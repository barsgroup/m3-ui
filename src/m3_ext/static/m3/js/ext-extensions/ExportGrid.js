Ext.ns('Ext.ux.grid');

Ext.ux.grid.Exporter = Ext.extend(Ext.util.Observable,{
    title:'',
    sendDatFromStore: true,
    constructor: function(config){
        Ext.ux.grid.Exporter.superclass.constructor.call(this);
    },
    init: function(grid){
        if (grid instanceof Ext.grid.GridPanel){
            this.grid = grid;
            this.grid.on('afterrender', this.onRender, this);
        }
        this.dataUrl = this.grid.dataUrl;
    },
    onRender:function(){
        //создадим top bar, если его нет
        if (!this.grid.getTopToolbar()){
            this.grid.elements += ',tbar';
            this.grid.topToolbar = this.grid.createToolbar(this.grid.tbar);
        }
        //добавим кнопку
        this.grid.getTopToolbar().insert(0, new Ext.Button({
            text:'Экспорт',
            iconCls:'icon-application-go',
            listeners:{
                scope:this,
                click:this.exportData
            }
        }));
    },
    exportData:function(){
        columns = []
        Ext.each(this.grid.colModel.config,function(column,index){
            columns.push({
                data_index:column.dataIndex,
                header:column.header,
                id:column.id,
                is_column:column.isCoumn,
                sortable:column.sortable,
                width:column.width
            })
        });
        data = []

        if (this.sendDatFromStore){
            Ext.each(this.grid.store.data.items,function(item,index){ data.push(item.data) });
        }
        params = {
            columns: Ext.encode(columns),
            title: this.title || this.grid.title || this.grid.id,
            data: Ext.encode(data)
        }
        Ext.Ajax.request({
            url : '/ui/exportgrid-export',
            success : function(res,opt){                
                location.href=res.responseText;
            },
            failure : function(){
            },
            params : params
        });
    }
});