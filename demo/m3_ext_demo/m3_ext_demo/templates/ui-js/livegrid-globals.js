String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}

Ext.ns('Ext.ux.grid');
Ext.ux.grid.MultiGrouping = function(config) {
	if (config) Ext.apply(this, config);
}
/**
 * Плагин для LiveGrid, работающий с группировкой столбцов
 */
Ext.extend(Ext.ux.grid.MultiGrouping, Ext.util.Observable, {
    title:'Порядок:',
	/**
     * Развернутые элементы верхнего уровня.
     * Элемент представляет собой объект вида:
     * {index: 0, id: 0, count: 0, expandedItems:[]}
     * где	index - порядковый номер развернутого элемента во всем раскрытом дереве/гриде
     * 		id - идентификатор развернутого элемента
     * 		count - количество дочерних элементов, включая все развернутые элементы нижних уровней
     * 		expandedItems - развернутые элементы аналогичной структуры внутри текущего элемента
     */
	expandedItems: [],
	/**
	 * Перечень колонок, по которым производится группировка.
	 * Если пусто, то нет группировки.
	 */
	groupedColums: [],
	/**
     * Инициализация плагина
     *
     * @param {Ext.grid.GridPanel} grid Собственно грид
     */
	init: function(grid) {
        if(grid instanceof Ext.grid.GridPanel){
            this.grid = grid;
            this.cm = this.grid.getColumnModel();
            // добавим новый столбец, в котором будет отображаться группировка (если она будет)
            this.grouppingColumn = new Ext.grid.Column({header: "Группировка", id:"groupping", width:160, renderer: {fn:this.groupRenderer, scope: this}});
            var cmConfig = [this.grouppingColumn].concat(this.cm.config); 
            this.cm.setConfig(cmConfig);            
            this.grouppingColumn.hidden=!(this.groupedColums.length>0);

            // повесимся на клик, чтобы раскрывать/скрывать уровни группировки
            this.grid.on('click', this.onNodeClick, this);
            // повесимся на событие загрузки данных в грид, чтобы проставить им свои характеристики
            // событие 'load' сработает только один раз при начальной загрузке
            this.grid.view.on('buffer', this.onLoadData, this);
            this.grid.store.on('load', this.onLoad, this);
            // повесимся на момент загрузки данных, чтобы передавать текущие параметры загрузки
            this.grid.view.on('beforebuffer', this.onBeforeBuffer, this);
            this.grid.store.on('beforeload', this.onBeforeLoad, this);
            this.grid.grouper = this;

            grid.on('afterrender',this.onRender,this);

            var reorderer = new Ext.ux.ToolbarReorderer({
                owner:this,
                createItemDD: function(button) {
                    if (button.dd != undefined) {
                        return;
                    }
                    
                    var el   = button.getEl(),
                        id   = el.id,
                        tbar = this.target,
                        me   = this;
                    
                    button.dd = new Ext.dd.DD(el, undefined, {
                        isTarget: true
                    });
                    
                    //if a button has a menu, it is disabled while dragging with this function
                    var menuDisabler = function() {
                        return false;
                    };
                    
                    Ext.apply(button.dd, {
                        owner:this,
                        b4StartDrag: function() {       
                            this.startPosition = el.getXY();
                            
                            //bump up the z index of the button being dragged but keep a reference to the original
                            this.startZIndex = el.getStyle('zIndex');
                            el.setStyle('zIndex', 1000000);
                            
                            button.suspendEvents();
                            if (button.menu) {
                                button.menu.on('beforeshow', menuDisabler, me);
                            }

                        },
                        
                        startDrag: function() {
                            this.constrainTo(tbar.getEl());
                            tbar_height = tbar.getHeight();
                            this.setYConstraint(tbar_height,tbar_height,tbar_height);

                        },
                        
                        onDrag: function(e) {
                            //calculate the button's index within the toolbar and its current midpoint
                            var buttonX  = el.getXY()[0],
                                deltaX   = buttonX - this.startPosition[0],
                                items    = tbar.items.items,
                                oldIndex = items.indexOf(button),
                                newIndex;


                            //find which item in the toolbar the midpoint is currently over
                            for (var index = 0; index < items.length; index++) {
                                var item = items[index];
                                
                                if (item.reorderable && item.id != button.id) {
                                    //find the midpoint of the button
                                    var box        = item.getEl().getBox(),
                                        midpoint   = (me.buttonXCache[item.id] || box.x) + (box.width / 2),
                                        movedLeft  = oldIndex > index && deltaX < 0 && buttonX < midpoint,
                                        movedRight = oldIndex < index && deltaX > 0 && (buttonX + el.getWidth()) > midpoint;
                                    
                                    if (movedLeft || movedRight) {
                                        me[movedLeft ? 'onMovedLeft' : 'onMovedRight'](button, index, oldIndex);
                                        break;
                                    }                        
                                }
                            }
                        },
                        
                        /**
                         * After the drag has been completed, make sure the button being dragged makes it back to
                         * the correct location and resets its z index
                         */
                        endDrag: function() {
                            //we need to update the cache here for cases where the button was dragged but its
                            //position in the toolbar did not change
                            me.updateButtonXCache();

                            tbar_box = tbar.getEl().getBox();
                            el_y = el.getY();
                            if (el_y<tbar_box.y | el_y>tbar_box.y + tbar_box.height){
                                this.owner.owner.deleteGroupingButton(button);
                            }
                            else{
                            
                            el.moveTo(me.buttonXCache[button.id], el.getY(), {
                                duration: me.animationDuration,
                                scope   : this,
                                callback: function() {
                                    button.resumeEvents();
                                    if (button.menu) {
                                        button.menu.un('beforeshow', menuDisabler, me);
                                    }
                                    
                                    tbar.fireEvent('reordered', button, tbar);
                                }
                            });
                            
                            el.setStyle('zIndex', this.startZIndex);
                        }
                        }
                    });
                },
                
                onMovedLeft: function(item, newIndex, oldIndex) {
                    var tbar  = this.target,
                        items = tbar.items.items;
                    
                    if (newIndex != undefined && newIndex != oldIndex) {
                        //move the button currently under drag to its new location
                        tbar.remove(item, false);
                        tbar.insert(newIndex, item);
                        
                        //set the correct x location of each item in the toolbar
                        this.updateButtonXCache();
                        for (var index = 0; index < items.length; index++) {
                            var obj  = items[index],
                                newX = this.buttonXCache[obj.id];
                            
                            if (item == obj) {
                                item.dd.startPosition[0] = newX;
                            } else {
                                var el = obj.getEl();
                                
                                el.moveTo(newX, el.getY(), {duration: this.animationDuration});
                            }
                        }
                    }
                },
                
                onMovedRight: function(item, newIndex, oldIndex) {
                    this.onMovedLeft.apply(this, arguments);
                }

            });
            this.droppable = new Ext.ux.ToolbarDroppable({
                /**
                 * Создание нового элемента по событию дропа на панель
                 */
                owner:this,
                /**
                 * переопределил функцию просчета позиции для новый элементов
                 * иначе неправльно добавлялись кирилические столбцы
                 */
                calculateEntryIndex: function(e) {
                    return 2;
                },
                createItem: function(data) {
                    var column = this.getColumnFromDragDrop(data);
                    
                    return this.owner.createGroupingButton({
                        text    : column.header,
                        groupingData: {
                            field: column.dataIndex,
                        }
                    });
                },

                /**
                 * Переопределим метод для определения можно ли кидать колонку на тулбар
                 * @param {Object} data Данные объекта который дропают
                 * @return {Boolean} True если можно дропнуть
                 */
                canDrop: function(dragSource, ev, data) {
                    var group_columns = this.owner.getGroupColumns(),
                        column  = this.getColumnFromDragDrop(data);
                    
                    if (!column.groupable) return false


                    for (var i=0; i < group_columns.length; i++) {
                        if (group_columns[i] == column.dataIndex) return false;
                    }

                    return true;
                },
                
                afterLayout: function(){
                    this.owner.doGroup(this.owner.getGroupColumns())
                    //скрываем дефолтные курсоры перемещения столбцов
                    this.owner.grid.view.columnDrop.proxyTop.hide();
                    this.owner.grid.view.columnDrop.proxyBottom.hide();
                },

                /**
                 * Вспомогательная функция для поиска колонки которую дропнули
                 * @param {Object} data Данные
                 */
                getColumnFromDragDrop: function(data) {
                    var index    = data.header.cellIndex,
                        colModel = grid.colModel,
                        column   = colModel.getColumnById(colModel.getColumnId(index));
                    return column;
                }
            });
            this.tbar = new Ext.Toolbar({
                items  : [this.title, '-'],
                plugins: [reorderer, this.droppable],
                listeners: {
                    scope    : this,
                    reordered: this.changeGroupingOrder
                }
            });
        }
		//this.grid.doGroup = this.doGroup;
	},
	/**
     * Щелчок по гриду. Будем ловить раскрытие/закрытие групп
     *
     * @param {Ext.EventObject} e Параметры события
     */
	onNodeClick: function (e) {
		// будем обрабатывать только если включена группировка
		if (this.groupedColums.length > 0) {
			var target = e.getTarget();
			// найдем объект по которому щелкнули
			var obj = Ext.fly(target);
			var colInd = this.grid.view.findCellIndex(target);
			var rowInd = this.grid.view.findRowIndex(target);
			if (rowInd >= 0 && colInd !== false) {
				var col = this.grid.colModel.getColumnAt(colInd);
				if (this.grouppingColumn.id == col.id) {
					var row = this.grid.store.getAt(rowInd);
					// если это кнопки группировки, то переключим их
					if (row._expanded) {
						obj.removeClass('x-tree-elbow-minus');
				        obj.addClass('x-tree-elbow-plus');
				        this.collapseItem(rowInd);
					} else {
						obj.removeClass('x-tree-elbow-plus');
				        obj.addClass('x-tree-elbow-minus');
				        this.expandItem(rowInd);
					}
				}
			}
		}
	},
    getGroupColumns:function() {
        var columns = [];

        if (this.tbar)
            Ext.each(this.tbar.findByType('button'), function(button) {
                columns.push(button.groupingData.field);
            }, this);
        
        return columns;
    },
    changeGroupingOrder: function(button) {
    	this.doGroup(this.getGroupColumns());
    },

    createGroupingButton:function(config) {
        config = config || {};
        Ext.applyIf(config, {
            owner: this,
            listeners: {
                scope: this,
                click: function(button, e) {
                    //пустышка для обработки нажатия на кнопку
                }
            },
            reorderable: true
        });
        return new Ext.Button(config);
    },

    deleteGroupingButton:function(button){
        button.destroy();
        this.doGroup(this.getGroupColumns()) 
    },

    onRender: function(){
        this.grid.elements +=',tbar';
        this.grid.add(this.tbar);
        this.grid.doLayout();
        
        this.grid.enableDragDrop = true;

        var dragProxy = this.grid.getView().columnDrag,
            ddGroup   = dragProxy.ddGroup;
        this.droppable.addDDGroup(ddGroup);


    },
	/**
     * Отрисовщик колонки группировки.
     *
     * @param {Object} v Отображаемое значение
     * @param {Object} p Атрибуты колонки (css, attr...)
     * @param {Ext.data.record} record Отрисовываемая запись данных
     * @param {Number} rowIndex Индекс строки
     * @param {Number} colIndex Индекс колонки
     * @param {Ext.data.Store} st Набор данных
     */
	groupRenderer: function (v, p, record, rowIndex, colIndex, st) {
		p.css += ' x-tree-no-lines';
		var is_leaf = record.json.is_leaf;
		if (is_leaf) {
			var res = '';
		} else {
			var expanded = record._expanded;
			var indent = record.json.indent;
			var indent_str = "&#160;".repeat(indent*6);
			var column = this.groupedColums[indent];
			v = record.get(column);
			var col_name = column;//this.cm.getColumnById(column).field;
			var res = String.format('<b><span>{2}</span><span class="x-tree-elbow-{0}" style="margin-left:-4px;padding-left:18px;padding-top:3px;cursor:pointer"></span><span unselectable="on">{3}: {1}</span></b>',expanded ? 'minus':'plus', v, indent_str, col_name);
		}
		return res;
	},
	/**
	 * Успешная загрузка данных в буфер. Отправим ее на общую обработку
	 * 
	 * @param {Ext.ux.BufferedGridView} view
	 * @param {Ext.data.Store} store Набор данных
	 * @param {Number} rowIndex Индекс строки
	 * @param {Number} min
	 * @param {Number} totalLen Общий объем данных доступных для загрузки
	 * @param {Object} opts Параменты запроса данных
	 */
	onLoadData: function (view, st, rowIndex, min, totalLen, opts) {
		this.onLoad(st);
	},
	/**
	 * Первоначальная загрузка набора записей. Сделаем первичную обработку.
	 * 
	 * @param {Ext.data.Store} st Набор данных
	 */
	onLoad: function (st) {
		this.expanding = null;
		if (this.groupedColums.length > 0) {
			for (var i = st.bufferRange[0]; i <= st.bufferRange[1]; i++) {
				//var record = st.data.itemAt(i);
				var record = st.getAt(i);
				if (record != null) {
					//record._expanded = this.isExpanded(i);
					record._expanded = record.json.expanded;
				}
	        }
		}
	},
	/**
	 * Перед загрузкой выставим параметры загрузки
	 * 
	 * @param {Ext.ux.BufferedGridView} view
	 * @param {Ext.data.Store} store Набор данных
	 * @param {Number} rowIndex Индекс строки
	 * @param {Number} min
	 * @param {Number} totalLen Общий объем данных доступных для загрузки
	 * @param {Object} opts Параменты запроса данных
	 */
	onBeforeBuffer: function (view, st, rowIndex, min, totalLen, opts) {
		this.onBeforeLoad(st, opts);
	},
	onBeforeLoad: function (st, opts) {
		var expanding = this.expanding;
		var exp_par = Ext.util.JSON.encode(this.expandedItems);
		var group_par = Ext.util.JSON.encode(this.groupedColums);
		opts.params.expanding = expanding;
		opts.params.exp = exp_par;
		opts.params.grouped = group_par;
	},
	/**
	 * Проверка раскрытия строки по индексу
	 * 
	 * @param {Number} rowIndex номер записи
	 */
//	isExpanded: function (rowIndex) {
//		for (var i = 0, len = this.expandedItems.length; i < len; i++) {
//        	var exp = this.expandedItems[i];
//        	if (exp.index == rowIndex){
//        		return true;
//        	}
//        }
//		return false;
//	},
	/**
	 * Поиск набора раскрытых элементов по ключевым значениям
	 * 
	 * @param {Array} keys массив ключевых значений в порядке сгруппированных полей
	 */
	findExpandedItem: function(keys) {
		var expItems = this.expandedItems;
		for (var i = 0, len = keys.length; i < len; i++) {
			var key = keys[i];
			for (var j = 0, explen = expItems.length; j < explen; j++) {
				var item = expItems[j];
				if (item.id == key){
					expItems = item.expandedItems;
					break;
				}
			}
		}
		return expItems;
	},
	/**
	 * Раскрытие элемента с перечитыванием данных
	 * 
	 * @param {Number} rowIndex номер записи
	 */
	expandItem: function (rowIndex) {
		if (this.groupedColums.length > 0) {
			var row = this.grid.store.getAt(rowIndex);
			if (!row._expanded) {
		        row._expanded = true;
		        var obj = {index: row.json.lindex, id: row.data['id'], count: -1, expandedItems:[]};
		        // нужно также учесть уровень, на котором располагается элемент
		        var level = row.json.indent;
		        // сформируем набор ключевых значений, чтобы узнать родительский раскрытый узел
		        var keys = [];
		        for (var i = 0; i < level; i++){
		        	var col = this.groupedColums[i];
		        	var key = row.get(col);
		        	keys.push(key);
		        }
		        // теперь найдем развернутый элемент уровеня на котором нужно вставить раскрытый элемент
		        var expItems = this.findExpandedItem(keys);
		        var added = false;
		        // необходимо найти место для вставки новой записи о раскрытии
		        for (var i = 0, len = expItems.length; i < len; i++) {
		        	var ei = expItems[i];
		        	if (ei.index > row.json.lindex) {
		        		// вставить перед ei и прекратить
		        		if (i > 0) {
		        			var new_gc = expItems.splice(i);
		        			expItems.push(obj);
		        			for (var k = 0, klen = new_gc.length;k < klen;k++){
		        				expItems.push(new_gc[k]);
		        			}
		        		} else {
		        			expItems.unshift(obj);
		        		}
		        		added = true;
		        		break;
		        	}
		        }
		        if (!added) {
		        	expItems.push(obj);
		        }
		        this.expanding = rowIndex;
				// перезагрузка грида
				this.grid.view.updateLiveRows(rowIndex,true,true);
				//this.grid.view.reset(true);
			}
		}
	},
	/**
	 * Сворачивание элемента с перечитыванием данных
	 * 
	 * @param {Number} rowIndex номер записи
	 */
	collapseItem: function (rowIndex) {
		if (this.groupedColums.length > 0) {
			var row = this.grid.store.getAt(rowIndex);
			if (row._expanded) {
		        row._expanded = false;
		        // нужно также учесть уровень, на котором располагается элемент
		        var level = row.json.indent;
		        // сформируем набор ключевых значений, чтобы узнать родительский раскрытый узел
		        var keys = [];
		        for (var i = 0; i < level; i++){
		        	var col = this.groupedColums[i];
		        	var key = row.get(col);
		        	keys.push(key);
		        }
		        // теперь найдем развернутый элемент уровеня на котором нужно ужалить раскрытый элемент
		        var expItems = this.findExpandedItem(keys);
		        for (var i = 0, len = expItems.length; i < len; i++) {
		        	var exp = expItems[i];
		        	if (exp.index == row.json.lindex){
		        		expItems.splice(i,1);
		        		// перезагрузим грид
		        		this.grid.view.updateLiveRows(rowIndex,true,true);
		        		//this.grid.view.reset(true);
		        		break;
		        	}
		        }
			}
		}
	},
	/**
	 * Установка группировочных колонок
	 * 
	 * @param {Array} columns Список колонок для группировки
	 */
    doGroup: function (columns) {
        this.grouppingColumn.hidden= !(columns.length > 0)
        this.expandedItems = [];
        this.groupedColums = columns;
        this.grid.view.reset(true);
    }
})

