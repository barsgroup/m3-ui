/**
 * Объектный грид, включает в себя тулбар с кнопками добавить, редактировать и удалить
 */


var baseObjectGrid = {
    /**
     * Настройка объектного грида по расширенному конфигу из параметров
     */
    configureObjectGrid: function() {
        var params = this.params || {};
        assert(params.allowPaging !== undefined,'allowPaging is undefined');
        assert(params.rowIdName !== undefined,'rowIdName is undefined');
        assert(params.actions !== undefined,'actions is undefined');

        this.allowPaging = params.allowPaging;
        this.rowIdName = params.rowIdName;
        // используется при режиме выбора ячеек.
        // через этот параметр передается имя выбранной колонки
        this.columnParamName = params.columnParamName;
        this.actionNewUrl = params.actions.newUrl;
        this.actionEditUrl = params.actions.editUrl;
        this.actionDeleteUrl = params.actions.deleteUrl;
        this.actionDataUrl = params.actions.dataUrl;
        this.actionContextJson = params.actions.contextJson;
        // признак клиентского редактирования
        this.localEdit = params.localEdit;
        // имя для сабмита в режиме клиентского редактирования
        this.name = params.name;
        // проставление адреса запроса за данными
        if (this.store && !this.store.url) {
            this.store.url = this.actionDataUrl;
        }
    }
    ,initObjectGrid: function () {
        // настроим кнопки тулбара
        var add_item = this.getTopToolbar().getComponent("button_new");
        if (add_item) {
            if (!this.actionNewUrl) {
                add_item.hide();
            }
            if (!add_item.handler) {
                add_item.setHandler(this.onNewRecord, this);
            }
        }
        var edit_item = this.getTopToolbar().getComponent("button_edit");
        if (edit_item) {
            if (!this.actionEditUrl) {
                edit_item.hide();
            }
            if (!edit_item.handler) {
                edit_item.setHandler(this.onEditRecord, this);
            }
            this.on('dblclick', edit_item.handler);
        }
        var delete_item = this.getTopToolbar().getComponent("button_delete");
        if (delete_item) {
            if (!this.actionDeleteUrl) {
                delete_item.hide();
            }
            if (!delete_item.handler) {
                delete_item.setHandler(this.onDeleteRecord, this);
            }
        }
        var refresh_item = this.getTopToolbar().getComponent("button_refresh");
        if (refresh_item) {
            if (!this.actionDataUrl) {
                refresh_item.hide();
            }
            if (!refresh_item.handler) {
                refresh_item.setHandler(this.refreshStore, this);
            }
        }

        var store = this.getStore();
		store.baseParams = Ext.applyIf(store.baseParams || {}, this.actionContextJson || {});

		this.addEvents(
			/**
			 * Событие до запроса добавления записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер
			 */
			'beforenewrequest',
			/**
			 * Событие после запроса добавления записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса
			 */
			'afternewrequest',
			/**
			 * Событие до запроса редактирования записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер
			 */
			'beforeeditrequest',
			/**
			 * Событие после запроса редактирования записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса
			 */
			'aftereditrequest',
			/**
			 * Событие до запроса удаления записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер
			 */
			'beforedeleterequest',
			/**
			 * Событие после запроса удаления записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса
			 */
			'afterdeleterequest',
            /**
             * Событие после успешного диалога добавления записи - встроенная обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат добавления (ответ сервера)
             */
            'rowadded',
            /**
             * Событие после успешного диалога редактирования записи - встроенная обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат редактирования  (ответ сервера)
             */
            'rowedited',
            /**
             * Событие после успешного диалога удаления записи - встроенная обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат удаления (ответ сервера)
             */
            'rowdeleted'
		);
    }
	/**
	 * Нажатие на кнопку "Новый"
	 */
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		var mask = new Ext.LoadMask(this.body),
		    params = this.getMainContext();
		params[this.rowIdName] = '';

		var req = {
			url: this.actionNewUrl,
			params: params,
			success: function(res, opt){
				if (scope.fireEvent('afternewrequest', scope, res, opt)) {
				    try {
				        var child_win = scope.onNewRecordWindowOpenHandler(res, opt);
				    } finally {
    				    mask.hide();
				    }
					return child_win;
				}
				mask.hide();
			}
           ,failure: function(){
               uiAjaxFailMessage.apply(this, arguments);
               mask.hide();

           }
		};

		if (this.fireEvent('beforenewrequest', this, req)) {
			var scope = this;

			mask.show();
            UI.ajax(req.url, req.params).then(req.success).catch(req.failure);
			//Ext.Ajax.request(req);
		}

	}
	/**
	 * Нажатие на кнопку "Редактировать"
	 */
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');

	    if (this.getSelectionModel().hasSelection()) {
	    	// при локальном редактировании запросим также текущую строку
			var baseConf = this.getSelectionContext(this.localEdit);
			// грязный хак
			if (String(baseConf[this.rowIdName]).indexOf(",") != -1) {
				Ext.Msg.show({
					title: 'Редактирование',
					msg: 'Редактирование возможно лишь в том случае, если выбран только один элемент!',
					buttons: Ext.Msg.OK,
					icon: Ext.MessageBox.INFO
				    });
			} else {
				var mask = new Ext.LoadMask(this.body);
				var req = {
					url: this.actionEditUrl,
					params: baseConf,
					success: function(res, opt){
						if (scope.fireEvent('aftereditrequest', scope, res, opt)) {
						    try {
							    var child_win = scope.onEditRecordWindowOpenHandler(res, opt);
							} finally {
	    						mask.hide();
							}
							return child_win;
						}
						mask.hide();
					}
	               ,failure: function(){
	                   uiAjaxFailMessage.apply(this, arguments);
	                   mask.hide();
	               }
				};

				if (this.fireEvent('beforeeditrequest', this, req)) {
					var scope = this;

					mask.show();
                    UI.ajax(req.url, req.params).then(req.success).catch(req.failure);
					//Ext.Ajax.request(req);
				}
			};
	    } else {
		Ext.Msg.show({
			title: 'Редактирование',
			msg: 'Элемент не выбран',
			buttons: Ext.Msg.OK,
			icon: Ext.MessageBox.INFO
		    });
	    }
	}
	/**
	 * Нажатие на кнопку "Удалить"
	 */
	,onDeleteRecord: function (){
		assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');

		var scope = this;
		if (scope.getSelectionModel().hasSelection()) {
		    Ext.Msg.show({
		        title: 'Удаление записи',
			    msg: 'Вы действительно хотите удалить выбранную запись?',
			    icon: Ext.Msg.QUESTION,
		        buttons: Ext.Msg.YESNO,
		        fn:function(btn, text, opt){
		            if (btn == 'yes') {
						var baseConf = scope.getSelectionContext(scope.localEdit);
						var mask = new Ext.LoadMask(scope.body);
						var req = {
		                   url: scope.actionDeleteUrl,
		                   params: baseConf,
		                   success: function(res, opt){
		                	   if (scope.fireEvent('afterdeleterequest', scope, res, opt)) {
		                	       try {
		                		       var child_win =  scope.deleteOkHandler(res, opt);
		                		   } finally {
    		                		   mask.hide();
    		                	   }
		                		   return child_win;
		                	   }
		                	   mask.hide();
						   }
                           ,failure: function(){
                               uiAjaxFailMessage.apply(this, arguments);
                               mask.hide();
                           }
		                };
						if (scope.fireEvent('beforedeleterequest', scope, req)) {

						    mask.show();
							Ext.Ajax.request(req);
						}
	                }
	            }
	        });
		} else {
                    Ext.Msg.show({
                            title: 'Удаление',
                            msg: 'Элемент не выбран',
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.INFO
                        });
                }
	}

	/**
	 * Показ и подписка на сообщения в дочерних окнах
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,onNewRecordWindowOpenHandler: function (response, opts){
	    var window = evalResult(response);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(data){
                if (scope.fireEvent('rowadded', scope, data)) {
                    // если локальное редактирование
                    if (scope.localEdit){
                        // то на самом деле нам пришла строка грида
                        var obj = Ext.util.JSON.decode(data);
                        var record = new Ext.data.Record(obj.data);
                        record.json = obj.data;
                        var store = scope.getStore();
                        // и надо ее добавить в стор
                        store.add(record);
                        var sm = scope.getSelectionModel();
                        sm.selectRecords([record]);
                    } else {
                        return scope.refreshStore();
                    }
                }
			});
	    }
	}
	,onEditRecordWindowOpenHandler: function (response, opts){
	    var window = evalResult(response);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(data){
                if (scope.fireEvent('rowedited', scope, data)) {
                    // если локальное редактирование
                    if (scope.localEdit){
                        // то на самом деле нам пришла строка грида
                        var obj = Ext.util.JSON.decode(data);
                        var record = new Ext.data.Record(obj.data);
                        record.json = obj.data;
                        var store = scope.getStore();
                        // и надо ее заменить в сторе
                        var sm = scope.getSelectionModel();
                        if (sm.hasSelection()) {
                            var baseConf = {};
                            // пока только для режима выделения строк
                            if (sm instanceof Ext.grid.RowSelectionModel) {
                                var rec = sm.getSelected();
                                var index = store.indexOf(rec);
                                store.remove(rec);
                                if (index < 0) {
                                    index = 0;
                                }
                                store.insert(index, record);
                                sm.selectRow(index);
                            }
                        }
                    } else {
                        return scope.refreshStore();
                    }
                }
			});
	    }
	}
	/**
	 * Хендлер на удаление окна
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,deleteOkHandler: function (response, opts){
        if (this.fireEvent('rowdeleted', this, response)) {
            // если локальное редактирование
            if (this.localEdit){
                // проверка на ошибки уровня приложения
                var res = Ext.util.JSON.decode(response.responseText);
                if(!res.success){
                    evalResult(response);
                    return;
                }
                var store = this.getStore();
                // и надо ее заменить в сторе
                var sm = this.getSelectionModel();
                if (sm.hasSelection()) {
                    // только для режима выделения строк
                    if (sm instanceof Ext.grid.RowSelectionModel) {
                        var rec = sm.getSelections();
                        store.remove(rec);
                    }
                }
            } else {
                evalResult(response);
                this.refreshStore();
            }
        }
	}
	,refreshStore: function (){
		if (this.allowPaging) {
			var pagingBar = this.getBottomToolbar();
			if(pagingBar &&  pagingBar instanceof Ext.PagingToolbar){
			    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
		        pagingBar.changePage(active_page);
			} else {
                this.getStore().load();
            }
		} else {
			this.getStore().load();
		}

	}
    /**
     * Получение основного контекста грида
     * Используется при ajax запросах
     */
    ,getMainContext: function(){
    	return Ext.applyIf({}, this.actionContextJson);
    }
    /**
     * Получение контекста выделения строк/ячеек
     * Используется при ajax запросах
     * @param {bool} withRow Признак добавление в контекст текущей выбранной записи
     */
    ,getSelectionContext: function(withRow){
    	var baseConf = this.getMainContext();
		var sm = this.getSelectionModel();
		var record;
		// для режима выделения строк
		if (sm instanceof Ext.grid.RowSelectionModel) {
			if (sm.singleSelect) {
				record = sm.getSelected();
				baseConf[this.rowIdName] = record.id;
			} else {
				// для множественного выделения
				var sels = sm.getSelections();
				var ids = [];
				record = [];
				for(var i = 0, len = sels.length; i < len; i++){
					record.push(sels[i]);
					ids.push(sels[i].id);
				}
				baseConf[this.rowIdName] = ids.join();
			}
		}
		// для режима выделения ячейки
		else if (sm instanceof Ext.grid.CellSelectionModel) {
			assert(this.columnParamName, 'columnParamName is not define');

			var cell = sm.getSelectedCell();
			if (cell) {
				record = this.getStore().getAt(cell[0]);
				baseConf[this.rowIdName] = record.id;
				baseConf[this.columnParamName] = this.getColumnModel().getDataIndex(cell[1]);
			}
		}
		// если просят выделенную строку
        if (withRow){
        	// то нужно добавить в параметры текущую строку грида
        	if (Ext.isArray(record)){
        		// пока х.з. что делать - возьмем первую
        		baseConf = Ext.applyIf(baseConf, record[0].json);
        	} else {
        		baseConf = Ext.applyIf(baseConf, record.json);
        	}
        }
		return baseConf;
    }
};

Ext.m3.ObjectGrid = Ext.extend(Ext.m3.GridPanel,
    Ext.applyIf(baseObjectGrid, {
        initComponent: function(){
            this.configureObjectGrid();
            Ext.m3.ObjectGrid.superclass.initComponent.call(this);
            this.initObjectGrid();
        }
    })
);

Ext.m3.EditorObjectGrid = Ext.extend(Ext.m3.EditorGridPanel,
    Ext.applyIf(baseObjectGrid, {
        initComponent: function(){
            this.configureObjectGrid();
            Ext.m3.EditorObjectGrid.superclass.initComponent.call(this);
            this.initObjectGrid();
        }
    })
);

Ext.reg('m3-object-grid', Ext.m3.ObjectGrid);
Ext.reg('m3-edit-object-grid', Ext.m3.EditorObjectGrid);