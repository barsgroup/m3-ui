/**
 * Расширенный грид на базе Ext.grid.GridPanel
 * @param {Object} config
 */

var baseM3Grid = {
    /**
     * Настройка грида по расширенному конфигу из параметров
     */
    configureM3Grid: function () {
        var params = this.params || {};

        // Создание ColumnModel если надо
        var colModel = this.cm;
        if (colModel) {
            // раньше был экземпляр ColModel, теперь приходи конфиг
            if (!(colModel instanceof Ext.grid.ColumnModel)) {
                colModel = Ext.create(colModel);
            }
            delete this.cm;
            this.colModel = colModel;
        }

        // Добавлене selection model если нужно
        var selModel = this.sm;
        if (selModel) {
            // раньше был экземпляр SelModel, теперь приходи конфиг
            if (!(selModel instanceof Ext.grid.AbstractSelectionModel)) {
                selModel = Ext.create(selModel);
            }
            // если это чекбоксы, то добавим колонку
            if (selModel instanceof Ext.grid.CheckboxSelectionModel) {
                if (this.colModel) {
                    this.colModel.columns.unshift(selModel);
                } else {
                    if (this.columns) {
                        this.columns.unshift(selModel);
                    }
                }
            }
            delete this.sm;
            this.sm = selModel;
        }

        // Создание GridView если надо
        var view = this.view;
        if (view) {
            // раньше был экземпляр GridView, теперь приходи конфиг
            if (!(view instanceof Ext.grid.GridView)) {
                view = Ext.create(view);
            }
            delete this.view;
            this.view = view;
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
                if (!this.getSelectionModel().isSelected(index)) {
                    this.getSelectionModel().selectRow(index);
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

            if (!this.plugins) {
                this.plugins = [];
            }
            this.plugins.push(
                new Ext.ux.grid.ColumnHeaderGroup({
                    rows: bandedColumns
                })
            );
        }

        // Фильтры
        // проверим набор колонок на наличие фильтров,
        // если есть, то добавим плагин с фильтрами
        var columns;
        if (this.colModel) {
            columns = this.colModel.columns;
        } else {
            columns = this.columns;
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
                this.plugins.push(
                    {'ptype': 'gridfilters', 'menuFilterText': 'Фильтр'}
                );
            }
        }

        // объединение обработчиков
        this.on('contextmenu', funcContMenu);
        this.on('rowcontextmenu', funcRowContMenu);
        this.on('beforerender', function(grid) {
            var bbar = this.getBottomToolbar();
            if (bbar && bbar instanceof Ext.PagingToolbar){
                var store = this.getStore();
                store.setBaseParam('start',0);
                store.setBaseParam('limit',bbar.pageSize);
                bbar.bind(store);
            }
        });
    }
    /**
     * Инициализация грида после создания
     */
    ,initM3Grid: function () {
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
};

Ext.m3.GridPanel = Ext.extend(Ext.grid.GridPanel,
    Ext.applyIf(baseM3Grid, {
        initComponent: function() {
            this.configureM3Grid();
            Ext.m3.GridPanel.superclass.initComponent.call(this);
            this.initM3Grid();
        }
    })
);

Ext.m3.EditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel,
    Ext.applyIf(baseM3Grid, {
        initComponent: function() {
            this.configureM3Grid();
            Ext.m3.EditorGridPanel.superclass.initComponent.call(this);
            this.initM3Grid();
        }
    })
);

Ext.reg('m3-grid', Ext.m3.GridPanel);
Ext.reg('m3-edit-grid', Ext.m3.EditorGridPanel);

Ext.reg('sm-cell', Ext.grid.CellSelectionModel);
Ext.reg('sm-checkbox', Ext.grid.CheckboxSelectionModel);
Ext.reg('sm-row', Ext.grid.RowSelectionModel);

Ext.reg('view-grouping', Ext.grid.GroupingView);