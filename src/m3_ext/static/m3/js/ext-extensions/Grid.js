/**
 * Расширенный грид на базе Ext.grid.GridPanel
 * @param {Object} config
 */
Ext.m3.GridPanel = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function(){
        // Настройка грида по расширенному конфигу из параметров
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
            // FIXME: пока закомментировал, т.к. непонятно почему надо так делать
            //if (selModel instanceof Ext.grid.CheckboxSelectionModel) {
        	//    gridColumns.columns.unshift(selModel);
            //}
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
		if (params.menus && params.menus.contextMenu) {
            // раньше был экземпляр меню, теперь приходи конфиг
			if (!(params.menus.contextMenu instanceof Ext.menu.Menu)) {
                params.menus.contextMenu = Ext.create(params.menus.contextMenu);
            }

			funcContMenu = function(e){
				e.stopEvent();
	            params.menus.contextMenu.showAt(e.getXY())
			}
		} else {
            funcContMenu = Ext.emptyFn;
		}

		var funcRowContMenu;
		if (params.menus && params.menus.rowContextMenu) {
            // раньше был экземпляр меню, теперь приходи конфиг
			if (!(params.menus.rowContextMenu instanceof Ext.menu.Menu)) {
                params.menus.rowContextMenu = Ext.create(params.menus.rowContextMenu);
            }

			funcRowContMenu = function(grid, index, e){
				e.stopEvent();
				if (!this.getSelectionModel().isSelected(index)) {
					this.getSelectionModel().selectRow(index);
				}
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
		this.on('contextmenu', funcContMenu);
        this.on('rowcontextmenu', funcRowContMenu);
        this.on('beforerender', function() {
			var bbar = this.getBottomToolbar();
			if (bbar && bbar instanceof Ext.PagingToolbar){
			    var store = this.getStore();
				store.setBaseParam('start',0);
				store.setBaseParam('limit',bbar.pageSize);
				bbar.bind(store);
			}
		});

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
        // Настройка грида по расширенному конфигу из параметров
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
            // FIXME: пока закомментировал, т.к. непонятно почему надо так делать
            //if (selModel instanceof Ext.grid.CheckboxSelectionModel) {
        	//    gridColumns.columns.unshift(selModel);
            //}
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
		if (params.menus && params.menus.contextMenu) {
            // раньше был экземпляр меню, теперь приходи конфиг
			if (!(params.menus.contextMenu instanceof Ext.menu.Menu)) {
                params.menus.contextMenu = Ext.create(params.menus.contextMenu);
            }

			funcContMenu = function(e){
				e.stopEvent();
	            params.menus.contextMenu.showAt(e.getXY())
			}
		} else {
            funcContMenu = Ext.emptyFn;
		}

		var funcRowContMenu;
		if (params.menus && params.menus.rowContextMenu) {
            // раньше был экземпляр меню, теперь приходи конфиг
			if (!(params.menus.rowContextMenu instanceof Ext.menu.Menu)) {
                params.menus.rowContextMenu = Ext.create(params.menus.rowContextMenu);
            }

			funcRowContMenu = function(grid, index, e){
				e.stopEvent();
				if (!this.getSelectionModel().isSelected(index)) {
					this.getSelectionModel().selectRow(index);
				}
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
		this.on('contextmenu', funcContMenu);
        this.on('rowcontextmenu', funcRowContMenu);
        this.on('beforerender', function() {
			var bbar = this.getBottomToolbar();
			if (bbar && bbar instanceof Ext.PagingToolbar){
			    var store = this.getStore();
				store.setBaseParam('start',0);
				store.setBaseParam('limit',bbar.pageSize);
				bbar.bind(store);
			}
		});

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