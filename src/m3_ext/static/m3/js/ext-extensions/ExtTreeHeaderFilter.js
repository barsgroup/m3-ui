Ext.ux.tree.TreeHeaderFilters = Ext.extend(Ext.util.Observable, {
/**
	 * @cfg {Number} fieldHeight
	 * Height for each filter field used by <code>autoHeight</code>.
	 */
	fieldHeight: 22,
	
	/**
	 * @cfg {Number} padding
	 * Padding for filter fields. Default: 2
	 */
	fieldPadding: 1,
	
	/**
	 * @cfg {Boolean} highlightOnFilter
	 * Enable grid header highlight if active filters 
	 */
	highlightOnFilter: true,
	
	/**
	 * @cfg {String} highlightColor
	 * Color for highlighted grid header
	 */
	highlightColor: 'yellow',
	
	/**
	 * @cfg {String} highlightCls
	 * Class to apply to filter header when filters are highlighted. If specified overrides highlightColor.
	 * See <code>highlightOnFilter</code>. 
	 */
	highlightCls: null,
	
	/**
	 * @cfg {Boolean} stateful
	 * Enable or disable filters save and restore through enabled Ext.state.Provider
	 */
	stateful: true,
	
	/**
	 * @cfg {String} applyMode
	 * Sets how filters are applied. If equals to "auto" (default) the filter is applyed when filter field value changes (change, select, ENTER).
	 * If set to "enter" the filters are applied only when user push "ENTER" on filter field.<br> 
	 * See also <code>applyFilterEvent</code> in columnmodel filter configuration: if this option is specified in
	 * filter configuration, <code>applyMode</code> value will be ignored and filter will be applied on specified event.
	 * @since Ext.ux.grid.GridHeaderFilters 1.0.6
	 */
	applyMode: "auto",
	
	/**
	 * @cfg {Object} filters
	 * Initial values for filters (mapped with filters names). If this object is defined,
	 * its attributes values overrides the corresponding filter values loaded from grid status or <code>value</code> specified in column model filter configuration.<br>
	 * Values specified into column model configuration (filter <code>value</code> attribute) are ignored if this object is specified.<br>
	 * See <code>filtersInitMode</code> to understand how these values are mixed with values loaded from grid status.
	 * @since Ext.ux.grid.GridHeaderFilters 1.0.9
	 */
	filters: null,
	
	/**
	 * @cfg {String} filtersInitMode
	 * If <code>filters</code> config value is specified, this parameter defines how these values are used:
	 * <ul>
	 * <li><code>replace</code>: these values replace all values loaded from grid status (status is completely ignored)</li>
	 * <li><code>merge</code>: these values overrides values loaded from status with the same name. Other status values are keeped and used to init filters.</li>
	 * </ul>
	 * This parameter doesn't affect how filter <code>value</code> attribute is managed: it will be always ignored if <code>filters</code> object is specified.<br>
	 * Default = 'replace'
	 */
	filtersInitMode: 'replace',
	
	/**
	 * @cfg {Boolean} ensureFilteredVisible
	 * If true, forces hidden columns to be made visible if relative filter is set. Default = true.
	 */
	ensureFilteredVisible: true,
	
	cfgFilterInit: false,
	
	/**
	 * @cfg {Object} containerConfig
	 * Base configuration for filters container of each column. With this attribute you can override filters <code>Ext.Container</code> configuration.
	 */
	containerConfig: null,
	
	/**
	 * @cfg {Number} labelWidth
	 * Label width for filter containers Form layout. Default = 50.
	 */
	labelWidth: 50,
	
	fcc: null,
	
	filterFields: null,
	
	filterContainers: null,
	
	filterContainerCls: 'x-ghf-filter-container',
	
	//kirov - признак того что идет изменение размеров колонок
	inResizeProcess: false,
	
    constructor : function (config) {
        config = config || {};
        Ext.apply(this, config);
    },
    init: function(tree) {
        this.tree = tree;
        this.tree.on({
            scope: this,
            render: this.onRender,
            resize: this.onResize,
            //columnresize: this.onColResize,
            reconfigure: this.onReconfigure,
            beforedestroy: this.destroyFilters
        });
        //this.tree.on('headerclick', this.onHeaderClick, this);
        if(this.stateful)
		{
			this.tree.on("beforestatesave", this.saveFilters, this);
			this.tree.on("beforestaterestore", this.loadFilters, this);
		}
		//Column hide event managed
		this.tree.on("hiddenchange", this.onColHidden, this);
		this.tree.addEvents(
		/**
      * @event filterupdate
      * <b>Event enabled on the GridPanel</b>: fired when a filter is updated
      * @param {String} name Filter name
      * @param {Object} value Filter value
      * @param {Ext.form.Field} el Filter field
      */	
		'filterupdate');
		
		this.addEvents(
			/**
	      * @event render
	      * Fired when filters render on grid header is completed
	      * @param {Ext.ux.grid.GridHeaderFilters} this
	      */	
			{'render': true}
		);
		
		//Must ignore filter config value ?
		this.cfgFilterInit = Ext.isDefined(this.filters) && this.filters !== null;
		if(!this.filters)
			this.filters = {};
		
		//Configuring filters
		this.configure(this.tree.columns);
			
		Ext.ux.tree.TreeHeaderFilters.superclass.constructor.call(this);
		
		if(this.stateful)
		{
			if(!Ext.isArray(this.tree.stateEvents))
				this.tree.stateEvents = [];
			this.tree.stateEvents.push('filterupdate');
		}
		
		//Enable new tree methods
		Ext.apply(this.tree, {
			oldupdateColumnWidths: this.tree.updateColumnWidths,
			updateColumnWidths: this.updateColumnWidths.createDelegate(this),
			oldhandleHdDown: this.tree.handleHdDown,
			handleHdDown: this.handleHdDown.createDelegate(this),
			headerFilters: this,
			getHeaderFilter: function(sName){
				if(!this.headerFilters)
					return null;
				return this.headerFilters.filters[sName];	
			},
			setHeaderFilter: function(sName, sValue){
				if(!this.headerFilters)
					return;
				var fd = {};
				fd[sName] = sValue;
				this.setHeaderFilters(fd);
			},
			setHeaderFilters: function(obj, bReset, bReload)
			{
				if(!this.headerFilters)
					return;
				if(bReset)
					this.resetHeaderFilters(false);
				if(arguments.length < 3)
					var bReload = true;
				var bOne = false;
				for(var fn in obj)
				{
					if(this.headerFilters.filterFields[fn])
					{
						var el = this.headerFilters.filterFields[fn];
						this.headerFilters.setFieldValue(el,obj[fn]);
						this.headerFilters.applyFilter(el, false);
						bOne = true;
					}
				}
				if(bOne && bReload)
					this.headerFilters.storeReload();
			},
			getHeaderFilterField: function(fn)
			{
				if(!this.headerFilters)
					return;
				if(this.headerFilters.filterFields[fn])
					return this.headerFilters.filterFields[fn];
				else
					return null;
			},
			resetHeaderFilters: function(bReload)
			{
				if(!this.headerFilters)
					return;
				if(arguments.length == 0)
					var bReload = true; 
				for(var fn in this.headerFilters.filterFields)
				{
					var el = this.headerFilters.filterFields[fn];
					if(Ext.isFunction(el.clearValue))
					{
						el.clearValue();
					} 
					else 
					{
						this.headerFilters.setFieldValue(el, '');
					}
					this.headerFilters.applyFilter(el, false);
				}
				if(bReload)
					this.headerFilters.storeReload();
			},
			applyHeaderFilters: function(bReload)
			{
				if(arguments.length == 0)
					var bReload = true;
				this.headerFilters.applyFilters(bReload);
			}
		});
    },
    handleHdDown : function(e, t){
    	// если кликнули по фильтру, то не будем сортировать :)
    	var hd = e.getTarget('.x-tree-filter-container');
    	if (!hd) {
    		this.tree.oldhandleHdDown(e, t);
    	} else {
    		e.target.focus();
    	}
    },
    updateColumnWidths: function(){
    	// будем сбрасывать ширину полей фильтрации, чтобы потом восстановить их по-новому
    	var n = this.tree.columns.length;
		for(var i=0; i<n; i++) {
			var td = this.getHeaderCell(this.tree.columns[i].dataIndex);
			td = Ext.get(td);
			this.onColResize(i, 0);
		}
    	this.tree.oldupdateColumnWidths();
    	this.onResize();
    },
    /**
	 * @private
	 * Configures filters and containers starting from grid ColumnModel
	 * @param {Ext.grid.ColumnModel} cm The column model to use
	 */
	configure: function(cm)
	{
		/*Filters config*/
		var filteredColumns = [];
		for(var i = 0, cs = cm, len = cs.length; i<len; i++) {
            if(Ext.isObject(cs[i].filter) || Ext.isArray(cs[i].filter)) {
            	cs[i].id = cs[i].dataIndex;
            	filteredColumns.push(cs[i]);
            }
        }
		
		/*Building filters containers configs*/
		this.fcc = {};
		for (var i = 0; i < filteredColumns.length; i++) 
		{
			var co = filteredColumns[i];
			var fca = co.filter;
			if(!Ext.isArray(fca))
				fca = [fca];
			for(var ci = 0; ci < fca.length; ci++)
			{
				var fc = Ext.apply({
					filterName: ci > 0 ? co.dataIndex+ci : co.dataIndex
				},fca[ci]);
				Ext.apply(fc, {
					columnId: co.id,
					dataIndex: co.dataIndex,
					//hideLabel: Ext.isEmpty(fc.fieldLabel),
					hideLabel: true,
					anchor: '100%'
				});
				
				if(!this.cfgFilterInit && !Ext.isEmpty(fc.value))
				{
					this.filters[fc.filterName] = Ext.isFunction(fc.filterEncoder) ? fc.filterEncoder.call(this, fc.value) : fc.value;
				}
				delete fc.value;
				
				/*
				 * Se la configurazione del field di filtro specifica l'attributo applyFilterEvent, il filtro verrà applicato
				 * in corrispondenza di quest'evento specifico
				 */
				if(fc.applyFilterEvent)
				{
					fc.listeners = {scope: this};
					fc.listeners[fc.applyFilterEvent] = function(field){this.applyFilter(field);};
					delete fc.applyFilterEvent;
				}
				else
				{
					//applyMode: auto o enter
					if(this.applyMode === 'auto' || this.applyMode === 'change' || Ext.isEmpty(this.applyMode))
					{
						//Legacy mode and deprecated. Use applyMode = "enter" or applyFilterEvent
						// kirov - через листенеры удобно новые объекты делать, иначе через события
						if (fc.hasListener != undefined) {
							if (!fc.hasListener('change')) {
								fc.on('change',function(field)
									{
										var t = field.getXType();
										if((t=='combo' || t=='datefield' || t=='m3-select') && this.checkHasValue(field)) {
											//Предотвращает двойное обновление грида, проверка на наличие значения
											//дает возможность обновить грид если значение в фильтре отсутствует.
											return;
										}else{
											this.applyFilter(field);
										}
									}, this);
							}
							if (!fc.hasListener('specialkey')) {
								fc.on('specialkey',function(el,ev)
									{
										ev.stopPropagation();
										if(ev.getKey() == ev.ENTER) {
											this.focusedFilterName = el.filterName;
											//el.el.dom.blur(); // т.к. в М3 при нажатии ENTER уже будет change
										}
									}, this);
							}
							if (!fc.hasListener('select')) {
								fc.on('select',function(field){
									this.focusedFilterName = field.filterName;
									this.applyFilter(field);
								}, this);
							}
						} else {
							fc.listeners = 
							{
								change: function(field)
								{
                                    var t = field.getXType();
									if(t=='combo' || t=='datefield'){ //avoid refresh twice for combo select 
										return;
									}else{
                                        field.startValue = field.getValue(); //чтобы больше не срабатывало событие изменения
                                        this.applyFilter(field);
									}
								},
								specialkey: function(el,ev)
								{
                                    ev.stopPropagation();
									if(ev.getKey() == ev.TAB) {
										this.focusedFilterName = undefined;
									}
									if(ev.getKey() == ev.ENTER) {

										this.focusedFilterName = el.filterName;
										//el.el.dom.blur(); // т.к. в М3 при нажатии ENTER уже будет change
									}
								},
								select: function(field){
									this.focusedFilterName = field.filterName;
									this.applyFilter(field);
									},
								scope: this	
							};
						}
					}
					else if(this.applyMode === 'enter')
					{
						fc.listeners = 
						{
							specialkey: function(el,ev)
							{
								ev.stopPropagation();
								if(ev.getKey() == ev.ENTER) 
								{
									this.focusedFilterName = el.filterName;
									this.applyFilters();
								}
								if(ev.getKey() == ev.TAB) 
								{
									this.focusedFilterName = undefined;
								}
							},
							scope: this
						};
					}
				}
				
				//Looking for filter column index
				var containerCfg = this.fcc[fc.columnId];
				if(!containerCfg)
				{
					containerCfg = {
						cls: this.filterContainerCls,
						border: false,
						bodyBorder: false,
						bodyStyle: "background-color: transparent", //kirov - для нормального цвета
						//layout: 'vbox',
						//layoutConfig: {align: 'stretch', padding: this.padding},
						labelSeparator: '', 
						labelWidth: this.labelWidth,
						layout: 'hbox', // kirov - вместо form, чтобы фильтры располагались горизонтально
						style: {},
						items: []
					};
					if(this.containerConfig)
						Ext.apply(containerCfg, this.containerConfig);
					this.fcc[fc.columnId] = containerCfg;
				}
				// kirov - для hbox лучше использовать еще один контейнер
				var tempCont = {
					cls:'x-tree-filter-container',
					bodyStyle: "background-color: transparent",
					border: false,
					bodyBorder: false,
					layout: 'form',
					padding: 2,
					margins: '0 0 -4 0',
                    flex: 1,
                    items: [fc]
                };
				
				containerCfg.items.push(tempCont);
			}
		}
	},
	checkHasValue: function(field){
		var value = this.getFieldValue(field)
		return !(value === null || value === "" || value === undefined);
	},
    getHeaderCell: function(columnId){
    	var cols = this.tree.columns,
            colCount = cols.length,
            groups = this.tree.outerCt.query('colgroup'),
            groupCount = groups.length,
            c, g, i, j;
        for(i = 0, groups = this.tree.innerHd.query('td'), len = groups.length; i<len; i++) {
            c = Ext.fly(groups[i]);
            if(cols[i].dataIndex == columnId) {
                return c;
            }
        }
        return null;
    },
	renderFilterContainer: function(columnId, fcc)
	{
		if(!this.filterContainers)
			this.filterContainers = {};
		//Associated column index
		var ci;
		for(var i = 0, cs = this.tree.columns, len = cs.length; i<len; i++) {
            if (cs[i].dataIndex == columnId){
            	ci = cs[i].index; 
            }
        }
		//Header TD
		// var td = this.grid.getView().getHeaderCell(ci);
		var td = this.getHeaderCell(columnId); //this.tree.innerHd;
		td = Ext.get(td);
		//Patch for field text selection on Mozilla
		if(Ext.isGecko)
			td.dom.style.MozUserSelect = "text";
		td.dom.style.verticalAlign = 'top';
		//Render filter container
		fcc.width = td.getWidth() - 3;
		var fc = new Ext.Container(fcc);
		fc.render(td);
		//Container cache
		this.filterContainers[columnId] = fc;
		//Fields cache	
		var height = 0;
		if(!this.filterFields)
			this.filterFields = {};
		var fields = fc.findBy(function(cmp){return !Ext.isEmpty(cmp.filterName);});
		if(!Ext.isEmpty(fields))
		{
			for(var i=0;i<fields.length;i++)
			{
				var filterName = fields[i].filterName;
				/*if(this.filterFields[filterName])
				{
					//Ext.destroy(this.filterFields[filterName])
					delete this.filterFields[filterName];
				}*/
				this.filterFields[filterName] = fields[i];
				height += fields[i].getHeight();
			}
		}
		
		return fc;
	},

	setIsNotRendered: function(el){
        if(el.items){
            for(var subEl in el.items){
			    this.setIsNotRendered(el.items[subEl]);
		    }
        }else if(el.rendered){
            el.rendered = false;
        }
    },

	renderFilters: function()
	{
		if(!this.fcc)
			return;
		for(var cid in this.fcc)
		{
			if(Ext.isIE){
                this.setIsNotRendered(this.fcc[cid]);
            }
			this.renderFilterContainer(cid, this.fcc[cid]);
		}
		this.setFilters(this.filters);
		this.highlightFilters(this.isFiltered());
	},
	
	onRender: function()
	{
		if(this.isFiltered())
		{
			this.applyFilters(false);
		}
		this.renderFilters();
		this.fireEvent("render", this);
	},
	getFilterField: function(filterName)
	{
		return this.filterFields ? this.filterFields[filterName] : null;
	},
	
	/**
	 * Sets filter values by values specified into fo.
	 * @param {Object} fo Object with attributes filterName = value
	 * @param {Boolean} clear If current values must be cleared. Default = false
	 */
	setFilters: function(fo,clear)
	{
		this.filters = fo;
		
		if(this.filters && this.filterFields)
		{
			//Delete filters that doesn't match with any field
			for(var fn in this.filters)
			{
				if(!this.filterFields[fn])
					delete this.filters[fn];
			}
			
			for(var fn in this.filterFields)
			{
				var field = this.filterFields[fn];
				var value = this.filters[field.filterName];
				if(Ext.isEmpty(value))
				{
					if(clear)
						this.setFieldValue(field, '');
				}
				else
					this.setFieldValue(field, value);
			}
		}
	},
	
	onColResize: function(index, iWidth){
		if(!this.filterContainers)
			return;
		var colId = this.tree.columns[index].dataIndex; 
		var cnt = this.filterContainers[colId];
		if(cnt)
		{
			if(isNaN(iWidth))
				iWidth = 0;
			var filterW = (iWidth < 3) ? 0 : (iWidth - 3);
			cnt.setWidth(filterW);
			//Thanks to ob1
			cnt.doLayout(false,true);
		}
	},
	/**
	 * @private
	 * Resize filters containers on grid resize
	 * Thanks to dolittle
	 */
	onResize: function() 
	{
		this.inResizeProcess = true; // kirov - чтобы исключить повторный вызов
		var n = this.tree.columns.length;
		for(var i=0; i<n; i++) {
			//var td = this.grid.getView().getHeaderCell(i);
			var td = this.getHeaderCell(this.tree.columns[i].dataIndex);
			td = Ext.get(td);
			this.onColResize(i, td.getWidth());
		}
		this.inResizeProcess = false; // kirov
	},
	
	onColHidden: function(cm, index, bHidden){
		if(bHidden)
			return;
		//this.tree.columns[index].hidden = !bHidden;
        var colId = this.tree.columns[index].dataIndex; 
		//var cnt = this.filterContainers[colId];
		var cnt = this.getHeaderCell(colId);
		var cw = cnt.getWidth();
		this.onColResize(index, cw);
		this.tree.updateColumnWidths();
	},
	
	onReconfigure: function(grid, store, cm)
	{
		this.destroyFilters();
		this.configure(cm);
		this.renderFilters();
	},
	saveFilters: function(grid, status)
	{
		var vals = {};
		for(var name in this.filters)
		{
			vals[name] = this.filters[name];
		}
		if (status === null){
			// если переменная status не определенна, то нет возможности установить атрибут
			// падает ошибка
			status = new Object;
			status["gridHeaderFilters"] = vals;
		}else{
			status["gridHeaderFilters"] = vals;
		}
		return true;
	},
   
	loadFilters: function(grid, status)
	{
		var vals = status.gridHeaderFilters;
		if(vals)
		{
			if(this.cfgFilterInit)
			{					
				if(this.filtersInitMode === 'merge')
					Ext.apply(vals,this.filters);
			}
			else
				this.filters = vals;
		}
	},
	
	isFiltered: function()
	{
		for(var k in this.filters)
		{
			if(/*this.filterFields && this.filterFields[k] && */!Ext.isEmpty(this.filters[k]))
				return true;
		}
		return false;
	},
	
	highlightFilters: function(enable)
	{
		if(!this.highlightOnFilter)
			return;
		if(!this.filterContainers)
			return;
		if(!this.tree.mainHd)
			return;
			
		// var tr = this.grid.getView().mainHd.child('.x-grid3-hd-row');
		// if(!Ext.isEmpty(this.highlightCls))
		// {
			// if(enable)
				// tr.addClass(this.highlightCls);
			// else
				// tr.removeClass(this.highlightCls);
		// }
		// else
		// {
			// tr.setStyle('background-color',enable ? this.highlightColor : '');
		// }
		// for(var i=0; i < this.grid.getColumnModel().getColumnCount(); i++) 
		// {
			// var hc = Ext.get(this.grid.getView().getHeaderCell(i));
			// if(!Ext.isEmpty(this.highlightCls))
			// {
				// if(enable)
					// hc.addClass(this.highlightCls);
				// else
					// hc.removeClass(this.highlightCls);
			// }
			// else
			// {
				// hc.setStyle('background-color',enable ? this.highlightColor : 'transparent');
			// }
		// }
		var color = enable ? this.highlightColor : 'transparent';
		for(var fn in this.filterContainers)
		{
			var fc = this.filterContainers[fn];
			if(fc.rendered)
			{
				if(!Ext.isEmpty(this.highlightCls))
				{
					if(enable)
						fc.getEl().addClass(this.highlightCls);
					else
						fc.getEl().removeClass(this.highlightCls);
				}
				else
					fc.getEl().setStyle('backgroundColor',color);
			}
		}
	},
	
	getFieldValue: function(eField)
	{
		if(Ext.isFunction(eField.filterEncoder))
			return eField.filterEncoder.call(eField, eField.getValue());
		else
			return eField.getValue();
	},
	
	setFieldValue: function(eField, value)
	{
		if(Ext.isFunction(eField.filterDecoder))
			value = eField.filterDecoder.call(eField, value);
		eField.setValue(value);
	},
	
	applyFilter: function(el, bLoad)
	{
		if(arguments.length < 2)
			bLoad = true;
		if(!el)
			return;
			
		if(!el.isValid())
			return;
			
		//if(el.disabled && !Ext.isDefined(this.grid.store.baseParams[el.filterName]))
		//	return;
		
		var sValue = this.getFieldValue(el);
		
		if(el.disabled || Ext.isEmpty(sValue))
		{
			//delete this.grid.store.baseParams[el.filterName];
			delete this.filters[el.filterName];
		}
		else	
		{
			//this.grid.store.baseParams[el.filterName] = sValue;
			this.filters[el.filterName] = sValue;
			
			if(this.ensureFilteredVisible)
			{
				//Controllo che la colonna del filtro applicato sia visibile
				//var ci = this.grid.getColumnModel().getIndexById(el.columnId);
				//if((ci >= 0) && (this.grid.getColumnModel().isHidden(ci)))
				//		this.grid.getColumnModel().setHidden(ci, false);
			}
		}
		
		//Evidenza filtri se almeno uno attivo
		this.highlightFilters(this.isFiltered());
		
		this.tree.fireEvent("filterupdate",el.filterName,sValue,el);
		
		if(bLoad)
			this.storeReload();
	},
	
	applyFilters: function(bLoad)
	{
		if(arguments.length < 1)
			bLoad = true;
		for(var fn in this.filterFields)
		{
			this.applyFilter(this.filterFields[fn], false);
		}
		if(bLoad)
			this.storeReload();
	},
	
	storeReload: function()
	{
		// удалим сначала все фильтры
		for(var fn in this.filterFields)
		{
			// только для Ext.m3.ObjectTree
			if (this.tree.actionContextJson) {
				delete this.tree.actionContextJson[fn];
			}
		}
		// проставим заново
		// только для Ext.m3.ObjectTree
		this.tree.actionContextJson = Ext.applyIf(this.tree.actionContextJson || {}, this.filters);
		this.tree.refreshStore();
		//this.tree.getLoader().baseParams = Ext.applyIf(this.tree.getLoader().baseParams, this.filters);
		//this.tree.getLoader().load(this.tree.getRootNode());
		if (this.focusedFilterName) {
			this.getFilterField(this.focusedFilterName).focus();
		}
	},
	
	getFilterContainer: function(columnId)
	{
		return this.filterContainers ? this.filterContainers[columnId] : null; 
	},
	
	destroyFilters: function()
	{
		if(this.filterFields)
		{
			for(var ff in this.filterFields)
			{
				Ext.destroy(this.filterFields[ff]);
				delete this.filterFields[ff];
			}
		}
		
		if(this.filterContainers)
		{
			for(var ff in this.filterContainers)
			{
				Ext.destroy(this.filterContainers[ff]);
				delete this.filterContainers[ff];
			}
		}
		
	}
});

Ext.preg('treeheaderfilters', Ext.ux.tree.TreeHeaderFilters);