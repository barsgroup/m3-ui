Ext.ns('Ext.m3');

Ext.m3.LockingHeaderGroupWindow = Ext.extend(Ext.Window, {

    initComponent: function () {
        var grid = this.items[0];


        var rows = [
            [
                {'header': '1.1', 'colspan': 6, 'align': 'center'},
                {'header': '1.2', 'colspan': 6, 'align': 'center'}
            ],
            [
                {'header': '2.1', 'colspan': 3, 'align': 'center'},
                {'header': '2.2', 'colspan': 3, 'align': 'center'},
                {'header': '2.3', 'colspan': 3, 'align': 'center'},
                {'header': '2.4', 'colspan': 3, 'align': 'center'}
            ],
            [
                {'header': '3.1', 'colspan': 1, 'align': 'center'},
                {'header': '3.2', 'colspan': 1, 'align': 'center'},
                {'header': '3.3', 'colspan': 1, 'align': 'center'},
                {'header': '3.4', 'colspan': 1, 'align': 'center'},
                {'header': '3.5', 'colspan': 2, 'align': 'center'},
                {'header': '3.6', 'colspan': 2, 'align': 'center'},
                {'header': '3.7', 'colspan': 1, 'align': 'center'},
                {'header': '3.8', 'colspan': 2, 'align': 'center'},
                {'header': '3.9', 'colspan': 1, 'align': 'center'}
            ]
        ];


        grid.plugins = [{'ptype': 'm3-locking-column-header-group', 'columnModelCfg': {'rows': rows,
            'lockedCount': 2},
            'viewCfg': {'hideGroupedColumn': true}
        }];

        Ext.m3.LockingHeaderGroupWindow.superclass.initComponent.call(this);
    }

});

Ext.reg('m3-locking-header-group', Ext.m3.LockingHeaderGroupWindow);