var myView = new Ext.ux.grid.livegrid.GridView({
        nearLimit : 100, // количество соседних загружаемых элементов при буферизации
        loadMask  : {
            msg :  'Загрузка, подождите...'
        }
    });

var toolbar = new Ext.ux.grid.livegrid.Toolbar({
    view        : myView,
    displayInfo : true
});
	
function doGroup () {
	livegrid.grouper.doGroup(['F1','F2','F3']);
}
function doUnGroup () {
	livegrid.grouper.doGroup([]);
}
var group = new Ext.Toolbar.Button({
    text : 'Группировать!',
    handler : doGroup
});
toolbar.addButton(group);
var unGroup = new Ext.Toolbar.Button({
    text : 'Разгруппировать',
    handler : doUnGroup
});
toolbar.addButton(unGroup);

var livegrid = new Ext.ux.grid.livegrid.GridPanel({
    enableDragDrop : false,
    cm             : new Ext.grid.ColumnModel([
        //new Ext.grid.RowNumberer({header : '#', width: 50 }),
        {header: "Номер", align : 'left',   width: 60, sortable: false, dataIndex: 'index', groupable:false},
        {header: "ИД", align : 'left',   width: 160, sortable: true, dataIndex: 'id', groupable:false},
        {header: "F1", align : 'left',   width: 160, sortable: true, dataIndex: 'F1', groupable:true},
        {header: "F2",   align : 'left',  width: 160, sortable: true, dataIndex: 'F2', groupable:true},
        {header: "F3",   align : 'left',  width: 160, sortable: true, dataIndex: 'F3', groupable:true},
        {header: "Value",   align : 'right',  width: 160, sortable: true, dataIndex: 'value'}
    ]),
    loadMask       : {
        msg : 'Загрузка...'
    },
    //title      : 'Большая таблица',
    height     : 400,
    stripeRows : true,
    width      : 600,
    store      : new Ext.ux.grid.livegrid.Store({
        autoLoad : true,
        url      : '/ui/livegrid-data',
        bufferSize : 200, // размер буфера
        reader     : new Ext.ux.grid.livegrid.JsonReader({
            root            : 'data',
            versionProperty : 'version',
            totalProperty   : 'totalCount',
            id              : 'index'
          }, [ {name : 'index', sortType : 'int'},
               {name : 'id', sortType : 'int'},
               {name : 'F1', sortType : 'string'},
               {name : 'F2', sortType : 'string'},
               {name : 'F3', sortType : 'string'},
               {name : 'value'}
             ])
    	,  sortInfo   : {field: 'index', direction: 'ASC'}
    }),
    selModel : new Ext.ux.grid.livegrid.RowSelectionModel({singleSelect: true}),
    view     : myView,
    bbar     : toolbar,
    plugins: [new Ext.ux.grid.MultiGrouping()]
});

win.items.add(livegrid);
