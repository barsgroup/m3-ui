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
        if (!this.grid.tbar){
            this.grid.elements += ',tbar';
            var tbar = new Ext.Toolbar();
            this.grid.tbar = tbar;
            this.grid.add(tbar);
            this.grid.doLayout();
    }
        this.grid.tbar.add(new Ext.Button({
            text:'Экспорт',
            listeners:{
                scope:this,
                click:this.exportData                
            }
        }));
    },
    exportData:function(){
        var columns = [];
        Ext.each(this.grid.colModel.config,function(column, index){
            columns.push({
                data_index:column.dataIndex,
                header:column.header,
                id:column.id,
                is_column:column.isCoumn,
                sortable:column.sortable,
                width:column.width
            })
        });
        var data = [];

        if (this.sendDatFromStore){
            Ext.each(this.grid.store.data.items,function(item,index){ data.push(item.data) });
        }
        var params = {
            columns: Ext.encode(columns),
            title: this.title || this.grid.title || this.grid.id,
            data: Ext.encode(data)
        };

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


function createFakeData(count) {
    var firstNames   = ['Ed', 'Tommy', 'Aaron', 'Abe', 'Jamie', 'Adam', 'Dave', 'David', 'Jay'],
        lastNames    = ['Spencer', 'Maintz', 'Conran', 'Elias', 'Avins', 'Mishcon', 'Kaneda', 'Davis', 'Robinson'],
        ratings      = [1, 2, 3, 4, 5],
        salaries     = [100, 400, 900, 1500, 1000000];

    var data = [];
    for (var i=0; i < (count || 25); i++) {
        var ratingId    = Math.floor(Math.random() * ratings.length),
            salaryId    = Math.floor(Math.random() * salaries.length),
            firstNameId = Math.floor(Math.random() * firstNames.length),
            lastNameId  = Math.floor(Math.random() * lastNames.length),

            rating      = ratings[ratingId],
            salary      = salaries[salaryId],
            name        = String.format("{0} {1}", firstNames[firstNameId], lastNames[lastNameId]);

        data.push([rating, salary, name]);
    }
    return data;
}

Ext.onReady(function() {

    var store = new Ext.data.ArrayStore({
        fields: [
           {name: 'rating', type: 'int'},
           {name: 'salary', type: 'float'},
           {name: 'name'}
        ]
    });

    store.loadData(createFakeData(25));

    var grid = new Ext.grid.GridPanel({
        store: store,
        columns: [
            {header: 'Name',   width: 160, sortable: false, dataIndex: 'name',   id:'company'},
            {header: 'Rating', width: 125, sortable: false, dataIndex: 'rating'},
            {header: 'Salary', width: 125, sortable: false, dataIndex: 'salary', renderer: 'usMoney'}
        ],
        autoExpandColumn: 'company',
        stripeRows: true,
        
        height: 350,
        width : 600,

        plugins: [new Ext.ux.grid.Exporter]
        
    });

    win.items.add(grid);

});
