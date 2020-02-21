/**
 * Расширенный грид на базе Ext.grid.GridPanel
 * @param {Object} config
 */
Ext.m3.GridPanel = Ext.extend(Ext.grid.GridPanel, {
	constructor: function(baseConfig, params){
		
		// Добавлене selection model если нужно
		var selModel = params.selModel;
		var gridColumns = params.colModel || [];
		if (selModel && selModel instanceof Ext.grid.CheckboxSelectionModel) {
			gridColumns.columns.unshift(selModel);
		}
		
		// Навешивание обработчиков на контекстное меню если нужно 
		var funcContMenu;
		if (params.menus.contextMenu && 
			params.menus.contextMenu instanceof Ext.menu.Menu) {

			funcContMenu = function(e){
				e.stopEvent();
	            params.menus.contextMenu.showAt(e.getXY())
			}
		} else {
			funcContMenu = Ext.emptyFn;
		}
		
		var funcRowContMenu;
		if (params.menus.rowContextMenu && 
			params.menus.rowContextMenu instanceof Ext.menu.Menu) {
			
			funcRowContMenu = function(grid, index, e){
				e.stopEvent();
				if (!this.getSelectionModel().isSelected(index)) {
						this.getSelectionModel().selectRow(index);
				};
                params.menus.rowContextMenu.showAt(e.getXY())
			}
		} else {
			funcRowContMenu = Ext.emptyFn;
		}
		
		var plugins = params.plugins || [];
		var bundedColumns = params.bundedColumns;
		if (bundedColumns && bundedColumns instanceof Array &&
			bundedColumns.length > 0) {

			plugins.push( 
				new Ext.ux.grid.ColumnHeaderGroup({
					rows: bundedColumns
				})
			);
		}
		
		// объединение обработчиков
		baseConfig.listeners = Ext.applyIf({
			contextmenu: funcContMenu
			,rowcontextmenu: funcRowContMenu
			,beforerender: function(){
				var bbar = this.getBottomToolbar();
				var pageBar =
					bbar && bbar.items && bbar.items.items &&
					bbar.items.items.find(function(item) {
						return item instanceof Ext.PagingToolbar;
					}) ||
					bbar;
				if (pageBar && pageBar instanceof Ext.PagingToolbar) {
					var store = this.getStore();
					store.setBaseParam('start', 0);
					store.setBaseParam('limit', pageBar.pageSize);
					pageBar.bind(store);
				}
			}	
		},
		baseConfig.listeners || {});

		var config = Ext.applyIf({
			sm: selModel,
			colModel: gridColumns,
			plugins: plugins
		}, baseConfig);
		
		Ext.m3.GridPanel.superclass.constructor.call(this, config);
	},
	initComponent: function(){
		Ext.m3.GridPanel.superclass.initComponent.call(this);
		var store = this.getStore();
		store.on('exception', this.storeException, this);
	},
	/**
	 * Обработчик исключений хранилица
	 */
	storeException: function (proxy, type, action, options, response, arg){
		uiAjaxFailMessage(response, options);
	}
});

Ext.m3.EditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel, {
  constructor: function(baseConfig, params){
    
    // Добавлене selection model если нужно
    var selModel = params.selModel;
    var gridColumns = params.colModel || [];
    if (selModel && selModel instanceof Ext.grid.CheckboxSelectionModel) {
      gridColumns.columns.unshift(selModel);
    }

    // Навешивание обработчиков на контекстное меню если нужно
    var funcContMenu;
    if (params.menus.contextMenu &&
      params.menus.contextMenu instanceof Ext.menu.Menu) {

      funcContMenu = function(e){
        e.stopEvent();
		params.menus.contextMenu.showAt(e.getXY())
      }
    } else {
      funcContMenu = Ext.emptyFn;
    }

    var funcRowContMenu;
    if (params.menus.rowContextMenu &&
      params.menus.contextMenu instanceof Ext.menu.Menu) {

      funcRowContMenu = function(grid, index, e){
        e.stopEvent();
        var selectionModel = this.getSelectionModel();
		if (selectionModel instanceof Ext.grid.RowSelectionModel){
        	selectionModel.selectRow(index);
        	params.menus.rowContextMenu.showAt(e.getXY());
		}
      }
    } else {
      funcRowContMenu = Ext.emptyFn;
    }
    
    var plugins = params.plugins || [];
    var bundedColumns = params.bundedColumns;
    if (bundedColumns && bundedColumns instanceof Array &&
      bundedColumns.length > 0) {

      plugins.push( 
        new Ext.ux.grid.ColumnHeaderGroup({
          rows: bundedColumns
        })
      );
    }
    
    // объединение обработчиков
    baseConfig.listeners = Ext.applyIf({
      contextmenu: funcContMenu
      ,rowcontextmenu: funcRowContMenu
      ,beforerender: function(){
        var bbar = this.getBottomToolbar();
        if (bbar && bbar instanceof Ext.PagingToolbar){
          var store = this.getStore();
          // Оставлено, так как разработчик может поменять pageSize и новое значение
          // может быть не равно limit-у.
          store.setBaseParam('limit',bbar.pageSize);
          bbar.bind(store);
        }
      } 
    }
    ,baseConfig.listeners || {});

    var config = Ext.applyIf({
      sm: selModel
      ,colModel: gridColumns
      ,plugins: plugins
    }, baseConfig);
    
    Ext.m3.EditorGridPanel.superclass.constructor.call(this, config);
  }
	,initComponent: function(){
		Ext.m3.EditorGridPanel.superclass.initComponent.call(this);
		var store = this.getStore();
		store.on('exception', this.storeException, this);
	}
	/**
	 * Обработчик исключений хранилица
	 */
	,storeException: function (proxy, type, action, options, response, arg){
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