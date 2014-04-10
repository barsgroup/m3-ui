/**
 * Расширенный грид на базе Ext.grid.GridPanel
 * @param {Object} config
 */

function m3GridInit(grid) {
    // Настройка грида по расширенному конфигу из параметров
    var params = grid.params || {};

    // Создание ColumnModel если надо
    var colModel = grid.cm;
    if (colModel) {
        // раньше был экземпляр ColModel, теперь приходи конфиг
        if (!(colModel instanceof Ext.grid.ColumnModel)) {
            colModel = Ext.create(colModel);
        }
        delete grid.cm;
        grid.colModel = colModel;
    }

    // Добавлене selection model если нужно
    var selModel = grid.sm;
    if (selModel) {
        // раньше был экземпляр SelModel, теперь приходи конфиг
        if (!(selModel instanceof Ext.grid.AbstractSelectionModel)) {
            selModel = Ext.create(selModel);
        }
        // если это чекбоксы, то добавим колонку
        if (selModel instanceof Ext.grid.CheckboxSelectionModel) {
            if (grid.colModel) {
                grid.colModel.columns.unshift(selModel);
            } else {
                if (grid.columns) {
                    grid.columns.unshift(selModel);
                }
            }
        }
        delete grid.sm;
        grid.sm = selModel;
    }

    // Создание GridView если надо
    var view = grid.view;
    if (view) {
        // раньше был экземпляр GridView, теперь приходи конфиг
        if (!(view instanceof Ext.grid.GridView)) {
            view = Ext.create(view);
        }
        delete grid.view;
        grid.view = view;
    }

    // Навешивание обработчиков на контекстное меню если нужно
    var funcContMenu;
    if (params.contextMenu) {
        // раньше был экземпляр меню, теперь приходи конфиг
        if (!(params.contextMenu instanceof Ext.menu.Menu)) {
            params.contextMenu = Ext.create(params.contextMenu);
        }

        funcContMenu = function(e){
            e.stopEvent();
            params.contextMenu.showAt(e.getXY())
        }
    } else {
        funcContMenu = Ext.emptyFn;
    }

    var funcRowContMenu;
    if (params.rowContextMenu) {
        // раньше был экземпляр меню, теперь приходи конфиг
        if (!(params.rowContextMenu instanceof Ext.menu.Menu)) {
            params.rowContextMenu = Ext.create(params.rowContextMenu);
        }

        funcRowContMenu = function(grid, index, e){
            e.stopEvent();
            if (!grid.getSelectionModel().isSelected(index)) {
                grid.getSelectionModel().selectRow(index);
            }
            params.rowContextMenu.showAt(e.getXY())
        }
    } else {
        funcRowContMenu = Ext.emptyFn;
    }

    // Группировочные колонки
    var bandedColumns = params.bandedColumns;
    if (bandedColumns && bandedColumns instanceof Array &&
        bandedColumns.length > 0) {

        if (!grid.plugins) {
            grid.plugins = [];
        }
        grid.plugins.push(
            new Ext.ux.grid.ColumnHeaderGroup({
                rows: bandedColumns
            })
        );
    }

    // Фильтры
    // проверим набор колонок на наличие фильтров,
    // если есть, то добавим плагин с фильтрами
    var columns;
    if (grid.colModel) {
        columns = grid.colModel.columns;
    } else {
        columns = grid.columns;
    }
    if (columns) {
        var needFilterPlugin = false;
        Ext.each(columns, function(col) {
           if (col.filter) {
               needFilterPlugin = true;
               return false;
           }
        });
        if (needFilterPlugin) {
            grid.plugins.push(
                {'ptype': 'gridfilters', 'menuFilterText': 'Фильтр'}
            );
        }
    }

    // объединение обработчиков
    grid.on('contextmenu', funcContMenu);
    grid.on('rowcontextmenu', funcRowContMenu);
    grid.on('beforerender', function(grid) {
        var bbar = grid.getBottomToolbar();
        if (bbar && bbar instanceof Ext.PagingToolbar){
            var store = grid.getStore();
            store.setBaseParam('start',0);
            store.setBaseParam('limit',bbar.pageSize);
            bbar.bind(store);
        }
    });
}

Ext.m3.GridPanel = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function(){
        // настройка конфига грида перед созданием
        m3GridInit(this);

        Ext.m3.GridPanel.superclass.initComponent.call(this);
        var store = this.getStore();
		store.on('exception', this.storeException, this);
	}
	/**
	 * Обработчик исключений хранилица
	 */
	,storeException: function (proxy, type, action, options, response, arg){
		//console.log(proxy, type, action, options, response, arg);
		if (type == 'remote' && action != Ext.data.Api.actions.read) {
		    if (response.raw.message) {
  		        Ext.Msg.show({
  		            title: 'Внимание!',
  		            msg: response.raw.message,
  		            buttons: Ext.Msg.CANCEL,
  		            icon: Ext.Msg.WARNING
  		        });
  		    }
		} else {
		    uiAjaxFailMessage(response, options);
		}
	}
});

Ext.m3.EditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel, {
    initComponent: function(){
        // настройка конфига грида перед созданием
        m3GridInit(this);

        Ext.m3.EditorGridPanel.superclass.initComponent.call(this);
        var store = this.getStore();
		store.on('exception', this.storeException, this);
	}
	/**
	 * Обработчик исключений хранилица
	 */
	,storeException: function (proxy, type, action, options, response, arg){
		//console.log(proxy, type, action, options, response, arg);
		if (type == 'remote' && action != Ext.data.Api.actions.read) {
		    if (response.raw.message) {
  		        Ext.Msg.show({
  		            title: 'Внимание!',
  		            msg: response.raw.message,
  		            buttons: Ext.Msg.CANCEL,
  		            icon: Ext.Msg.WARNING
  		        });
  		    }
		} else {
		    uiAjaxFailMessage(response, options);
		}
	}
});

Ext.reg('m3-grid', Ext.m3.GridPanel);
Ext.reg('m3-edit-grid', Ext.m3.EditorGridPanel);

Ext.reg('sm-cell', Ext.grid.CellSelectionModel);
Ext.reg('sm-checkbox', Ext.grid.CheckboxSelectionModel);
Ext.reg('sm-row', Ext.grid.RowSelectionModel);

Ext.reg('view-grouping', Ext.grid.GroupingView);