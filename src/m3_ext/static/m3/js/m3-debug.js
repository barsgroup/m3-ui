/*!
 * Ext JS Library 3.3.1
 * Copyright(c) 2006-2010 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.Reorderer
 * @extends Object
 * Generic base class for handling reordering of items. This base class must be extended to provide the
 * actual reordering functionality - the base class just sets up events and abstract logic functions.
 * It will fire events and set defaults, deferring the actual reordering to a doReorder implementation.
 * See Ext.ux.TabReorderer for an example.
 */
Ext.ux.Reorderer = Ext.extend(Object, {
    /**
     * @property defaults
     * @type Object
     * Object containing default values for plugin configuration details. These can be overridden when
     * constructing the plugin
     */
    defaults: {
        /**
         * @cfg animate
         * @type Boolean
         * If set to true, the rearranging of the toolbar items is animated
         */
        animate: true,
        
        /**
         * @cfg animationDuration
         * @type Number
         * The duration of the animation used to move other toolbar items out of the way
         */
        animationDuration: 0.2,
        
        /**
         * @cfg defaultReorderable
         * @type Boolean
         * True to make every toolbar draggable unless reorderable is specifically set to false.
         * This defaults to false
         */
        defaultReorderable: false
    },
    
    /**
     * Creates the plugin instance, applies defaults
     * @constructor
     * @param {Object} config Optional config object
     */
    constructor: function(config) {
        Ext.apply(this, config || {}, this.defaults);
    },
    
    /**
     * Initializes the plugin, stores a reference to the target 
     * @param {Mixed} target The target component which contains the reorderable items
     */
    init: function(target) {
        /**
         * @property target
         * @type Ext.Component
         * Reference to the target component which contains the reorderable items
         */
        this.target = target;
        
        this.initEvents();
        
        var items  = this.getItems(),
            length = items.length,
            i;
        
        for (i = 0; i < length; i++) {
            this.createIfReorderable(items[i]);
        }
    },
    
    /**
     * Reorders the items in the target component according to the given mapping object. Example:
     * this.reorder({
     *     1: 5,
     *     3: 2
     * });
     * Would move the item at index 1 to index 5, and the item at index 3 to index 2
     * @param {Object} mappings Object containing current item index as key and new index as property
     */
    reorder: function(mappings) {
        var target = this.target;
        
        if (target.fireEvent('before-reorder', mappings, target, this) !== false) {
            this.doReorder(mappings);
            
            target.fireEvent('reorder', mappings, target, this);
        }
    },
    
    /**
     * Abstract function to perform the actual reordering. This MUST be overridden in a subclass
     * @param {Object} mappings Mappings of the old item indexes to new item indexes
     */
    doReorder: function(paramName) {
        throw new Error("doReorder must be implemented in the Ext.ux.Reorderer subclass");
    },
    
    /**
     * Should create and return an Ext.dd.DD for the given item. This MUST be overridden in a subclass
     * @param {Mixed} item The item to create a DD for. This could be a TabPanel tab, a Toolbar button, etc
     * @return {Ext.dd.DD} The DD for the given item
     */
    createItemDD: function(item) {
        throw new Error("createItemDD must be implemented in the Ext.ux.Reorderer subclass");
    },
    
    /**
     * Sets up the given Toolbar item as a draggable
     * @param {Mixed} button The item to make draggable (usually an Ext.Button instance)
     */
    createItemDD: function(button) {
        var el   = button.getEl(),
            id   = el.id,
            tbar = this.target,
            me   = this;
        
        button.dd = new Ext.dd.DD(el, undefined, {
            isTarget: false
        });
        
        button.dd.constrainTo(tbar.getEl());
        button.dd.setYConstraint(0, 0, 0);
        
        Ext.apply(button.dd, {
            b4StartDrag: function() {       
                this.startPosition = el.getXY();
                
                //bump up the z index of the button being dragged but keep a reference to the original
                this.startZIndex = el.getStyle('zIndex');
                el.setStyle('zIndex', 10000);
                
                button.suspendEvents();
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
                
                el.moveTo(me.buttonXCache[button.id], undefined, {
                    duration: me.animationDuration,
                    scope   : this,
                    callback: function() {
                        button.resumeEvents();
                        
                        tbar.fireEvent('reordered', button, tbar);
                    }
                });
                
                el.setStyle('zIndex', this.startZIndex);
            }
        });
    },
    
    /**
     * @private
     * Creates a DD instance for a given item if it is reorderable
     * @param {Mixed} item The item
     */
    createIfReorderable: function(item) {
        if (this.defaultReorderable && item.reorderable == undefined) {
            item.reorderable = true;
        }
        
        if (item.reorderable && !item.dd) {
            if (item.rendered) {
                this.createItemDD(item);                
            } else {
                item.on('render', this.createItemDD.createDelegate(this, [item]), this, {single: true});
            }
        }
    },
    
    /**
     * Returns an array of items which will be made draggable. This defaults to the contents of this.target.items,
     * but can be overridden - e.g. for TabPanels
     * @return {Array} The array of items which will be made draggable
     */
    getItems: function() {
        return this.target.items.items;
    },
    
    /**
     * Adds before-reorder and reorder events to the target component
     */
    initEvents: function() {
        this.target.addEvents(
          /**
           * @event before-reorder
           * Fires before a reorder occurs. Return false to cancel
           * @param {Object} mappings Mappings of the old item indexes to new item indexes
           * @param {Mixed} component The target component
           * @param {Ext.ux.TabReorderer} this The plugin instance
           */
          'before-reorder',
          
          /**
           * @event reorder
           * Fires after a reorder has occured.
           * @param {Object} mappings Mappings of the old item indexes to the new item indexes
           * @param {Mixed} component The target component
           * @param {Ext.ux.TabReorderer} this The plugin instance
           */
          'reorder'
        );
    }
});

/**
 * @class Ext.ux.HBoxReorderer
 * @extends Ext.ux.Reorderer
 * Description
 */
Ext.ux.HBoxReorderer = Ext.extend(Ext.ux.Reorderer, {
    /**
     * Initializes the plugin, decorates the container with additional functionality
     */
    init: function(container) {
        /**
         * This is used to store the correct x value of each button in the array. We need to use this
         * instead of the button's reported x co-ordinate because the buttons are animated when they move -
         * if another onDrag is fired while the button is still moving, the comparison x value will be incorrect
         */
        this.buttonXCache = {};
        
        container.on({
            scope: this,
            add  : function(container, item) {
                this.createIfReorderable(item);
            }
        });
        
        //super sets a reference to the toolbar in this.target
        Ext.ux.HBoxReorderer.superclass.init.apply(this, arguments);
    },
    
    /**
     * Sets up the given Toolbar item as a draggable
     * @param {Mixed} button The item to make draggable (usually an Ext.Button instance)
     */
    createItemDD: function(button) {
        if (button.dd != undefined) {
            return;
        }
        
        var el   = button.getEl(),
            id   = el.id,
            me   = this,
            tbar = me.target;
        
        button.dd = new Ext.dd.DD(el, undefined, {
            isTarget: false
        });
        
        el.applyStyles({
            position: 'absolute'
        });
        
        //if a button has a menu, it is disabled while dragging with this function
        var menuDisabler = function() {
            return false;
        };
        
        Ext.apply(button.dd, {
            b4StartDrag: function() {       
                this.startPosition = el.getXY();
                
                //bump up the z index of the button being dragged but keep a reference to the original
                this.startZIndex = el.getStyle('zIndex');
                el.setStyle('zIndex', 10000);
                
                button.suspendEvents();
                if (button.menu) {
                    button.menu.on('beforeshow', menuDisabler, me);
                }
            },
            
            startDrag: function() {
                this.constrainTo(tbar.getEl());
                this.setYConstraint(0, 0, 0);
            },
            
            onDrag: function(e) {
                //calculate the button's index within the toolbar and its current midpoint
                var buttonX  = el.getXY()[0],
                    deltaX   = buttonX - this.startPosition[0],
                    items    = tbar.items.items,
                    length   = items.length,
                    oldIndex = items.indexOf(button),
                    newIndex, index, item;
                
                //find which item in the toolbar the midpoint is currently over
                for (index = 0; index < length; index++) {
                    item = items[index];
                    
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
        });
    },
    
    onMovedLeft: function(item, newIndex, oldIndex) {
        var tbar   = this.target,
            items  = tbar.items.items,
            length = items.length,
            index;
        
        if (newIndex != undefined && newIndex != oldIndex) {
            //move the button currently under drag to its new location
            tbar.remove(item, false);
            tbar.insert(newIndex, item);
            
            //set the correct x location of each item in the toolbar
            this.updateButtonXCache();
            for (index = 0; index < length; index++) {
                var obj  = items[index],
                    newX = this.buttonXCache[obj.id];
                
                if (item == obj) {
                    item.dd.startPosition[0] = newX;
                } else {
                    var el = obj.getEl();
                    
                    el.moveTo(newX, el.getY(), {
                        duration: this.animationDuration
                    });
                }
            }
        }
    },
    
    onMovedRight: function(item, newIndex, oldIndex) {
        this.onMovedLeft.apply(this, arguments);
    },
    
    /**
     * @private
     * Updates the internal cache of button X locations. 
     */
    updateButtonXCache: function() {
        var tbar   = this.target,
            items  = tbar.items,
            totalX = tbar.getEl().getBox(true).x;
            
        items.each(function(item) {
            this.buttonXCache[item.id] = totalX;

            totalX += item.getEl().getWidth();
        }, this);
    }
});
// Create the namespace
Ext.ns('Ext.ux.plugins.grid');

/**
 * Ext.ux.plugins.grid.CellToolTips plugin for Ext.grid.GridPanel
 *
 * A GridPanel plugin that enables the creation of record based,
 * per-column tooltips that can also be dynamically loaded via Ajax
 * calls.
 *
 * Requires Animal's triggerElement override when using ExtJS 2.x
 * (from <a href="http://extjs.com/forum/showthread.php?p=265259#post265259">http://extjs.com/forum/showthread.php?p=265259#post265259</a>)
 * In ExtJS 3.0 this feature is arealy in the standard.
 *
 * Starting from version 1.1, CellToolTips also supports dynamic
 * loading of tooltips via Ajax. Just specify the 'url' parameter
 * in the respective column configuration for the CellToolTips,
 * and the data for the tooltip will be loaded from there. By
 * default, the record data for the current row will be passed
 * to the request.
 *
 * If you want to supply different parameters, you can specify a
 * function with the 'fn' parameter. This function gets the data
 * object for the current row record. The object it returns will
 * be used as the Ajax paremeters.
 *
 * An example configuration:
 * <pre><code>
	var tts = new Ext.ux.plugins.grid.CellToolTips([
		{
			// 'Standard' CellToolTip, the current row record is applied
			// to the template.
			field: 'company',
			tpl:   '<b>Company: {company}</b><br />This is a local column tooltip'
		},
		{
			// Simple Ajax CellToolTip, an Ajax request is dispatched with the
			// current row record as its parameters, and after adding the property
			// "ADDITIONAL" to the return data it is applied to the template.
			field: 'price', 
			tpl: '<b>Company: {company}</b><br /><hr />Description: {description}<br /><hr />Price: {price} $<br />Change: {pctChange}%<br />{ADDITIONAL}', 
			url: 'json_ajaxtip1.php',
			afterFn: function(data) { return Ext.apply({ ADDITIONAL: 'Test' }, data; }
		},
		{
			// Advanced Ajax CellToolTip, the current row record is passed to the
			// function in 'fn', its return values are passed to an Ajax call and
			// the Ajax return data is applied to the template.
			field: 'change', 
			tpl: '<b>Company: {company}</b><br /><hr />Description: {description}<br /><hr />Price: {price} $<br />Change: {pctChange}%', 
			fn: function(parms) {
				parms.price = parms.price * 100;
				return Ext.apply({},parms);
			},
			url: '/json_ajaxtip2.php'
		}
	]);
	
	var grid = new Ext.grid.GridPanel({
		... normal config ...
		,plugins:	[ tts ]
		// Optional: filter which rows should have a tooltip:
		,CellToolTipCondition: function( row, rec ) {
			// don't show a tooltip for the first row or if
			// the record has a property 'secret' set to true
			if( row == 0 || rec.get('secret') == true ) {
				return false;
			}
		}
   </code></pre>
 *
 * A complete example can be found <a href="http://www.chrwinter.de/ext3/CellToolTips.html">here</a>.
 *
 * @author  BitPoet
 * @date    July 08, 2009
 * @version 1.3
 *
 * @class Ext.ux.plugins.grid.CellToolTips
 * @extends Ext.util.Observable
 */
Ext.ux.plugins.grid.CellToolTips = function(config) {
    var cfgTips;
    if( Ext.isArray(config) ) {
        cfgTips = config;
        config = {};
    } else {
    	cfgTips = config.ajaxTips;
    }
    Ext.ux.plugins.grid.CellToolTips.superclass.constructor.call(this, config);
    if( config.tipConfig ) {
    	this.tipConfig = config.tipConfig;
    }
    this.ajaxTips = cfgTips;
} // End of constructor

// plugin code
Ext.extend( Ext.ux.plugins.grid.CellToolTips, Ext.util.Observable, {
    version: 1.3,
    /**
     * Temp storage from the config object
     *
     * @private
     */
    ajaxTips: false,
    
    /**
     * Tooltip Templates indexed by column id
     *
     * @private
     */
    tipTpls: false,

    /**
     * Tooltip data filter function for setting base parameters
     *
     * @private
     */
    tipFns: false,
    
    /**
     * URLs for ajax backend
     *
     * @private
     */
    tipUrls: '',
    
    /**
     * Tooltip configuration items
     *
     * @private
     */
    tipConfig: {},

    /**
     * Loading action
     *
     * @private
     */
    request: false,

    /**
     * Plugin initialization routine
     *
     * @param {Ext.grid.GridPanel} grid
     */
    init: function(grid) {
        if( ! this.ajaxTips ) {
            return;
        }
        this.tipTpls = {};
        this.tipFns  = {};
      	this.tipAfterFns = {};
        this.tipUrls = {};
        // Generate tooltip templates
        Ext.each( this.ajaxTips, function(tip) {
        	this.tipTpls[tip.field] = new Ext.XTemplate( tip.tpl );
        	if( tip.url ) {
        		this.tipUrls[tip.field] = tip.url;
        	}
       		if( tip.fn )
       			this.tipFns[tip.field] = tip.fn;
       		if( tip.afterFn )
       			this.tipAfterFns[tip.field] = tip.afterFn;
       		if (tip.tipConfig)
			this.tipConfig = tip.tipConfig;

        }, this);
        // delete now superfluous config entry for ajaxTips
        delete( this.ajaxTips );
        grid.on( 'render', this.onGridRender.createDelegate(this) );
    } // End of function init

    /**
     * Set/Add a template for a column
     *
     * @param {String} fld
     * @param {String | Ext.XTemplate} tpl
     */
    ,setFieldTpl: function(fld, tpl) {
        this.tipTpls[fld] = Ext.isObject(tpl) ? tpl : new Ext.XTemplate(tpl);
    } // End of function setFieldTpl

    /**
     * Set up the tooltip when the grid is rendered
     *
     * @private
     * @param {Ext.grid.GridPanel} grid
     */
    ,onGridRender: function(grid) 
    {
        if( ! this.tipTpls ) {
            return;
        }
        // Create one new tooltip for the whole grid
        Ext.apply(this.tipConfig, {
            target:      grid.getView().mainBody,
            delegate:    '.x-grid3-cell-inner',
            renderTo:    document.body,
            finished:	 false
        });
        Ext.applyIf(this.tipConfig, {
            
            //prefer M: В ie с запятой не будет работать. 
            // monkey pathcing mode true
            //trackMouse:  true,
            trackMouse:  true
    	});

        this.tip = new Ext.ToolTip( this.tipConfig );
        this.tip.ctt = this;
        // Hook onto the beforeshow event to update the tooltip content
        this.tip.on('beforeshow', this.beforeTipShow.createDelegate(this.tip, [this, grid], true));
        this.tip.on('hide', this.hideTip);
    } // End of function onGridRender

    /**
     * Replace the tooltip body by applying current row data to the template
     *
     * @private
     * @param {Ext.ToolTip} tip
     * @param {Ext.ux.plugins.grid.CellToolTips} ctt
     * @param {Ext.grid.GridPanel} grid
     */
    ,beforeTipShow: function(tip, ctt, grid) {
	// Get column id and check if a tip is defined for it
	var colIdx = grid.getView().findCellIndex( tip.triggerElement );
	var tipId = grid.getColumnModel().getDataIndex( colIdx );
       	if( ! ctt.tipTpls[tipId] )
       	    return false;
    	if( ! tip.finished ) {
	       	var isAjaxTip = (typeof ctt.tipUrls[tipId] == 'string');
        	// Fetch the rows record from the store and apply the template
        	var rowNum = grid.getView().findRowIndex( tip.triggerElement );
        	var cellRec = grid.getStore().getAt( rowNum );
	        if( grid.CellToolTipCondition && grid.CellToolTipCondition(rowNum, cellRec) === false ) {
        	    return false;
        	}
        	// create a copy of the record and use its data, otherwise we might
        	// accidentially modify the original record's values
        	var data = cellRec.copy().data;
        	if( isAjaxTip ) {
        		ctt.loadDetails((ctt.tipFns[tipId]) ? ctt.tipFns[tipId](data) : data, tip, grid, ctt, tipId);
        		tip.body.dom.innerHTML = 'Loading...';
        	} else {
			tip.body.dom.innerHTML = ctt.tipTpls[tipId].apply( (ctt.tipFns[tipId]) ? ctt.tipFns[tipId](cellRec.data) : cellRec.data );
		}       		
        } else {
        	tip.body.dom.innerHTML = tip.ctt.tipTpls[tipId].apply( tip.tipdata );
        }
    } // End of function beforeTipShow
    
    /**
     * Fired when the tooltip is hidden, resets the finished handler.
     *
     * @private
     * @param {Ext.ToolTip} tip
     */
    ,hideTip: function(tip) {
    	tip.finished = false;
    }
    
    /**
     * Loads the data to apply to the tip template via Ajax
     *
     * @private
     * @param {object} data Parameters for the Ajax request
     * @param {Ext.ToolTip} tip The tooltip object
     * @param {Ext.grid.GridPanel} grid The grid
     * @param {Ext.ux.plugins.grid.CellToolTips} ctt The CellToolTips object
     * @param {String} tipid Id of the tooltip (= field name)
     */
    ,loadDetails: function(data, tip, grid, ctt, tipid) {
    	Ext.Ajax.request({
    		url:	ctt.tipUrls[tipid],
    		params:	data,
    		method: 'POST',
    		success:	function(resp, opt) {
    			tip.finished = true;
    			tip.tipdata  = Ext.decode(resp.responseText);
    			if( ctt.tipAfterFns[tipid] ) {
    				tip.tipdata = ctt.tipAfterFns[tipid](tip.tipdata);
    			}
    			tip.show();
    		}
    	});
    }

}); // End of extend

Ext.namespace("Ext.ux.grid");

/**
 * @class Ext.ux.grid.GridHeaderFilters
 * @extends Ext.util.Observable
 * 
 * Plugin that enables filters in columns headers.
 * 
 * To add a grid header filter, put the "filter" attribute in column configuration of the grid column model.
 * This attribute is the configuration of the Ext.form.Field to use as filter in the header or an array of fields configurations.<br>
 * <br>
 * The filter configuration object can include some special attributes to manage filter configuration:
 * <ul>
 * <li><code>filterName</code>: to specify the name of the filter and the corresponding HTTP parameter used to send filter value to server. 
 * If not specified column "dataIndex" attribute will be used, if more than one filter is configured for the same column, the filterName will be the "dataIndex" followed by filter index (if index &gt; 0)</li>
 * <li><code>value</code>: to specify default value for filter. If no value is provided for filter (in <code>filters</code> plugin configuration parameter or from loaded status), 
 * this value will be used as default filter value</li>
 * <li><code>filterEncoder</code>: a function used to convert filter value returned by filter field "getValue" method to a string. Useful if the filter field getValue() method
 * returns an object that is not a string</li>
 * <li><code>filterDecoder</code>: a function used to convert a string to a valid filter field value. Useful if the filter field setValue(obj) method
 * 						needs an object that is not a string</li>
 * <li><code>applyFilterEvent</code></li>: a string that specifies the event that starts filter application for this filter field. If not specified, the "applyMode" is used. (since 1.0.10)</li>
 *	</ul>
 * <br>
 * Filter fields are rendered in the header cells within an <code>Ext.Panel</code> with <code>layout='form'</code>.<br>
 * For each filter you can specify <code>fieldLabel</code> or other values supported by this layout type.<br>
 * You can also override panel configuration using <code>containerConfig</code> attribute.<br>
 * <br>
 * This plugin enables some new grid methods:
 * <ul>
 * <li>getHeaderFilter(name)</li>
 * <li>getHeaderFilterField(name)</li> 
 * <li>setHeaderFilter(name, value)</li> 
 * <li>setHeaderFilters(object, [bReset], [bReload])</li>
 * <li>resetHeaderFilters([bReload])</li>
 * <li>applyHeaderFilters([bReload])</li>
 * </ul>
 * The "name" is the filterName (see filterName in each filter configuration)
 * 
 * @author Damiano Zucconi - http://www.isipc.it
 * @version 2.0.6 - 03/03/2011
 */
Ext.ux.grid.GridHeaderFilters = function(cfg){if(cfg) Ext.apply(this, cfg);};
	
Ext.extend(Ext.ux.grid.GridHeaderFilters, Ext.util.Observable, 
{
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
	
	init:function(grid) 
	{
		this.grid = grid;
		var gv = this.grid.getView();
		gv.updateHeaders = gv.updateHeaders.createSequence(function(){
			this.renderFilters.call(this);
		},this).createInterceptor(function(){
			// kirov - непонятно, зачем уничтожать фильтры если потом они рендерятся. иначе у нас не работают произвольные контролы в заголовке
			//this.destroyFilters.call(this);
			return true;
		},this);
		this.grid.on({
			scope: this,
			render: this.onRender,
			resize: this.onResize,
			columnresize: this.onColResize,
			reconfigure: this.onReconfigure,
			beforedestroy: this.destroyFilters
		});
		//this.grid.on("columnmove", this.renderFilters, this);
		if(this.stateful)
		{
			this.grid.on("beforestatesave", this.saveFilters, this);
			this.grid.on("beforestaterestore", this.loadFilters, this);
		}
		
		//Column hide event managed
		this.grid.getColumnModel().on("hiddenchange", this.onColHidden, this);
		
		this.grid.addEvents(
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
		this.configure(this.grid.getColumnModel());
			
		Ext.ux.grid.GridHeaderFilters.superclass.constructor.call(this);
		
		if(this.stateful)
		{
			if(!Ext.isArray(this.grid.stateEvents))
				this.grid.stateEvents = [];
			this.grid.stateEvents.push('filterupdate');
		}
		
		//Enable new grid methods
		Ext.apply(this.grid, {
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
	
	/**
	 * @private
	 * Configures filters and containers starting from grid ColumnModel
	 * @param {Ext.grid.ColumnModel} cm The column model to use
	 */
	configure: function(cm)
	{
		/*Filters config*/
		var filteredColumns = cm.getColumnsBy(function(cc){
			if(Ext.isObject(cc.filter) || Ext.isArray(cc.filter))
				return true;
			else
				return false;
		});
		
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
								fc.on('change', function(field)
									{
                                        var v = field.getValue(),
                                            t;

                                        if (String(field.startValue) !== String(v)) {
                                            t = field.getXType();
                                            if(t=='combo' || t=='datefield'){
                                                return;
                                            }else{
                                                this.applyFilter(field);
                                            }
                                        }

									}, this);
							}
							if (!fc.hasListener('specialkey')) {
								fc.on('specialkey',function(el,ev)
									{
										ev.stopPropagation();
										if(ev.getKey() == ev.ENTER) {
											this.focusedFilterName = el.filterName;
											el.el.dom.blur();
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
                                    var v = field.getValue(),
                                        t;

                                    if (String(field.startValue) !== String(v)) {
                                        t = field.getXType();
                                        if(t=='combo' || t=='datefield'){
                                            return;
                                        }else{
                                            this.applyFilter(field);
                                        }
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
	
	renderFilterContainer: function(columnId, fcc)
	{
		if(!this.filterContainers)
			this.filterContainers = {};
		//Associated column index
		var ci = this.grid.getColumnModel().getIndexById(columnId);
		//Header TD
		var td = this.grid.getView().getHeaderCell(ci);
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
	
	renderFilters: function()
	{
		if(!this.fcc)
			return;
		for(var cid in this.fcc)
		{
			this.renderFilterContainer(cid, this.fcc[cid]);
		}
		this.setFilters(this.filters);
		this.highlightFilters(this.isFiltered());
		if (this.focusedFilterName) {
			this.getFilterField(this.focusedFilterName).focus();
		}
	},
	
	onRender: function()
	{
		if(this.isFiltered())
		{
			this.applyFilters(false);
		}
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
		// kirov - пошлем событие изменения размера всего грида, если колонки растянуты по ширине
		if (!this.inResizeProcess) {
			if (this.grid.viewConfig && this.grid.viewConfig.forceFit) {
				this.onResize();
				return;
			}
		}
		var colId = this.grid.getColumnModel().getColumnId(index);
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
		var n = this.grid.getColumnModel().getColumnCount();
		for(var i=0; i<n; i++) {
			var td = this.grid.getView().getHeaderCell(i);
			td = Ext.get(td);
			this.onColResize(i, td.getWidth());
		}
		this.inResizeProcess = false; // kirov
	},
	
	onColHidden: function(cm, index, bHidden){
		if(bHidden)
			return;
		var cw = this.grid.getColumnModel().getColumnWidth(index);
		this.onColResize(index, cw);
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
		status["gridHeaderFilters"] = vals;
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
		if(!this.grid.getView().mainHd)
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
			
		if(el.disabled && !Ext.isDefined(this.grid.store.baseParams[el.filterName]))
			return;
		
		var sValue = this.getFieldValue(el);
		
		if(el.disabled || Ext.isEmpty(sValue))
		{
			delete this.grid.store.baseParams[el.filterName];
			delete this.filters[el.filterName];
		}
		else	
		{
			this.grid.store.baseParams[el.filterName] = sValue;
			this.filters[el.filterName] = sValue;
			
			if(this.ensureFilteredVisible)
			{
				//Controllo che la colonna del filtro applicato sia visibile
				var ci = this.grid.getColumnModel().getIndexById(el.columnId);
				if((ci >= 0) && (this.grid.getColumnModel().isHidden(ci)))
						this.grid.getColumnModel().setHidden(ci, false);
			}
		}
		
		//Evidenza filtri se almeno uno attivo
		this.highlightFilters(this.isFiltered());
		
		this.grid.fireEvent("filterupdate",el.filterName,sValue,el);

        el.startValue = sValue;
        // Zakirov Ramil: beforeValue хранит значение после обновления фильтра,
        // для того чтобы не происходила повторная фильтрация при onBlur.
		
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
		if(!this.grid.store.lastOptions)
			return;
		var slp = {start: 0};
		if(this.grid.store.lastOptions.params && this.grid.store.lastOptions.params.limit)
			slp.limit = this.grid.store.lastOptions.params.limit;
		this.grid.store.load({params: slp});
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
Ext.ns('Ext.ux.grid');

Ext.ux.grid.LockingHeaderGroupGridView = Ext.extend(Ext.grid.GridView, {
    lockText : 'Lock',
    unlockText : 'Unlock',
    rowBorderWidth : 1,
    lockedBorderWidth : 1,

    /*
     * This option ensures that height between the rows is synchronized
     * between the locked and unlocked sides. This option only needs to be used
     * when the row heights aren't predictable.
     */
    syncHeights: false,

    initTemplates : function(){
        var ts = this.templates || {};

        if (!ts.master) {
            ts.master = new Ext.Template(
                '<div class="x-grid3" hidefocus="true">',
                    '<div class="x-grid3-locked">',
                        '<div class="x-grid3-header"><div class="x-grid3-header-inner"><div class="x-grid3-header-offset" style="{lstyle}">{lockedHeader}</div></div><div class="x-clear"></div></div>',
                        '<div class="x-grid3-scroller"><div class="x-grid3-body" style="{lstyle}">{lockedBody}</div><div class="x-grid3-scroll-spacer"></div></div>',
                    '</div>',
                    '<div class="x-grid3-viewport x-grid3-unlocked">',
                        '<div class="x-grid3-header"><div class="x-grid3-header-inner"><div class="x-grid3-header-offset" style="{ostyle}">{header}</div></div><div class="x-clear"></div></div>',
                        '<div class="x-grid3-scroller"><div class="x-grid3-body" style="{bstyle}">{body}</div><a href="#" class="x-grid3-focus" tabIndex="-1"></a></div>',
                    '</div>',
                    '<div class="x-grid3-resize-marker">&#160;</div>',
                    '<div class="x-grid3-resize-proxy">&#160;</div>',
                '</div>'
            );
        }
        //kirov
	    if(!ts.gcell){
            ts.gcell = new Ext.XTemplate('<td class="x-grid3-hd x-grid3-gcell x-grid3-td-{id} ux-grid-hd-group-row-{row} {cls}" style="{style}">', '<div {tooltip} class="x-grid3-hd-inner x-grid3-hd-{id}" unselectable="on" style="{istyle}">', this.grid.enableHdMenu ? '<a class="x-grid3-hd-btn" href="#"></a>' : '', '{value}</div></td>');
        }
        this.templates = ts;
        //kirov
	    this.hrowRe = new RegExp("ux-grid-hd-group-row-(\\d+)", "");
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.initTemplates.call(this);
    },

    getEditorParent : function(ed){
        return this.el.dom;
    },

    initElements : function(){
        var E  = Ext.Element,
            el = this.grid.getGridEl().dom.firstChild,
            cs = el.childNodes;

        this.el             = new E(el);
        this.lockedWrap     = new E(cs[0]);
        this.lockedHd       = new E(this.lockedWrap.dom.firstChild);
        this.lockedInnerHd  = this.lockedHd.dom.firstChild;
        this.lockedScroller = new E(this.lockedWrap.dom.childNodes[1]);
        this.lockedBody     = new E(this.lockedScroller.dom.firstChild);
        this.mainWrap       = new E(cs[1]);
        this.mainHd         = new E(this.mainWrap.dom.firstChild);

        if (this.grid.hideHeaders) {
            this.lockedHd.setDisplayed(false);
            this.mainHd.setDisplayed(false);
        }

        this.innerHd  = this.mainHd.dom.firstChild;
        this.scroller = new E(this.mainWrap.dom.childNodes[1]);

        if(this.forceFit){
            this.scroller.setStyle('overflow-x', 'hidden');
        }

        this.mainBody     = new E(this.scroller.dom.firstChild);
        this.focusEl      = new E(this.scroller.dom.childNodes[1]);
        this.resizeMarker = new E(cs[2]);
        this.resizeProxy  = new E(cs[3]);

        this.focusEl.swallowEvent('click', true);
    },

    getLockedRows : function(){
        return this.hasRows() ? this.lockedBody.dom.childNodes : [];
    },

    getLockedRow : function(row){
        return this.getLockedRows()[row];
    },

    getCell : function(row, col){
        var llen = this.cm.getLockedCount();
        if(col < llen){
            return this.getLockedRow(row).getElementsByTagName('td')[col];
        }
        return Ext.ux.grid.LockingHeaderGroupGridView.superclass.getCell.call(this, row, col - llen);
    },

    getHeaderCell : function(index){
        var llen = this.cm.getLockedCount();
        if(index < llen){
            return this.lockedHd.dom.getElementsByTagName('td')[index];
        }
        //kirov
        //return Ext.ux.grid.LockingHeaderGroupGridView.superclass.getHeaderCell.call(this, index - llen);
        return this.mainHd.query(this.cellSelector)[index-llen];
    },

    addRowClass : function(row, cls){
        var r = this.getLockedRow(row);
        if(r){
            this.fly(r).addClass(cls);
        }
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.addRowClass.call(this, row, cls);
    },

    removeRowClass : function(row, cls){
        var r = this.getLockedRow(row);
        if(r){
            this.fly(r).removeClass(cls);
        }
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.removeRowClass.call(this, row, cls);
    },

    removeRow : function(row) {
        Ext.removeNode(this.getLockedRow(row));
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.removeRow.call(this, row);
    },

    removeRows : function(firstRow, lastRow){
        var bd = this.lockedBody.dom;
        for(var rowIndex = firstRow; rowIndex <= lastRow; rowIndex++){
            Ext.removeNode(bd.childNodes[firstRow]);
        }
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.removeRows.call(this, firstRow, lastRow);
    },

    syncScroll : function(e){
        var mb = this.scroller.dom;
        this.lockedScroller.dom.scrollTop = mb.scrollTop;
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.syncScroll.call(this, e);
    },

    updateSortIcon : function(col, dir){
        var sc = this.sortClasses,
            lhds = this.lockedHd.select('td').removeClass(sc),
            hds = this.mainHd.select('td').removeClass(sc),
            llen = this.cm.getLockedCount(),
            cls = sc[dir == 'DESC' ? 1 : 0];
        if(col < llen){
            lhds.item(col).addClass(cls);
        }else{
            hds.item(col - llen).addClass(cls);
        }
    },

    updateAllColumnWidths : function(){
        var tw = this.getTotalWidth(),
            clen = this.cm.getColumnCount(),
            lw = this.getLockedWidth(),
            llen = this.cm.getLockedCount(),
            ws = [], len, i;
        this.updateLockedWidth();
        for(i = 0; i < clen; i++){
            ws[i] = this.getColumnWidth(i);
            var hd = this.getHeaderCell(i);
            hd.style.width = ws[i];
        }
        var lns = this.getLockedRows(), ns = this.getRows(), row, trow, j;
        for(i = 0, len = ns.length; i < len; i++){
            row = lns[i];
            row.style.width = lw;
            if(row.firstChild){
                row.firstChild.style.width = lw;
                trow = row.firstChild.rows[0];
                for (j = 0; j < llen; j++) {
                   trow.childNodes[j].style.width = ws[j];
                }
            }
            row = ns[i];
            row.style.width = tw;
            if(row.firstChild){
                row.firstChild.style.width = tw;
                trow = row.firstChild.rows[0];
                for (j = llen; j < clen; j++) {
                   trow.childNodes[j - llen].style.width = ws[j];
                }
            }
        }
        //kirov
        this.updateGroupStyles();
        this.onAllColumnWidthsUpdated(ws, tw);
        this.syncHeaderHeight();
    },
    //kirov
    onColumnWidthUpdated: function(){
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.onColumnWidthUpdated.call(this, arguments);
        this.updateGroupStyles.call(this);
    },
    //kirov
    onAllColumnWidthsUpdated: function(){
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.onAllColumnWidthsUpdated.call(this, arguments);
        this.updateGroupStyles.call(this);
    },
    //kirov
    //onColumnHiddenUpdated: function(){
    //    Ext.ux.grid.LockingHeaderGroupGridView.superclass.onColumnHiddenUpdated.call(this, arguments);
    //    this.updateGroupStyles.call(this);
    //},

    updateColumnWidth : function(col, width){
        var w = this.getColumnWidth(col),
            llen = this.cm.getLockedCount(),
            ns, rw, c, row;
        this.updateLockedWidth();
        if(col < llen){
            ns = this.getLockedRows();
            rw = this.getLockedWidth();
            c = col;
        }else{
            ns = this.getRows();
            rw = this.getTotalWidth();
            c = col - llen;
        }
        var hd = this.getHeaderCell(col);
        hd.style.width = w;
        for(var i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = rw;
            if(row.firstChild){
                row.firstChild.style.width = rw;
                row.firstChild.rows[0].childNodes[c].style.width = w;
            }
        }
        this.onColumnWidthUpdated(col, w, this.getTotalWidth());
        this.syncHeaderHeight();
    },

    updateColumnHidden : function(col, hidden){
        var llen = this.cm.getLockedCount(),
            ns, rw, c, row,
            display = hidden ? 'none' : '';
        this.updateLockedWidth();
        if(col < llen){
            ns = this.getLockedRows();
            rw = this.getLockedWidth();
            c = col;
        }else{
            ns = this.getRows();
            rw = this.getTotalWidth();
            c = col - llen;
        }
        var hd = this.getHeaderCell(col);
        hd.style.display = display;
        for(var i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = rw;
            if(row.firstChild){
                row.firstChild.style.width = rw;
                row.firstChild.rows[0].childNodes[c].style.display = display;
            }
        }
        this.onColumnHiddenUpdated(col, hidden, this.getTotalWidth());
        delete this.lastViewWidth;
        this.layout();
    },

    doRender : function(cs, rs, ds, startRow, colCount, stripe){
        var ts = this.templates, ct = ts.cell, rt = ts.row, last = colCount-1,
            tstyle = 'width:'+this.getTotalWidth()+';',
            lstyle = 'width:'+this.getLockedWidth()+';',
            buf = [], lbuf = [], cb, lcb, c, p = {}, rp = {}, r;
        for(var j = 0, len = rs.length; j < len; j++){
            r = rs[j]; cb = []; lcb = [];
            var rowIndex = (j+startRow);
            for(var i = 0; i < colCount; i++){
                c = cs[i];
                p.id = c.id;
                p.css = (i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '')) +
                    (this.cm.config[i].cellCls ? ' ' + this.cm.config[i].cellCls : '');
                p.attr = p.cellAttr = '';
                p.value = c.renderer(r.data[c.name], p, r, rowIndex, i, ds);
                p.style = c.style;
                if(Ext.isEmpty(p.value)){
                    p.value = '&#160;';
                }
                if(this.markDirty && r.dirty && Ext.isDefined(r.modified[c.name])){
                    p.css += ' x-grid3-dirty-cell';
                }
                if(c.locked){
                    lcb[lcb.length] = ct.apply(p);
                }else{
                    cb[cb.length] = ct.apply(p);
                }
            }
            var alt = [];
            if(stripe && ((rowIndex+1) % 2 === 0)){
                alt[0] = 'x-grid3-row-alt';
            }
            if(r.dirty){
                alt[1] = ' x-grid3-dirty-row';
            }
            rp.cols = colCount;
            if(this.getRowClass){
                alt[2] = this.getRowClass(r, rowIndex, rp, ds);
            }
            rp.alt = alt.join(' ');
            rp.cells = cb.join('');
            rp.tstyle = tstyle;
            buf[buf.length] = rt.apply(rp);
            rp.cells = lcb.join('');
            rp.tstyle = lstyle;
            lbuf[lbuf.length] = rt.apply(rp);
        }
        return [buf.join(''), lbuf.join('')];
    },
    processRows : function(startRow, skipStripe){
        if(!this.ds || this.ds.getCount() < 1){
            return;
        }
        var rows = this.getRows(),
            lrows = this.getLockedRows(),
            row, lrow;
        skipStripe = skipStripe || !this.grid.stripeRows;
        startRow = startRow || 0;
        for(var i = 0, len = rows.length; i < len; ++i){
            row = rows[i];
            lrow = lrows[i];
            row.rowIndex = i;
            lrow.rowIndex = i;
            if(!skipStripe){
                row.className = row.className.replace(this.rowClsRe, ' ');
                lrow.className = lrow.className.replace(this.rowClsRe, ' ');
                if ((i + 1) % 2 === 0){
                    row.className += ' x-grid3-row-alt';
                    lrow.className += ' x-grid3-row-alt';
                }
            }
            if(this.syncHeights){
                var el1 = Ext.get(row),
                    el2 = Ext.get(lrow),
                    h1 = el1.getHeight(),
                    h2 = el2.getHeight();

                if(h1 > h2){
                    el2.setHeight(h1);
                }else if(h2 > h1){
                    el1.setHeight(h2);
                }
            }
        }
        if(startRow === 0){
            Ext.fly(rows[0]).addClass(this.firstRowCls);
            Ext.fly(lrows[0]).addClass(this.firstRowCls);
        }
        Ext.fly(rows[rows.length - 1]).addClass(this.lastRowCls);
        Ext.fly(lrows[lrows.length - 1]).addClass(this.lastRowCls);
    },

    afterRender : function(){
        if(!this.ds || !this.cm){
            return;
        }
        var bd = this.renderRows() || ['&#160;', '&#160;'];
        this.mainBody.dom.innerHTML = bd[0];
        this.lockedBody.dom.innerHTML = bd[1];
        this.processRows(0, true);
        if(this.deferEmptyText !== true){
            this.applyEmptyText();
        }
    },

    renderUI : function(){
        var header = this.renderHeaders();
        var body = this.templates.body.apply({rows:'&#160;'});
        var html = this.templates.master.apply({
            body: body,
            header: header[0],
            ostyle: 'width:'+this.getOffsetWidth()+';',
            bstyle: 'width:'+this.getTotalWidth()+';',
            lockedBody: body,
            lockedHeader: header[1],
            lstyle: 'width:'+this.getLockedWidth()+';'
        });
        var g = this.grid;
        g.getGridEl().dom.innerHTML = html;
        this.initElements();
        Ext.fly(this.innerHd).on('click', this.handleHdDown, this);
        Ext.fly(this.lockedInnerHd).on('click', this.handleHdDown, this);
        this.mainHd.on({
            scope: this,
            mouseover: this.handleHdOver,
            mouseout: this.handleHdOut,
            mousemove: this.handleHdMove
        });
        this.lockedHd.on({
            scope: this,
            mouseover: this.handleHdOver,
            mouseout: this.handleHdOut,
            mousemove: this.handleHdMove
        });
        this.scroller.on('scroll', this.syncScroll,  this);
        if(g.enableColumnResize !== false){
            this.splitZone = new Ext.grid.GridView.SplitDragZone(g, this.mainHd.dom);
            this.splitZone.setOuterHandleElId(Ext.id(this.lockedHd.dom));
            this.splitZone.setOuterHandleElId(Ext.id(this.mainHd.dom));
        }
        if(g.enableColumnMove){
            this.columnDrag = new Ext.grid.GridView.ColumnDragZone(g, this.innerHd);
            this.columnDrag.setOuterHandleElId(Ext.id(this.lockedInnerHd));
            this.columnDrag.setOuterHandleElId(Ext.id(this.innerHd));
            this.columnDrop = new Ext.grid.HeaderDropZone(g, this.mainHd.dom);
        }
        if(g.enableHdMenu !== false){
            this.hmenu = new Ext.menu.Menu({id: g.id + '-hctx'});
            this.hmenu.add(
                {itemId: 'asc', text: this.sortAscText, cls: 'xg-hmenu-sort-asc'},
                {itemId: 'desc', text: this.sortDescText, cls: 'xg-hmenu-sort-desc'}
            );
            if(this.grid.enableColLock !== false){
                this.hmenu.add('-',
                    {itemId: 'lock', text: this.lockText, cls: 'xg-hmenu-lock'},
                    {itemId: 'unlock', text: this.unlockText, cls: 'xg-hmenu-unlock'}
                );
            }
            if(g.enableColumnHide !== false){
                this.colMenu = new Ext.menu.Menu({id:g.id + '-hcols-menu'});
                this.colMenu.on({
                    scope: this,
                    beforeshow: this.beforeColMenuShow,
                    itemclick: this.handleHdMenuClick
                });
                this.hmenu.add('-', {
                    itemId:'columns',
                    hideOnClick: false,
                    text: this.columnsText,
                    menu: this.colMenu,
                    iconCls: 'x-cols-icon'
                });
            }
            this.hmenu.on('itemclick', this.handleHdMenuClick, this);
        }
        if(g.trackMouseOver){
            this.mainBody.on({
                scope: this,
                mouseover: this.onRowOver,
                mouseout: this.onRowOut
            });
            this.lockedBody.on({
                scope: this,
                mouseover: this.onRowOver,
                mouseout: this.onRowOut
            });
        }

        if(g.enableDragDrop || g.enableDrag){
            this.dragZone = new Ext.grid.GridDragZone(g, {
                ddGroup : g.ddGroup || 'GridDD'
            });
        }
        this.updateHeaderSortState();
        //kirov
        //Ext.apply(this.columnDrop, this.columnDropConfig);
        //Ext.apply(this.splitZone, this.splitZoneConfig);
    },
    
    //kirov
    splitZoneConfig: {
        allowHeaderDrag: function(e){
            return !e.getTarget(null, null, true).hasClass('ux-grid-hd-group-cell');
        }
    },
    //kirov
    columnDropConfig: {
        getTargetFromEvent: function(e){
            var t = Ext.lib.Event.getTarget(e);
            return this.view.findHeaderCell(t);
        },

        positionIndicator: function(h, n, e){
            var data = this.getDragDropData.call(this, h, n, e);
            if(data === false){
                return false;
            }
            var px = data.px + this.proxyOffsets[0];
            this.proxyTop.setLeftTop(px, data.r.top + this.proxyOffsets[1]);
            this.proxyTop.show();
            this.proxyBottom.setLeftTop(px, data.r.bottom);
            this.proxyBottom.show();
            return data.pt;
        },

        onNodeDrop: function(n, dd, e, data){
            var h = data.header;
            if(h != n){
                var d = this.getDragDropData.call(this, h, n, e);
                if(d === false){
                    return false;
                }
                var cm = this.grid.colModel, right = d.oldIndex < d.newIndex, rows = cm.rows;
                for(var row = d.row, rlen = rows.length; row < rlen; row++){
                    var r = rows[row], len = r.length, fromIx = 0, span = 1, toIx = len;
                    for(var i = 0, gcol = 0; i < len; i++){
                        var group = r[i];
                        if(d.oldIndex >= gcol && d.oldIndex < gcol + group.colspan){
                            fromIx = i;
                        }
                        if(d.oldIndex + d.colspan - 1 >= gcol && d.oldIndex + d.colspan - 1 < gcol + group.colspan){
                            span = i - fromIx + 1;
                        }
                        if(d.newIndex >= gcol && d.newIndex < gcol + group.colspan){
                            toIx = i;
                        }
                        gcol += group.colspan;
                    }
                    var groups = r.splice(fromIx, span);
                    rows[row] = r.splice(0, toIx - (right ? span : 0)).concat(groups).concat(r);
                }
                for(var c = 0; c < d.colspan; c++){
                    var oldIx = d.oldIndex + (right ? 0 : c), newIx = d.newIndex + (right ? -1 : c);
                    cm.moveColumn(oldIx, newIx);
                    this.grid.fireEvent("columnmove", oldIx, newIx);
                }
                return true;
            }
            return false;
        }
    },
    //kirov
    updateGroupStyles: function(col){
        var tables = this.lockedHd.query('.x-grid3-header-offset > table'), tw = this.getLockedWidth(), rows = this.rows;
        var rowGroups = [];
        for(var row = 0; row < tables.length; row++){
            tables[row].style.width = tw;
            if(row < rows.length){
                var cells = tables[row].firstChild.firstChild.childNodes;
                rowGroups[row] = 0;
                for(var i = 0, gcol = 0; i < cells.length; i++){
                    var group = rows[row][i];
                    rowGroups[row] = rowGroups[row]+1;
                    if((typeof col != 'number') || (col >= gcol && col < gcol + group.colspan)){
                        var gs = this.getGroupStyle.call(this, group, gcol);
                        cells[i].style.width = gs.width;
                        cells[i].style.display = gs.hidden ? 'none' : '';
                    }
                    gcol += group.colspan;
                }
            }
        }
        var tables = this.mainHd.query('.x-grid3-header-offset > table'), tw = this.getTotalWidth(), rows = this.rows;
        for(var row = 0; row < tables.length; row++){
            tables[row].style.width = tw;
            if(row < rows.length){
                var cells = tables[row].firstChild.firstChild.childNodes;
                for(var i = 0, gcol = this.cm.getLockedCount(); i < cells.length; i++){
                    var group = rows[row][rowGroups[row]+i];
                    if((typeof col != 'number') || (col >= gcol && col < gcol + group.colspan)){
                        var gs = this.getGroupStyle.call(this, group, gcol);
                        cells[i].style.width = gs.width;
                        cells[i].style.display = gs.hidden ? 'none' : '';
                    }
                    gcol += group.colspan;
                }
            }
        }
    },
    //kirov
    getGroupRowIndex: function(el){
        if(el){
            var m = el.className.match(this.hrowRe);
            if(m && m[1]){
                return parseInt(m[1], 10);
            }
        }
        return this.cm.rows.length;
    },

    layout : function(){
        if(!this.mainBody){
            return;
        }
        var g = this.grid;
        var c = g.getGridEl();
        var csize = c.getSize(true);
        var vw = csize.width;
        if(!g.hideHeaders && (vw < 20 || csize.height < 20)){
            return;
        }
        this.syncHeaderHeight();
        if(g.autoHeight){
            this.scroller.dom.style.overflow = 'visible';
            this.lockedScroller.dom.style.overflow = 'visible';
            if(Ext.isWebKit){
                this.scroller.dom.style.position = 'static';
                this.lockedScroller.dom.style.position = 'static';
            }
        }else{
            this.el.setSize(csize.width, csize.height);
            var hdHeight = this.mainHd.getHeight();
            var vh = csize.height - (hdHeight);
        }
        this.updateLockedWidth();
        if(this.forceFit){
            if(this.lastViewWidth != vw){
                this.fitColumns(false, false);
                this.lastViewWidth = vw;
            }
        }else {
            this.autoExpand();
            this.syncHeaderScroll();
        }
        this.onLayout(vw, vh);
    },
    //kirov
    getGroupSpan: function(row, col){
        if(row < 0){
            return {
                col: 0,
                colspan: this.cm.getColumnCount()
            };
        }
        var r = this.cm.rows[row];
        if(r){
            for(var i = 0, gcol = 0, len = r.length; i < len; i++){
                var group = r[i];
                if(col >= gcol && col < gcol + group.colspan){
                    return {
                        col: gcol,
                        colspan: group.colspan
                    };
                }
                gcol += group.colspan;
            }
            return {
                col: gcol,
                colspan: 0
            };
        }
        return {
            col: col,
            colspan: 1
        };
    },

    getOffsetWidth : function() {
        return (this.cm.getTotalWidth() - this.cm.getTotalLockedWidth() + this.getScrollOffset()) + 'px';
    },

    renderHeaders : function(){
        var cm = this.cm,
            ts = this.templates,
            ct = ts.hcell,
            cb = [], lcb = [],
            p = {},
            len = cm.getColumnCount(),
            last = len - 1;
        for(var i = 0; i < len; i++){
            p.id = cm.getColumnId(i);
            p.value = cm.getColumnHeader(i) || '';
            p.style = this.getColumnStyle(i, true);
            p.tooltip = this.getColumnTooltip(i);
            p.css = (i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '')) +
                (cm.config[i].headerCls ? ' ' + cm.config[i].headerCls : '');
            if(cm.config[i].align == 'right'){
                p.istyle = 'padding-right:16px';
            } else {
                delete p.istyle;
            }
            if(cm.isLocked(i)){
                lcb[lcb.length] = ct.apply(p);
            }else{
                cb[cb.length] = ct.apply(p);
            }
        }
        //kirov
	    var ts = this.templates, headers0 = [], headers1 = [], cm = this.cm, rows = this.rows, tstyle = 'width:' + this.getTotalWidth() + ';';
        for(var row = 0, rlen = rows.length; row < rlen; row++){
            var r = rows[row], cells0 = [], cells1 = [];
            for(var i = 0, gcol = 0, len = r.length; i < len; i++){
                var group = r[i];
                group.colspan = group.colspan || 1;
                var id = this.getColumnId(group.dataIndex ? cm.findColumnIndex(group.dataIndex) : gcol), gs = this.getGroupStyle.call(this, group, gcol);
                var cell = ts.gcell.apply({
                    cls: 'ux-grid-hd-group-cell',
                    id: id,
                    row: row,
                    style: 'width:' + gs.width + ';' + (gs.hidden ? 'display:none;' : '') + (group.align ? 'text-align:' + group.align + ';' : ''),
                    tooltip: group.tooltip ? (Ext.QuickTips.isEnabled() ? 'ext:qtip' : 'title') + '="' + group.tooltip + '"' : '',
                    istyle: group.align == 'right' ? 'padding-right:16px' : '',
                    btn: this.grid.enableHdMenu && group.header,
                    value: group.header || '&nbsp;'
                });
                if (cm.isLocked(group.dataIndex ? cm.findColumnIndex(group.dataIndex) : gcol))
                    cells1[i] = cell;
                else
                    cells0[i] = cell;
                gcol += group.colspan;
            }
            headers0[row] = ts.header.apply({
                tstyle: tstyle,
                cells: cells0.join('')
            });
            headers1[row] = ts.header.apply({
                tstyle: tstyle,
                cells: cells1.join('')
            });
        }
        //kirov
        headers0.push(ts.header.apply({cells: cb.join(''), tstyle:'width:'+this.getTotalWidth()+';'}));
        headers1.push(ts.header.apply({cells: lcb.join(''), tstyle:'width:'+this.getLockedWidth()+';'}));
        return [headers0.join(''),headers1.join('')];
    },
    //kirov
    getGroupStyle: function(group, gcol){
        var width = 0, hidden = true;
        for(var i = gcol, len = gcol + group.colspan; i < len; i++){
            if(!this.cm.isHidden(i)){
                var cw = this.cm.getColumnWidth(i);
                if(typeof cw == 'number'){
                    width += cw;
                }
                hidden = false;
            }
        }
        return {
            width: (Ext.isBorderBox || (Ext.isWebKit && !Ext.isSafari2) ? width : Math.max(width - this.borderWidth, 0)) + 'px',
            hidden: hidden
        };
    },
    //kirov
    findHeaderCell: function(el){
        return el ? this.fly(el).findParent('td.x-grid3-hd', this.cellSelectorDepth) : false;
    },
    //kirov
    findHeaderIndex: function(el){
        var cell = this.findHeaderCell(el);
        return cell ? this.getCellIndex(cell) : false;
    },

    updateHeaders : function(){
        var hd = this.renderHeaders();
        this.innerHd.firstChild.innerHTML = hd[0];
        this.innerHd.firstChild.style.width = this.getOffsetWidth();
        this.innerHd.firstChild.firstChild.style.width = this.getTotalWidth();
        this.lockedInnerHd.firstChild.innerHTML = hd[1];
        var lw = this.getLockedWidth();
        this.lockedInnerHd.firstChild.style.width = lw;
        this.lockedInnerHd.firstChild.firstChild.style.width = lw;
    },

    getResolvedXY : function(resolved){
        if(!resolved){
            return null;
        }
        var c = resolved.cell, r = resolved.row;
        return c ? Ext.fly(c).getXY() : [this.scroller.getX(), Ext.fly(r).getY()];
    },

    syncFocusEl : function(row, col, hscroll){
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.syncFocusEl.call(this, row, col, col < this.cm.getLockedCount() ? false : hscroll);
    },

    ensureVisible : function(row, col, hscroll){
        return Ext.ux.grid.LockingHeaderGroupGridView.superclass.ensureVisible.call(this, row, col, col < this.cm.getLockedCount() ? false : hscroll);
    },

    insertRows : function(dm, firstRow, lastRow, isUpdate){
        var last = dm.getCount() - 1;
        if(!isUpdate && firstRow === 0 && lastRow >= last){
            this.refresh();
        }else{
            if(!isUpdate){
                this.fireEvent('beforerowsinserted', this, firstRow, lastRow);
            }
            var html = this.renderRows(firstRow, lastRow),
                before = this.getRow(firstRow);
            if(before){
                if(firstRow === 0){
                    this.removeRowClass(0, this.firstRowCls);
                }
                Ext.DomHelper.insertHtml('beforeBegin', before, html[0]);
                before = this.getLockedRow(firstRow);
                Ext.DomHelper.insertHtml('beforeBegin', before, html[1]);
            }else{
                this.removeRowClass(last - 1, this.lastRowCls);
                Ext.DomHelper.insertHtml('beforeEnd', this.mainBody.dom, html[0]);
                Ext.DomHelper.insertHtml('beforeEnd', this.lockedBody.dom, html[1]);
            }
            if(!isUpdate){
                this.fireEvent('rowsinserted', this, firstRow, lastRow);
                this.processRows(firstRow);
            }else if(firstRow === 0 || firstRow >= last){
                this.addRowClass(firstRow, firstRow === 0 ? this.firstRowCls : this.lastRowCls);
            }
        }
        this.syncFocusEl(firstRow);
    },

    getColumnStyle : function(col, isHeader){
        var style = !isHeader ? this.cm.config[col].cellStyle || this.cm.config[col].css || '' : this.cm.config[col].headerStyle || '';
        style += 'width:'+this.getColumnWidth(col)+';';
        if(this.cm.isHidden(col)){
            style += 'display:none;';
        }
        var align = this.cm.config[col].align;
        if(align){
            style += 'text-align:'+align+';';
        }
        return style;
    },

    getLockedWidth : function() {
        return this.cm.getTotalLockedWidth() + 'px';
    },

    getTotalWidth : function() {
        return (this.cm.getTotalWidth() - this.cm.getTotalLockedWidth()) + 'px';
    },

    getColumnData : function(){
        var cs = [], cm = this.cm, colCount = cm.getColumnCount();
        for(var i = 0; i < colCount; i++){
            var name = cm.getDataIndex(i);
            cs[i] = {
                name : (!Ext.isDefined(name) ? this.ds.fields.get(i).name : name),
                renderer : cm.getRenderer(i),
                id : cm.getColumnId(i),
                style : this.getColumnStyle(i),
                locked : cm.isLocked(i)
            };
        }
        return cs;
    },

    renderBody : function(){
        var markup = this.renderRows() || ['&#160;', '&#160;'];
        return [this.templates.body.apply({rows: markup[0]}), this.templates.body.apply({rows: markup[1]})];
    },

    refreshRow : function(record){
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.refreshRow.call(this, record);
        var index = Ext.isNumber(record) ? record : this.ds.indexOf(record);
        this.getLockedRow(index).rowIndex = index;
    },

    refresh : function(headersToo){
        this.fireEvent('beforerefresh', this);
        this.grid.stopEditing(true);
        var result = this.renderBody();
        this.mainBody.update(result[0]).setWidth(this.getTotalWidth());
        this.lockedBody.update(result[1]).setWidth(this.getLockedWidth());
        if(headersToo === true){
            this.updateHeaders();
            this.updateHeaderSortState();
        }
        this.processRows(0, true);
        this.layout();
        this.applyEmptyText();
        this.fireEvent('refresh', this);
    },

    onDenyColumnLock : function(){

    },

    initData : function(ds, cm){
        if(this.cm){
            this.cm.un('columnlockchange', this.onColumnLock, this);
        }
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.initData.call(this, ds, cm);
        if(this.cm){
            this.cm.on('columnlockchange', this.onColumnLock, this);
        }
    },

    onColumnLock : function(){
        this.refresh(true);
    },

    handleHdMenuClick : function(item){
        var index = this.hdCtxIndex,
            cm = this.cm,
            id = item.getItemId(),
            llen = cm.getLockedCount();
        switch(id){
            case 'lock':
                if(cm.getColumnCount(true) <= llen + 1){
                    this.onDenyColumnLock();
                    return;
                }
                cm.setLocked(index, true);
                if(llen != index){
                    cm.moveColumn(index, llen);
                    this.grid.fireEvent('columnmove', index, llen);
                }
            break;
            case 'unlock':
                if(llen - 1 != index){
                    cm.setLocked(index, false, true);
                    cm.moveColumn(index, llen - 1);
                    this.grid.fireEvent('columnmove', index, llen - 1);
                }else{
                    cm.setLocked(index, false);
                }
            break;
            default:
                return Ext.ux.grid.LockingHeaderGroupGridView.superclass.handleHdMenuClick.call(this, item);
        }
        return true;
    },

    handleHdDown : function(e, t){
        //kirov
        //Ext.ux.grid.LockingHeaderGroupGridView.superclass.handleHdDown.call(this, e, t);
        var el = Ext.get(t);
        if(el.hasClass('x-grid3-hd-btn')){
            e.stopEvent();
            var hd = this.findHeaderCell(t);
            Ext.fly(hd).addClass('x-grid3-hd-menu-open');
            var index = this.getCellIndex(hd);
            this.hdCtxIndex = index;
            var ms = this.hmenu.items, cm = this.cm;
            ms.get('asc').setDisabled(!cm.isSortable(index));
            ms.get('desc').setDisabled(!cm.isSortable(index));
            this.hmenu.on('hide', function(){
                Ext.fly(hd).removeClass('x-grid3-hd-menu-open');
            }, this, {
                single: true
            });
            this.hmenu.show(t, 'tl-bl?');
        }else if(el.hasClass('ux-grid-hd-group-cell') || Ext.fly(t).up('.ux-grid-hd-group-cell')){
            e.stopEvent();
        }

        if(this.grid.enableColLock !== false){
            if(Ext.fly(t).hasClass('x-grid3-hd-btn')){
                var hd = this.findHeaderCell(t),
                    index = this.getCellIndex(hd),
                    ms = this.hmenu.items, cm = this.cm;
                ms.get('lock').setDisabled(cm.isLocked(index));
                ms.get('unlock').setDisabled(!cm.isLocked(index));
            }
        }
    },
    //kirov
    handleHdOver: function(e, t){
        var hd = this.findHeaderCell(t);
        if(hd && !this.headersDisabled){
            this.activeHdRef = t;
            this.activeHdIndex = this.getCellIndex(hd);
            var fly = this.fly(hd);
            this.activeHdRegion = fly.getRegion();
            if(!(this.cm.isMenuDisabled(this.activeHdIndex) || fly.hasClass('ux-grid-hd-group-cell'))){
                fly.addClass('x-grid3-hd-over');
                this.activeHdBtn = fly.child('.x-grid3-hd-btn');
                if(this.activeHdBtn){
                    this.activeHdBtn.dom.style.height = (hd.firstChild.offsetHeight - 1) + 'px';
                }
            }
        }
    },
    //kirov
    handleHdOut: function(e, t){
        var hd = this.findHeaderCell(t);
        if(hd && (!Ext.isIE || !e.within(hd, true))){
            this.activeHdRef = null;
            this.fly(hd).removeClass('x-grid3-hd-over');
            hd.style.cursor = '';
        }
    },

    syncHeaderHeight: function(){
        this.innerHd.firstChild.firstChild.style.height = 'auto';
        this.lockedInnerHd.firstChild.firstChild.style.height = 'auto';
        var hd = this.innerHd.firstChild.firstChild.offsetHeight,
            lhd = this.lockedInnerHd.firstChild.firstChild.offsetHeight,
            height = (lhd > hd ? lhd : hd) + 'px';
        this.innerHd.firstChild.firstChild.style.height = height;
        this.lockedInnerHd.firstChild.firstChild.style.height = height;
    },

    updateLockedWidth: function(){
        var lw = this.cm.getTotalLockedWidth(),
            tw = this.cm.getTotalWidth() - lw,
            csize = this.grid.getGridEl().getSize(true),
            lp = Ext.isBorderBox ? 0 : this.lockedBorderWidth,
            rp = Ext.isBorderBox ? 0 : this.rowBorderWidth,
            vw = (csize.width - lw - lp - rp) + 'px',
            so = this.getScrollOffset();
        if(!this.grid.autoHeight){
            var vh = (csize.height - this.mainHd.getHeight()) + 'px';
            this.lockedScroller.dom.style.height = vh;
            this.scroller.dom.style.height = vh;
        }
        this.lockedWrap.dom.style.width = (lw + rp) + 'px';
        this.scroller.dom.style.width = vw;
        this.mainWrap.dom.style.left = (lw + lp + rp) + 'px';
        if(this.innerHd){
            this.lockedInnerHd.firstChild.style.width = lw + 'px';
            this.lockedInnerHd.firstChild.firstChild.style.width = lw + 'px';
            this.innerHd.style.width = vw;
            this.innerHd.firstChild.style.width = (tw + rp + so) + 'px';
            this.innerHd.firstChild.firstChild.style.width = tw + 'px';
        }
        if(this.mainBody){
            this.lockedBody.dom.style.width = (lw + rp) + 'px';
            this.mainBody.dom.style.width = (tw + rp) + 'px';
        }
    }
});

Ext.ux.grid.LockingGroupColumnModel = Ext.extend(Ext.grid.ColumnModel, {
    /**
     * Returns true if the given column index is currently locked
     * @param {Number} colIndex The column index
     * @return {Boolean} True if the column is locked
     */
    isLocked : function(colIndex){
        return this.config[colIndex].locked === true;
    },

    /**
     * Locks or unlocks a given column
     * @param {Number} colIndex The column index
     * @param {Boolean} value True to lock, false to unlock
     * @param {Boolean} suppressEvent Pass false to cause the columnlockchange event not to fire
     */
    setLocked : function(colIndex, value, suppressEvent){
        if (this.isLocked(colIndex) == value) {
            return;
        }
        this.config[colIndex].locked = value;
        if (!suppressEvent) {
            this.fireEvent('columnlockchange', this, colIndex, value);
        }
    },

    /**
     * Returns the total width of all locked columns
     * @return {Number} The width of all locked columns
     */
    getTotalLockedWidth : function(){
        var totalWidth = 0;
        for (var i = 0, len = this.config.length; i < len; i++) {
            if (this.isLocked(i) && !this.isHidden(i)) {
                totalWidth += this.getColumnWidth(i);
            }
        }

        return totalWidth;
    },

    /**
     * Returns the total number of locked columns
     * @return {Number} The number of locked columns
     */
    getLockedCount : function() {
        var len = this.config.length;

        for (var i = 0; i < len; i++) {
            if (!this.isLocked(i)) {
                return i;
            }
        }

        //if we get to this point all of the columns are locked so we return the total
        return len;
    },

    /**
     * Moves a column from one position to another
     * @param {Number} oldIndex The current column index
     * @param {Number} newIndex The destination column index
     */
    moveColumn : function(oldIndex, newIndex){
        var oldLocked = this.isLocked(oldIndex),
            newLocked = this.isLocked(newIndex);

        if (oldIndex < newIndex && oldLocked && !newLocked) {
            this.setLocked(oldIndex, false, true);
        } else if (oldIndex > newIndex && !oldLocked && newLocked) {
            this.setLocked(oldIndex, true, true);
        }

        Ext.ux.grid.LockingGroupColumnModel.superclass.moveColumn.apply(this, arguments);
    }
});

Ext.namespace('Ext.ux.Ribbon');

Ext.ux.Ribbon = Ext.extend(Ext.TabPanel, {

    titleId: null,

    constructor: function(config){
        this.titleId = new Array();

        Ext.apply(config, {
            baseCls: "x-plain ui-ribbon",
            margins: "0 0 0 0",
            // plugins: new Ext.ux.TabScrollerMenu({
            //     maxText: 15,
            //     pageSize: 5
            // }),
            //enableTabScroll: true,
            plain: true,
            border: false,
            deferredRender: false,
            layoutOnTabChange: true,
            title: '',
            //collapsible: true,
            activeTab: 0,
            listeners: {
                beforetabchange: function(tp, ntb, ctb){
                    tp.expand();
                },
                afterrender: {
                    scope: this,
                    fn: function(){
                        //this.expand();
                        //this.doLayout();
                        if (this.titleId.length > 0){
                            for (var key = 0; key < this.titleId.length; key++){
                                r = Ext.get(this.titleId[key].id);
                                if (r)
                                r.on('click', this.titleId[key].fn);
                            }
                        }
                    }
                }
            }
        });

        Ext.apply(this, Ext.apply(this.initialConfig, config));

        if (config.items){
            for (var i = 0; i < config.items.length; i++)
            this.initRibbon(config.items[i], i);
        }

        Ext.ux.Ribbon.superclass.constructor.apply(this, arguments);
        
    },

    initRibbon: function(item, index){
        var tbarr = new Array();
        for (var j = 0; j < item.ribbon.length; j++){
            // for (var i = 0; i < item.ribbon[j].items.length; i++){
            //                             if (item.ribbon[j].items[i].scale !== "small"){
            //                                 item.ribbon[j].items[i].text = String(item.ribbon[j].items[i].text).replace(/[ +]/gi, "<br/>");
            //                             }
            //                         }
            c = {
                xtype: "buttongroup",
                cls: "x-btn-group-ribbonstyle",
                defaults: {
                    scale: "small",
                    iconAlign: "left",
                    minWidth: 40
                },
                items: item.ribbon[j].items
            };

            title = item.ribbon[j].title || '';
            topTitle = item.ribbon[j].topTitle || false;
            onTitleClick = item.ribbon[j].onTitleClick || false;

            if (onTitleClick){
                titleId = 'ux-ribbon-' + Ext.id();
                title = '<span id="' + titleId + '" style="cursor:pointer;">' + title + '</span>';
                this.titleId.push({
                    id: titleId,
                    fn: onTitleClick
                });
            }
            if (title !== ''){
                if (!topTitle){
                    Ext.apply(c, {
                        footerCfg: {
                            cls: "x-btn-group-header x-unselectable",
                            tag: "span",
                            html: title
                        }
                    });
                } else{
                    Ext.apply(c, {
                        title: title
                    });
                }
            }

            cfg = item.ribbon[j].cfg || null;

            if (cfg){
                Ext.applyIf(c, item.ribbon[j].cfg);
                if (cfg.defaults)
                Ext.apply(c.defaults, cfg.defaults);
            }

            tbarr.push(c);
        }

        Ext.apply(item, {
            baseCls: "x-plain",
            tbar: tbarr
        });
    }
});
/*!
 * Ext JS Library 3.3.1
 * Copyright(c) 2006-2010 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.ToolbarDroppable
 * @extends Object
 * Plugin which allows items to be dropped onto a toolbar and be turned into new Toolbar items.
 * To use the plugin, you just need to provide a createItem implementation that takes the drop
 * data as an argument and returns an object that can be placed onto the toolbar. Example:
 * <pre>
 * new Ext.ux.ToolbarDroppable({
 *   createItem: function(data) {
 *     return new Ext.Button({text: data.text});
 *   }
 * });
 * </pre>
 * The afterLayout function can also be overridden, and is called after a new item has been 
 * created and inserted into the Toolbar. Use this for any logic that needs to be run after
 * the item has been created.
 */
Ext.ux.ToolbarDroppable = Ext.extend(Object, {
    /**
     * @constructor
     */
    constructor: function(config) {
      Ext.apply(this, config, {
          
      });
    },
    
    /**
     * Initializes the plugin and saves a reference to the toolbar
     * @param {Ext.Toolbar} toolbar The toolbar instance
     */
    init: function(toolbar) {
      /**
       * @property toolbar
       * @type Ext.Toolbar
       * The toolbar instance that this plugin is tied to
       */
      this.toolbar = toolbar;
      
      this.toolbar.on({
          scope : this,
          render: this.createDropTarget
      });
    },
    
    /**
     * Creates a drop target on the toolbar
     */
    createDropTarget: function() {
        /**
         * @property dropTarget
         * @type Ext.dd.DropTarget
         * The drop target attached to the toolbar instance
         */
        this.dropTarget = new Ext.dd.DropTarget(this.toolbar.getEl(), {
            notifyOver: this.notifyOver.createDelegate(this),
            notifyDrop: this.notifyDrop.createDelegate(this)
        });
    },
    
    /**
     * Adds the given DD Group to the drop target
     * @param {String} ddGroup The DD Group
     */
    addDDGroup: function(ddGroup) {
    	if (this.dropTarget != undefined) {
    		this.dropTarget.addToGroup(ddGroup);
    	}
    },
    
    /**
     * Calculates the location on the toolbar to create the new sorter button based on the XY of the
     * drag event
     * @param {Ext.EventObject} e The event object
     * @return {Number} The index at which to insert the new button
     */
    calculateEntryIndex: function(e) {
        var entryIndex = 0,
            toolbar    = this.toolbar,
            items      = toolbar.items.items,
            count      = items.length,
            xTotal     = toolbar.getEl().getXY()[0],
            xHover     = e.getXY()[0] - xTotal;
        
        for (var index = 0; index < count; index++) {
            var item     = items[index],
                width    = item.getEl().getWidth(),
                midpoint = xTotal + width / 2;
            
            xTotal += width;
            
            if (xHover < midpoint) {
                entryIndex = index;       

                break;
            } else {
                entryIndex = index + 1;
            }
        }
        
        return entryIndex;
    },
    
    /**
     * Returns true if the drop is allowed on the drop target. This function can be overridden
     * and defaults to simply return true
     * @param {Object} data Arbitrary data from the drag source
     * @return {Boolean} True if the drop is allowed
     */
    canDrop: function(data) {
        return true;
    },
    
    /**
     * Custom notifyOver method which will be used in the plugin's internal DropTarget
     * @return {String} The CSS class to add
     */
    notifyOver: function(dragSource, event, data) {
        return this.canDrop.apply(this, arguments) ? this.dropTarget.dropAllowed : this.dropTarget.dropNotAllowed;
    },
    
    /**
     * Called when the drop has been made. Creates the new toolbar item, places it at the correct location
     * and calls the afterLayout callback.
     */
    notifyDrop: function(dragSource, event, data) {
        var canAdd = this.canDrop(dragSource, event, data),
            tbar   = this.toolbar;
        
        if (canAdd) {
            var entryIndex = this.calculateEntryIndex(event);
            
            tbar.insert(entryIndex, this.createItem(data));
            tbar.doLayout();
            
            this.afterLayout();
        }
        
        return canAdd;
    },
    
    /**
     * Creates the new toolbar item based on drop data. This method must be implemented by the plugin instance
     * @param {Object} data Arbitrary data from the drop
     * @return {Mixed} An item that can be added to a toolbar
     */
    createItem: function(data) {
        throw new Error("The createItem method must be implemented in the ToolbarDroppable plugin");
    },
    
    /**
     * Called after a new button has been created and added to the toolbar. Add any required cleanup logic here
     */
    afterLayout: Ext.emptyFn
});
/*!
 * Ext JS Library 3.3.1
 * Copyright(c) 2006-2010 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.ToolbarReorderer
 * @extends Ext.ux.Reorderer
 * Plugin which can be attached to any Ext.Toolbar instance. Provides ability to reorder toolbar items
 * with drag and drop. Example:
 * <pre>
 * new Ext.Toolbar({
 *     plugins: [
 *         new Ext.ux.ToolbarReorderer({
 *             defaultReorderable: true
 *         })
 *     ],
 *     items: [
 *       {text: 'Button 1', reorderable: false},
 *       {text: 'Button 2'},
 *       {text: 'Button 3'}
 *     ]
 * });
 * </pre>
 * In the example above, buttons 2 and 3 will be reorderable via drag and drop. An event named 'reordered'
 * is added to the Toolbar, and is fired whenever a reorder has been completed.
 */
Ext.ux.ToolbarReorderer = Ext.extend(Ext.ux.Reorderer, {
    /**
     * Initializes the plugin, decorates the toolbar with additional functionality
     */
    init: function(toolbar) {
        /**
         * This is used to store the correct x value of each button in the array. We need to use this
         * instead of the button's reported x co-ordinate because the buttons are animated when they move -
         * if another onDrag is fired while the button is still moving, the comparison x value will be incorrect
         */
        this.buttonXCache = {};
        
        toolbar.on({
            scope: this,
            add  : function(toolbar, item) {
                this.createIfReorderable(item);
            }
        });
        
        //super sets a reference to the toolbar in this.target
        Ext.ux.ToolbarReorderer.superclass.init.apply(this, arguments);
    },
        
    /**
     * Sets up the given Toolbar item as a draggable
     * @param {Mixed} button The item to make draggable (usually an Ext.Button instance)
     */
    createItemDD: function(button) {
        if (button.dd != undefined) {
            return;
        }
        
        var el   = button.getEl(),
            id   = el.id,
            tbar = this.target,
            me   = this;
        
        button.dd = new Ext.dd.DD(el, undefined, {
            isTarget: false
        });
        
        //if a button has a menu, it is disabled while dragging with this function
        var menuDisabler = function() {
            return false;
        };
        
        Ext.apply(button.dd, {
            b4StartDrag: function() {       
                this.startPosition = el.getXY();
                
                //bump up the z index of the button being dragged but keep a reference to the original
                this.startZIndex = el.getStyle('zIndex');
                el.setStyle('zIndex', 10000);
                
                button.suspendEvents();
                if (button.menu) {
                    button.menu.on('beforeshow', menuDisabler, me);
                }
            },
            
            startDrag: function() {
                this.constrainTo(tbar.getEl());
                this.setYConstraint(0, 0, 0);
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
    },
    
    /**
     * @private
     * Updates the internal cache of button X locations. 
     */
    updateButtonXCache: function() {
        var tbar   = this.target,
            items  = tbar.items,
            totalX = tbar.getEl().getBox(true).x;
            
        items.each(function(item) {
            this.buttonXCache[item.id] = totalX;

            totalX += item.getEl().getWidth();
        }, this);
    }
});
Ext.ux.Mask = function(mask) {
    var config = {
        mask: mask
    };
    Ext.apply(this, config);
};
Ext.extend(Ext.ux.Mask, Object, {
    init: function(c) {
        this.LetrasL = 'abcdefghijklmnopqrstuvwxyz';
        this.LetrasU = Ext.util.Format.uppercase(this.LetrasL);
        this.Letras  = this.LetrasL + this.LetrasU;
        this.Numeros = '0123456789';
        this.Fixos  = '().-:/ '; 
        this.Charset = " !\"#$%&\'()*+,-./0123456789:;<=>?@" + this.LetrasU + "[\]^_/`" + this.LetrasL + "{|}~";
        c.enableKeyEvents = true;
        c.on('keypress', function(field, evt) { return this.press(field, evt) }, this);
    },
    press: function(field, evt) {
        var value = field.getValue();
        var key = evt.getKey();
        var mask = this.mask;
        var objDom = field.el.dom;
        if(evt){
        	if((objDom.selectionEnd - objDom.selectionStart) > 0){
                return true;    
		    }
		    if((objDom.selectionStart > 0) && (objDom.selectionStart < objDom.textLength)){
		        return true;    
		    }
            var tecla = this.Charset.substr(key - 32, 1);
            if(key < 32 || evt.isNavKeyPress() || key == evt.BACKSPACE){
                return true;
            }
            if(Ext.isGecko || Ext.isGecko2 || Ext.isGecko3)
                if((evt.charCode == 0 && evt.keyCode == 46) || evt.isSpecialKey()) return true; // DELETE (conflict with dot(.))
            var tamanho = value.length;
            if(tamanho >= mask.length){
                field.setValue(value);
                evt.stopEvent();
                return false;
            }
            var pos = mask.substr(tamanho,1); 
            while(this.Fixos.indexOf(pos) != -1){
                value += pos;
                tamanho = value.length;
                if(tamanho >= mask.length){
                    evt.stopEvent();
                    return false;
                }
                pos = mask.substr(tamanho,1);
            }
            switch(pos){
                case '#' : if(this.Numeros.indexOf(tecla) == -1){evt.stopEvent(); return false;} break;
                case 'A' : tecla = tecla.toUpperCase(); if(this.LetrasU.indexOf(tecla) == -1){evt.stopEvent(); return false;} break;
                case 'a' : tecla = tecla.toLowerCase(); if(this.LetrasL.indexOf(tecla) == -1){evt.stopEvent(); return false;} break;
                case 'Z' : if(this.Letras.indexOf(tecla) == -1) {evt.stopEvent(); return false;} break;
                case '*' : field.setValue(value + tecla); break;
                default : field.setValue(value); break;
            }
        }
        field.setValue(value + tecla);
        objDom.selectionEnd = objDom.selectionStart;
        evt.stopEvent();
        return false;
    }
});
Ext.ns('Ext.ux');

Ext.ux.Lightbox = (function(){
    var els = {},
        images = [],
        activeImage,
        initialized = false,
        selectors = [];

    return {
        overlayOpacity: 0.85,
        animate: true,
        resizeSpeed: 8,
        borderSize: 10,
        labelImage: "Image",
        labelOf: "of",

        init: function() {
            this.resizeDuration = this.animate ? ((11 - this.resizeSpeed) * 0.15) : 0;
            this.overlayDuration = this.animate ? 0.2 : 0;

            if(!initialized) {
                Ext.apply(this, Ext.util.Observable.prototype);
                Ext.util.Observable.constructor.call(this);
                this.addEvents('open', 'close');
                this.initMarkup();
                this.initEvents();
                initialized = true;
            }
        },

        initMarkup: function() {
            els.shim = Ext.DomHelper.append(document.body, {
                tag: 'iframe',
                id: 'ux-lightbox-shim'
            }, true);
            els.overlay = Ext.DomHelper.append(document.body, {
                id: 'ux-lightbox-overlay'
            }, true);
            
            var lightboxTpl = new Ext.Template(this.getTemplate());
            els.lightbox = lightboxTpl.append(document.body, {}, true);

            var ids =
                ['outerImageContainer', 'imageContainer', 'image', 'hoverNav', 'navPrev', 'navNext', 'loading', 'loadingLink',
                'outerDataContainer', 'dataContainer', 'data', 'details', 'caption', 'imageNumber', 'bottomNav', 'navClose'];

            Ext.each(ids, function(id){
                els[id] = Ext.get('ux-lightbox-' + id);
            });

            Ext.each([els.overlay, els.lightbox, els.shim], function(el){
                el.setVisibilityMode(Ext.Element.DISPLAY)
                el.hide();
            });

            var size = (this.animate ? 250 : 1) + 'px';
            els.outerImageContainer.setStyle({
                width: size,
                height: size
            });
        },

        getTemplate : function() {
            return [
                '<div id="ux-lightbox">',
                    '<div id="ux-lightbox-outerImageContainer">',
                        '<div id="ux-lightbox-imageContainer">',
                            '<img id="ux-lightbox-image">',
                            '<div id="ux-lightbox-hoverNav">',
                                '<a href="#" id="ux-lightbox-navPrev"></a>',
                                '<a href="#" id="ux-lightbox-navNext"></a>',
                            '</div>',
                            '<div id="ux-lightbox-loading">',
                                '<a id="ux-lightbox-loadingLink"></a>',
                            '</div>',
                        '</div>',
                    '</div>',
                    '<div id="ux-lightbox-outerDataContainer">',
                        '<div id="ux-lightbox-dataContainer">',
                            '<div id="ux-lightbox-data">',
                                '<div id="ux-lightbox-details">',
                                    '<span id="ux-lightbox-caption"></span>',
                                    '<span id="ux-lightbox-imageNumber"></span>',
                                '</div>',
                                '<div id="ux-lightbox-bottomNav">',
                                    '<a href="#" id="ux-lightbox-navClose"></a>',
                                '</div>',
                            '</div>',
                        '</div>',
                    '</div>',
                '</div>'
            ];
        },

        initEvents: function() {
            var close = function(ev) {
                ev.preventDefault();
                this.close();
            };

            els.overlay.on('click', close, this);
            els.loadingLink.on('click', close, this);
            els.navClose.on('click', close, this);

            els.lightbox.on('click', function(ev) {
                if(ev.getTarget().id == 'ux-lightbox') {
                    this.close();
                }
            }, this);

            els.navPrev.on('click', function(ev) {
                ev.preventDefault();
                this.setImage(activeImage - 1);
            }, this);

            els.navNext.on('click', function(ev) {
                ev.preventDefault();
                this.setImage(activeImage + 1);
            }, this);
        },

        register: function(sel, group) {
            if(selectors.indexOf(sel) === -1) {
                selectors.push(sel);

                Ext.fly(document).on('click', function(ev){
                    var target = ev.getTarget(sel);

                    if (target) {
                        ev.preventDefault();
                        this.open(target, sel, group);
                    }
                }, this);
            }
        },

        open: function(image, sel, group) {
            group = group || false;
            this.setViewSize();
            els.overlay.fadeIn({
                duration: this.overlayDuration,
                endOpacity: this.overlayOpacity,
                callback: function() {
                    images = [];

                    var index = 0;
                    if(!group) {
                        images.push([image.href, image.title]);
                    }
                    else {
                        var setItems = Ext.query(sel);
                        Ext.each(setItems, function(item) {
                            if(item.href) {
                                images.push([item.href, item.title]);
                            }
                        });

                        while (images[index][0] != image.href) {
                            index++;
                        }
                    }

                    // calculate top and left offset for the lightbox
                    var pageScroll = Ext.fly(document).getScroll();

                    var lightboxTop = pageScroll.top + (Ext.lib.Dom.getViewportHeight() / 10);
                    var lightboxLeft = pageScroll.left;
                    els.lightbox.setStyle({
                        top: lightboxTop + 'px',
                        left: lightboxLeft + 'px'
                    }).show();

                    this.setImage(index);
                    
                    this.fireEvent('open', images[index]);                                        
                },
                scope: this
            });
        },
        
        setViewSize: function(){
            var viewSize = this.getViewSize();
            els.overlay.setStyle({
                width: viewSize[0] + 'px',
                height: viewSize[1] + 'px'
            });
            els.shim.setStyle({
                width: viewSize[0] + 'px',
                height: viewSize[1] + 'px'
            }).show();
        },

        setImage: function(index){
            activeImage = index;
                      
            this.disableKeyNav();            
            if (this.animate) {
                els.loading.show();
            }

            els.image.hide();
            els.hoverNav.hide();
            els.navPrev.hide();
            els.navNext.hide();
            els.dataContainer.setOpacity(0.0001);
            els.imageNumber.hide();

            var preload = new Image();
            preload.onload = (function(){
                els.image.dom.src = images[activeImage][0];
                this.resizeImage(preload.width, preload.height);
            }).createDelegate(this);
            preload.src = images[activeImage][0];
        },

        resizeImage: function(w, h){
            var wCur = els.outerImageContainer.getWidth();
            var hCur = els.outerImageContainer.getHeight();

            var wNew = (w + this.borderSize * 2);
            var hNew = (h + this.borderSize * 2);

            var wDiff = wCur - wNew;
            var hDiff = hCur - hNew;

            var afterResize = function(){
                els.hoverNav.setWidth(els.imageContainer.getWidth() + 'px');

                els.navPrev.setHeight(h + 'px');
                els.navNext.setHeight(h + 'px');

                els.outerDataContainer.setWidth(wNew + 'px');

                this.showImage();
            };
            
            if (hDiff != 0 || wDiff != 0) {
                els.outerImageContainer.shift({
                    height: hNew,
                    width: wNew,
                    duration: this.resizeDuration,
                    scope: this,
                    callback: afterResize,
                    delay: 50
                });
            }
            else {
                afterResize.call(this);
            }
        },

        showImage: function(){
            els.loading.hide();
            els.image.fadeIn({
                duration: this.resizeDuration,
                scope: this,
                callback: function(){
                    this.updateDetails();
                }
            });
            this.preloadImages();
        },

        updateDetails: function(){
            var detailsWidth = els.data.getWidth(true) - els.navClose.getWidth() - 10;
            els.details.setWidth((detailsWidth > 0 ? detailsWidth : 0) + 'px');
            
            els.caption.update(images[activeImage][1]);

            els.caption.show();
            if (images.length > 1) {
                els.imageNumber.update(this.labelImage + ' ' + (activeImage + 1) + ' ' + this.labelOf + '  ' + images.length);
                els.imageNumber.show();
            }

            els.dataContainer.fadeIn({
                duration: this.resizeDuration/2,
                scope: this,
                callback: function() {
                    var viewSize = this.getViewSize();
                    els.overlay.setHeight(viewSize[1] + 'px');
                    this.updateNav();
                }
            });
        },

        updateNav: function(){
            this.enableKeyNav();

            els.hoverNav.show();

            // if not first image in set, display prev image button
            if (activeImage > 0)
                els.navPrev.show();

            // if not last image in set, display next image button
            if (activeImage < (images.length - 1))
                els.navNext.show();
        },

        enableKeyNav: function() {
            Ext.fly(document).on('keydown', this.keyNavAction, this);
        },

        disableKeyNav: function() {
            Ext.fly(document).un('keydown', this.keyNavAction, this);
        },

        keyNavAction: function(ev) {
            var keyCode = ev.getKey();

            if (
                keyCode == 88 || // x
                keyCode == 67 || // c
                keyCode == 27
            ) {
                this.close();
            }
            else if (keyCode == 80 || keyCode == 37){ // display previous image
                if (activeImage != 0){
                    this.setImage(activeImage - 1);
                }
            }
            else if (keyCode == 78 || keyCode == 39){ // display next image
                if (activeImage != (images.length - 1)){
                    this.setImage(activeImage + 1);
                }
            }
        },

        preloadImages: function(){
            var next, prev;
            if (images.length > activeImage + 1) {
                next = new Image();
                next.src = images[activeImage + 1][0];
            }
            if (activeImage > 0) {
                prev = new Image();
                prev.src = images[activeImage - 1][0];
            }
        },

        close: function(){
            this.disableKeyNav();
            els.lightbox.hide();
            els.overlay.fadeOut({
                duration: this.overlayDuration
            });
            els.shim.hide();
            this.fireEvent('close', activeImage);
        },

        getViewSize: function() {
            return [Ext.lib.Dom.getViewWidth(), Ext.lib.Dom.getViewHeight()];
        }
    }
})();

Ext.onReady(Ext.ux.Lightbox.init, Ext.ux.Lightbox);
/**
 * Содержит общие функции вызываемые из разных частей
 */
Ext.QuickTips.init();

/**
 * Чтобы ie и прочие не правильные браузеры, где нет console не падали
 */
if (typeof console == "undefined") var console = { log: function() {} };

Ext.namespace('Ext.m3');


var SOFTWARE_NAME = 'Платформа М3';

/**
 *  Реализация стандартного assert
 * @param {Boolean} condition
 * @param {Str} errorMsg
 */
function assert(condition, errorMsg) {
  if (!condition) {
      console.error(errorMsg);
      throw new Error(errorMsg);
  }
}

/**
 * 
 * @param {Object} text
 */
function smart_eval(text){
	if( text == undefined ){
	    // на случай, когда в процессе получения ответа сервера произошел аборт
		return;
	}
	if(text.substring(0,1) == '{'){
		// это у нас json объект
		var obj = Ext.util.JSON.decode(text);
		if(!obj){
			return;
		}
		if(obj.code){
			var eval_result = obj.code();
			if( eval_result &&  eval_result instanceof Ext.Window && typeof AppDesktop != 'undefined' && AppDesktop){
				AppDesktop.getDesktop().createWindow(eval_result);
			}
			return eval_result;
		}
		else
		{
    		if(obj.message && obj.message != ''){
    			Ext.Msg.show({title:'Внимание', msg: obj.message, buttons:Ext.Msg.OK, icon: (obj.success!=undefined && !obj.success ? Ext.Msg.WARNING : Ext.Msg.Info)});
    			return;
    		}
		}
	}
	else{
	    try{ 
		    var eval_result = eval(text);
		} catch (e) {
		     Ext.Msg.show({
                title:'Внимание'
                ,msg:'Произошла непредвиденная ошибка!'
                ,buttons: Ext.Msg.OK
                ,fn: Ext.emptyFn
                ,animEl: 'elId'
                ,icon: Ext.MessageBox.WARNING
            });
		    throw e;
		}
		if( eval_result &&  eval_result instanceof Ext.Window && typeof AppDesktop != 'undefined' && AppDesktop){
			AppDesktop.getDesktop().createWindow(eval_result);
		}
		return eval_result;
	}
}

Ext.ns('Ext.app.form');
/**
 * Модифицированный контрол поиска, за основу был взят контрол от ui.form.SearchField
 * @class {Ext.app.form.SearchField} Контрол поиска
 * @extends {Ext.form.TwinTriggerField} Абстрактный класс как раз для разного рода таких вещей, типа контрола поиска
 */
Ext.app.form.SearchField = Ext.extend(Ext.form.TwinTriggerField, {
    initComponent : function(){
        Ext.app.form.SearchField.superclass.initComponent.call(this);
        this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTrigger2Click();
            }
        }, this);
    }

    ,validationEvent:false
    ,validateOnBlur:false
    ,trigger1Class:'x-form-clear-trigger'
    ,trigger2Class:'x-form-search-trigger'
    ,hideTrigger1:true
    ,width:180
    ,hasSearch : false
    ,paramName : 'filter'
	,paramId: 'id'
	,nodeId:'-1'
    
    ,onTrigger1Click : function(e, html, arg){
        if(this.hasSearch){
        	this.el.dom.value = '';
        	var cmp = this.getComponentForSearch();
        	if (cmp instanceof Ext.grid.GridPanel) {
	            var o = {start: 0};
	            var store = cmp.getStore();
	            store.baseParams = store.baseParams || {};
	            store.baseParams[this.paramName] = '';
				store.baseParams[this.paramId] = this.nodeId || '';	
	            store.reload({params:o});

	        } else if (cmp instanceof Ext.ux.tree.TreeGrid) {
	        	this.el.dom.value = '';
	        	
	        	var loader = cmp.getLoader();
	        	loader.baseParams = loader.baseParams || {};
	        	loader.baseParams[this.paramName] = '';
	        	var rootNode = cmp.getRootNode();
	        	loader.load(rootNode);
	        	rootNode.expand();
	        };
	        this.triggers[0].hide();
	        this.hasSearch = false;
        }
    }

    ,onTrigger2Click : function(e, html, arg){
        var value = this.getRawValue();
        var cmp = this.getComponentForSearch();
        if (cmp instanceof Ext.grid.GridPanel) {
            var o = {start: 0};
            var store = cmp.getStore();
	        store.baseParams = store.baseParams || {};
	        store.baseParams[this.paramName] = value;
	        store.baseParams[this.paramId] = this.nodeId || '';	
	        store.reload({params:o});
        } else if (cmp instanceof Ext.ux.tree.TreeGrid) {
        	var loader = cmp.getLoader();
        	loader.baseParams = loader.baseParams || {};
	        loader.baseParams[this.paramName] = value;
        	var rootNode = cmp.getRootNode();
        	loader.load(rootNode);
        	rootNode.expand();
        	//console.log(rootNode);
        };
        if (value) {
        	this.hasSearch = true;
	    	this.triggers[0].show();
        }
    }
    
    ,clear : function(node_id){ this.onTrigger1Click() }
    ,search: function(node_id){ this.onTrigger2Click() }
});
/**
 * В поле добавим функционал отображения того, что оно изменено.
 */
Ext.override(Ext.form.Field, {
	/**
	 * Признак, что поле используется для изменения значения, 
	 * а не для навигации - при Истине будут повешаны обработчики на изменение окна
	 * */ 
	isEdit: true,
	isModified: false,
	updateLabel: function() {
		this.setFieldLabel(this.fieldLabel);
	},
	setFieldLabel : function(text) {
		if ( text != undefined ) {
	    	if (this.rendered) {
	      		var newtext = text+':';
	      		if (this.isModified) {newtext = '<span style="color:darkmagenta;">' + newtext + '</span>'; };
		  		//if (this.isModified) {newtext = '<span">*</span>' + newtext; };
				var lab = this.el.up('.x-form-item', 10, true);
				if (lab) {
					lab.child('.x-form-item-label').update(newtext);
				}
	    	}
	    	this.fieldLabel = text;
		}
	},
	// переопределим клавишу ENTER для применения изменений поля
	fireKey : function(e){
        if(e.isSpecialKey()){
			if (e.getKey() == e.ENTER) {
				// этот метод делает применение изменений
				this.onBlur();
				// проставим значение, как будто мы ушли с поля и вернулись обратно
				this.startValue = this.getValue();
			};
            this.fireEvent('specialkey', this, e);
        }
    }
});

/**
 * Создаётся новый компонент: Панель с возможностью включения в заголовок
 * визуальных компонентов.
 */
Ext.app.TitlePanel = Ext.extend(Ext.Panel, {
   titleItems: null,
   addTitleItem: function (itemConfig) { 
       var item = Ext.ComponentMgr.create(itemConfig);
       var itemsDiv = Ext.DomHelper.append(this.header, {tag:"div", style:"float:right;margin-top:-4px;margin-left:3px;"}, true);
       item.render(itemsDiv);
   },
   onRender: function (ct, position) {
       Ext.app.TitlePanel.superclass.onRender.apply(this, arguments);
       if (this.titleItems != null) {
           if(Ext.isArray(this.titleItems)){
               for (var i = this.titleItems.length-1; i >= 0 ; i--) {
                   this.addTitleItem(this.titleItems[i]);
               }
           } else {
               this.addTitleItems(this.titleItems);
           }
           
           if (this.header)
               this.header.removeClass('x-unselectable');
       };
   },
   getChildByName: function (name) {
       if (this.items)
           for (var i = 0;  i < this.items.length; i++)
               if (this.items.items[i].name == name)
                   return this.items.items[i];

       if (this.titleItems)
           for (var i = 0; i < this.titleItems.length; i++)
               if (this.titleItems[i].name == name)
                   return this.titleItems[i];

       return null;
    }
});


/*
 * выполняет обработку failure response при submit пользовательских форм
 * context.action -- объект, передаваемый из failure handle
 * context.title -- заголовок окон с сообщением об ошибке
 * context.message -- текст в случае, если с сервера на пришло иного сообщения об ошибке
 */
function uiFailureResponseOnFormSubmit(context){
    if(context.action.failureType=='server'){
        obj = Ext.util.JSON.decode(context.action.response.responseText);
        Ext.Msg.show({title: context.title,
            msg: obj.error_msg,
            buttons: Ext.Msg.OK,
            icon: Ext.Msg.WARNING});
    }else{
        Ext.Msg.alert(context.title, context.message);
    }
}

/*
 * Если функция вызвана без параметров, то будет выдано простое сообщение об ошибке
 * Если передан параметр респонс, то будет нарисовано экстовое окно и в нем отображен
 * респонс сервера(предназначено для отладки серверных ошибок)
*/
function uiAjaxFailMessage (response, opt) {
	
	// response.status === 0 -- "communication failure"
	if (Ext.isEmpty(response) || response.status === 0) {
		Ext.Msg.alert(SOFTWARE_NAME, 'Извините, сервер временно не доступен.');
		return;
	}
	
    // response['status'] === 200 -- Пользовательская ошибка, success == false
	if (response['status'] === 200 || opt['failureType'] === "server"){
	    // Пришел OperationResult('success':False)
	    if (opt && opt.response && opt.response.responseText) {
	        smart_eval( opt.response.responseText );
	    } else {
            // grid and tree load обрабатывается тут
            smart_eval( response.responseText );
        }
	} else {
    	var bodySize = Ext.getBody().getViewSize(),
    		width = (bodySize.width < 500) ? bodySize.width - 50 : 500,
    		height = (bodySize.height < 300) ? bodySize.height - 50 : 300,
    		win;
        
        // Для submit'a response приходит вторым параметром
        if (!response.responseText && opt && opt.response){
            response = opt.response;
        }
    	var errorMsg = response.responseText;
	
    	var win = new Ext.Window({ modal: true, width: width, height: height, 
    	    title: "Request Failure", layout: "fit", maximizable: true, 
    	    maximized: true,
    		listeners : {
    			"maximize" : {
    				fn : function (el) {
    					var v = Ext.getBody().getViewSize();
    					el.setSize(v.width, v.height);
    				},
    				scope : this
    			},
    
    			"resize" : {
    				fn : function (wnd) {
    					var editor = Ext.getCmp("__ErrorMessageEditor");
    					var sz = wnd.body.getViewSize();
    					editor.setSize(sz.width, sz.height - 42);
    				}
    			}
    		},
    		items : new Ext.form.FormPanel({
    			baseCls : "x-plain",
    			layout  : "absolute",
    			defaultType : "label",
    			items : [
    				{x: 5,y: 5,
    					html : '<div class="x-window-dlg"><div class="ext-mb-error" style="width:32px;height:32px"></div></div>'
    				},
    				{x: 42,y: 6,
    					html : "<b>Status Code: </b>"
    				},
    				{x: 125,y: 6,
    					text : response.status
    				},
    				{x: 42,y: 25,
    					html : "<b>Status Text: </b>"
    				},
    				{x: 125,y: 25,
    					text : response.statusText
    				},
    				{x: 0,y: 42,
    					id : "__ErrorMessageEditor",
    					xtype    : "htmleditor",
    					value    : errorMsg,
    					readOnly : true,
    					enableAlignments : false,
    					enableColors     : false,
    					enableFont       : false,
    					enableFontSize   : false,
    					enableFormat     : false,
    					enableLinks      : false,
    					enableLists      : false,
    					enableSourceEdit : false,
    					listeners         : {
    						"push" : {
    							fn : function(self,html) {
    								
    								// событие возникает когда содержимое iframe становится доступно
    								
    								function fixDjangoPageScripts(doc) {
    									//грязный хак - эвалим скрипты в iframe 
    									
    									try {																				
    										var scripts = doc.getElementsByTagName('script');
    										for (var i = 0; i < scripts.length;i++) {
    											if (scripts[i].innerText) {
    												this.eval(scripts[i].innerText);
    											}
    											else {
    												this.eval(scripts[i].textContent);
    											}
    										}	
    																			
    										//и скрыта подробная информация, тк document.onLoad не будет
    										//вызвано
    										this.hideAll(this.getElementsByClassName(doc, 'table', 'vars'));
    										this.hideAll(this.getElementsByClassName(doc, 'ol', 'pre-context'));
    										this.hideAll(this.getElementsByClassName(doc, 'ol', 'post-context'));
    										this.hideAll(this.getElementsByClassName(doc, 'div', 'pastebin'));
    										
    									}
    									catch(er) {
    										//
    									}
    								}
    								
    								//магия - меняем объект исполнения на window из iframe
    								fixDjangoPageScripts.call(this.iframe.contentWindow, this.iframe.contentDocument);
    								//TO DO: нужно еще поправлять стили странички в IE и Сафари
    							}
    						}
    					
    					}
    				}
    			]
    		})
    	});
    
    	win.show();
	}
}

// Проверяет есть ли в ответе сообщение и выводит его
// Возвращает серверный success
function uiShowErrorMessage(response){
	obj = Ext.util.JSON.decode(response.responseText);
	if (obj.error_msg)
		Ext.Msg.alert(SOFTWARE_NAME, obj.error_msg);
// Не понятно зачем нужен этот код.
//	if (obj.code)
//		alert('Пришел код на выполнение ' + obj.code);
	return obj.success;
}

/**
 * Генерирует запрос на сервер по переданному url
 * @param {String} url URL запроса на получение формы
 * @param {Object} desktop Объект типа AppDesktop.getDesktop()
 * @param {Object} параметры запроса
 */
function sendRequest(url, desktop, params){                     
    var mask = new Ext.LoadMask(Ext.getBody());
    mask.show();
    Ext.Ajax.request({
    	params: params,
        url: url,
        method: 'POST',
        success: function(response, options){
            try{             
                smart_eval(response.responseText);
            } finally { 
                mask.hide();
            }
        }, 
        failure: function(){            
            uiAjaxFailMessage.apply(this, arguments);
            mask.hide();
        }
    });
}

/**
 * Для правильного отображения колонок в гриде для цен и сумм
 * Использовать в качестве renderer в колонке грида
 * param Значение в колонке
 */
 function thousandCurrencyRenderer(val) {
    if (typeof (val) != 'number') {
        var num = val;
        try { num = parseFloat(val.replace(/,+/, ".").replace(/\s+/g, "")); }
        catch (ex) { num = NaN; }

        if (isNaN(num)) {
            return val;
        }
        else {
            val = num;
        }
    }

    var retVal = "";
    var x = val.toFixed(2).split('.');
    var real = x[0];
    var decimal = x[1];
    var g = 0;
    var i = 0;
    
    var offset = real.length % 3;
	
	if (offset != 0) {
		for (var i; i < offset; i++) {
			retVal += real.charAt(i);
		}
		retVal += ' ';
	}
	
    for (var i; i < real.length; i++) {
        if (g % 3 == 0 && g != 0) {
            retVal += ' ';
        }
        retVal += real.charAt(i);
        g++;

    }

    if (decimal) {
        retVal += ',' + decimal;
    }

    retVal = retVal.replace(/\s,/, ",");

    return retVal;
}

// Функция проверки существования элемента в массиве. В эксте её нет.
// Не работает под ие6, но для него тоже написана реализация, если понадобится:
// http://stackoverflow.com/questions/143847/best-way-to-find-an-item-in-a-javascript-array
function includeInArr(arr, obj) {
    return (arr.indexOf(obj) != -1);
}

//Cообщения
function showMessage(msg, title, icon){
	title = title || 'Внимание';
	msg = msg || '';
	icon = icon || Ext.MessageBox.INFO;
    Ext.Msg.show({
        title: title,
        msg: msg,
        buttons: Ext.Msg.OK,
        icon: icon
    });
}

function showWarning(msg, title){
	showMessage(msg, title, Ext.MessageBox.WARNING);
}

/**
 * Расширенный функционал комбобокса
 */

Ext.m3.ComboBox =  Ext.extend(Ext.form.ComboBox,{
	/**
	 * Возвращает текстовое представление комбобокса
	 */
	getText: function(){
		return this.lastSelectionText;
	}
})
/**
 * Расширенный грид на базе Ext.grid.GridPanel
 * @param {Object} config
 */
Ext.m3.GridPanel = Ext.extend(Ext.grid.GridPanel, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);
		
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
				if (bbar && bbar instanceof Ext.PagingToolbar){
					var store = this.getStore();
					store.setBaseParam('start',0);
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
		
		Ext.m3.GridPanel.superclass.constructor.call(this, config);
	}
	,initComponent: function(){
		Ext.m3.GridPanel.superclass.initComponent.call(this);
		var store = this.getStore();
		store.on('exception', this.storeException, this);
	}
	/**
	 * Обработчик исключений хранилица
	 */
	,storeException: function (proxy, type, action, options, response, arg){
		//console.log(proxy, type, action, options, response, arg);
		uiAjaxFailMessage(response, options);
	}
});

Ext.m3.EditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel, {
  constructor: function(baseConfig, params){
//    console.log(baseConfig);
//    console.log(params);
    
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
                this.getSelectionModel().selectRow(index);
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
		//console.log(proxy, type, action, options, response, arg);
		if (type == 'remote' && action != Ext.data.Api.actions.read) {
		  if (response.raw.message) {
  		  Ext.Msg.show({
  		    title: 'Внимание!',
  		    msg: response.raw.message,
  		    buttons: Ext.Msg.CANCEL,
  		    icon: Ext.Msg.WARNING
  		  });
  		};
		} else {
		  uiAjaxFailMessage(response, options);
		};
	}
});
if (Ext.version == '3.0') {
    Ext.override(Ext.grid.GridView, {
        ensureVisible : function(row, col, hscroll) {
        
            var resolved = this.resolveCell(row, col, hscroll);
            if(!resolved || !resolved.row){
                return;
            }

            var rowEl = resolved.row, 
                cellEl = resolved.cell,
                c = this.scroller.dom,
                ctop = 0,
                p = rowEl, 
                stop = this.el.dom;
            
            var p = rowEl, stop = this.el.dom;
            while(p && p != stop){
                ctop += p.offsetTop;
                p = p.offsetParent;
            }
            ctop -= this.mainHd.dom.offsetHeight;
        
            var cbot = ctop + rowEl.offsetHeight;
        
            var ch = c.clientHeight;
            var stop = parseInt(c.scrollTop, 10);
            var sbot = stop + ch;
    
            if(ctop < stop){
              c.scrollTop = ctop;
            }else if(cbot > sbot){
                c.scrollTop = cbot-ch;
            }
    
            if(hscroll !== false){
                var cleft = parseInt(cellEl.offsetLeft, 10);
                var cright = cleft + cellEl.offsetWidth;
    
                var sleft = parseInt(c.scrollLeft, 10);
                var sright = sleft + c.clientWidth;
                if(cleft < sleft){
                    c.scrollLeft = cleft;
                }else if(cright > sright){
                    c.scrollLeft = cright-c.clientWidth;
                }
            }
            return this.getResolvedXY(resolved);
        }
    });
}

Ext.namespace('Ext.ux.maximgb.tg');

/**
 * This class shouldn't be created directly use NestedSetStore or AdjacencyListStore instead.
 *
 * @abstract
 */
Ext.ux.maximgb.tg.AbstractTreeStore = Ext.extend(Ext.data.Store,
{
    /**
     * @cfg {String} is_leaf_field_name Record leaf flag field name.
     */
    leaf_field_name : '_is_leaf',
    
    /**
     * Current page offset.
     *
     * @access private
     */
    page_offset : 0,
    
    /**
     * Current active node. 
     *
     * @access private
     */
    active_node : null,
    
    /**
     * @constructor
     */
    constructor : function(config)
    {
        Ext.ux.maximgb.tg.AbstractTreeStore.superclass.constructor.call(this, config);
        
        if (!this.paramNames.active_node) {
            this.paramNames.active_node = 'anode';
        }
        
        this.addEvents(
            /**
             * @event beforeexpandnode
             * Fires before node expand. Return false to cancel operation.
             * param {AbstractTreeStore} this
             * param {Record} record
             */
            'beforeexpandnode',
            /**
             * @event expandnode
             * Fires after node expand.
             * param {AbstractTreeStore} this
             * param {Record} record
             */
            'expandnode',
            /**
             * @event expandnodefailed
             * Fires when expand node operation is failed.
             * param {AbstractTreeStore} this
             * param {id} Record id
             * param {Record} Record, may be undefined 
             */
            'expandnodefailed',
            /**
             * @event beforecollapsenode
             * Fires before node collapse. Return false to cancel operation.
             * param {AbstractTreeStore} this
             * param {Record} record
             */
            'beforecollapsenode',
            /**
             * @event collapsenode
             * Fires after node collapse.
             * param {AbstractTreeStore} this
             * param {Record} record
             */
            'collapsenode',
            /**
             * @event beforeactivenodechange
             * Fires before active node change. Return false to cancel operation.
             * param {AbstractTreeStore} this
             * param {Record} old active node record
             * param {Record} new active node record
             */
            'beforeactivenodechange',
            /**
             * @event activenodechange
             * Fires after active node change.
             * param {AbstractTreeStore} this
             * param {Record} old active node record
             * param {Record} new active node record
             */
            'activenodechange'
        );
    },  

    // Store methods.
    // -----------------------------------------------------------------------------------------------  
    /**
     * Removes record and all its descendants.
     *
     * @access public
     * @param {Record} record Record to remove.
     */
    remove : function(record)
    {
        // ----- Modification start
        if (record === this.active_node) {
            this.setActiveNode(null);
        }
        this.removeNodeDescendants(record);
        // ----- End of modification        
        Ext.ux.maximgb.tg.AbstractTreeStore.superclass.remove.call(this, record);
    },
    
    /**
     * Removes node descendants.
     *
     * @access private
     */
    removeNodeDescendants : function(rc)
    {
        var i, len, children = this.getNodeChildren(rc);
        for (i = 0, len = children.length; i < len; i++) {
            this.remove(children[i]);
        }
    },
    
    /**
     * Loads current active record data.
     */
    load : function(options)
    {
        if (options) {
            if (options.params) {
                if (options.params[this.paramNames.active_node] === undefined) {
                    options.params[this.paramNames.active_node] = this.active_node ? this.active_node.id : null;
                }
            }
            else {
                options.params = {};
                options.params[this.paramNames.active_node] = this.active_node ? this.active_node.id : null;
            }
        }
        else {
            options = {params: {}};
            options.params[this.paramNames.active_node] = this.active_node ? this.active_node.id : null;
        }

        if (options.params[this.paramNames.active_node] !== null) {
            options.add = true;
        }

        return Ext.ux.maximgb.tg.AbstractTreeStore.superclass.load.call(this, options); 
    },
    
    /**
     * Called as a callback by the Reader during load operation.
     *
     * @access private
     */
    loadRecords : function(o, options, success)
    {
        if (!o || success === false) {
            if (success !== false) {
                this.fireEvent("load", this, [], options);
            }
            if (options.callback) {
                options.callback.call(options.scope || this, [], options, false);
            }
            return;
        }
    
        var r = o.records, t = o.totalRecords || r.length,  
            page_offset = this.getPageOffsetFromOptions(options),
            loaded_node_id = this.getLoadedNodeIdFromOptions(options), 
            loaded_node, i, len, prev_record, record, idx, updated, self = this;
    
        if (!options || options.add !== true/* || loaded_node_id === null*/) {
            if (this.pruneModifiedRecords) {
                this.modified = [];
            }
            for (var i = 0, len = r.length; i < len; i++) {
                r[i].join(this);
            }
            if (this.snapshot) {
                this.data = this.snapshot;
                delete this.snapshot;
            }
            this.data.clear();
            this.data.addAll(r);
            this.page_offset = page_offset;
            this.totalLength = t;
            this.applySort();
            this.fireEvent("datachanged", this);
        } 
        else {
            if (loaded_node_id) {
                loaded_node = this.getById(loaded_node_id);
            }
            if (loaded_node) {
                this.setNodeLoaded(loaded_node, true);
                this.setNodeChildrenOffset(loaded_node, page_offset);
                this.setNodeChildrenTotalCount(loaded_node, Math.max(t, r.length));
                this.removeNodeDescendants(loaded_node);
            }
            this.suspendEvents();
            updated = {};
            for (i = 0, len = r.length; i < len; i++) {
                record = r[i];
                idx = this.indexOfId(record.id);
                if (idx == -1) {
                    updated[record.id] = false;
                    this.add(record);
                }
                else {
                    updated[record.id] = true;
                    prev_record = this.getAt(idx);
                    prev_record.reject();
                    prev_record.data = record.data;
                    r[i] = prev_record;
                }
            }
            this.applySort();            
            this.resumeEvents();
    
            r.sort(function(r1, r2) {
                var idx1 = self.data.indexOf(r1),
                    idx2 = self.data.indexOf(r2),
                    result;
         
                if (idx1 > idx2) {
                    result = 1;
                }
                else {
                    result = -1;
                }
                return result;
            });
            
            for (i = 0, len = r.length; i < len; i++) {
                record = r[i];
                if (updated[record.id] == true) {
                    this.fireEvent('update',  this, record, Ext.data.Record.COMMIT);
                }
                else {
                    this.fireEvent("add", this, [record], this.data.indexOf(record));
                }
            }
        }
        this.fireEvent("load", this, r, options);
        if (options.callback) {
            options.callback.call(options.scope || this, r, options, true);
        }
    },

   /**
     * Sort the Records.
     *
     * @access public
     */
    sort : function(fieldName, dir)
    {
        if (this.remoteSort) {
            this.setActiveNode(null);
            if (this.lastOptions) {
                this.lastOptions.add = false;
                if (this.lastOptions.params) {
                    this.lastOptions.params[this.paramNames.active_node] = null;
                }
            }
        }

        return Ext.ux.maximgb.tg.AbstractTreeStore.superclass.sort.call(this, fieldName, dir);         
    },    

    /**
     * Applyes current sort method.
     *
     * @access private
     */
    applySort : function()
    {
        if(this.sortInfo && !this.remoteSort){
            var s = this.sortInfo, f = s.field;
            this.sortData(f, s.direction);
        }
        // ----- Modification start
        else {
            this.applyTreeSort();
        }
        // ----- End of modification
    },
    
    /**
     * Sorts data according to sort params and then applyes tree sorting.
     *
     * @access private
     */
    sortData : function(f, direction) 
    {
        direction = direction || 'ASC';
        var st = this.fields.get(f).sortType;
        var fn = function(r1, r2){
            var v1 = st(r1.data[f]), v2 = st(r2.data[f]);
            return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
        };
        this.data.sort(direction, fn);
        if(this.snapshot && this.snapshot != this.data){
            this.snapshot.sort(direction, fn);
        }
        // ----- Modification start
        this.applyTreeSort();
        // ----- End of modification
    },
    
    // Tree support methods.
    // -----------------------------------------------------------------------------------------------

    /**
     * Sorts store data with respect to nodes parent-child relation. Every child node will be 
     * positioned after its parent.
     *
     * @access public
     */
    applyTreeSort : function()
    {        
        var i, len, temp,
               rec, records = [],
               roots = this.getRootNodes();
                
        // Sorting data
        for (i = 0, len = roots.length; i < len; i++) {
            rec = roots[i];
            records.push(rec);
            this.collectNodeChildrenTreeSorted(records, rec); 
        }
        
        if (records.length > 0) {
            this.data.clear();
            this.data.addAll(records);
        }
        
        // Sorting the snapshot if one present.
        if (this.snapshot && this.snapshot !== this.data) {
            temp = this.data;
            this.data = this.snapshot;
            this.snapshot = null; 
            this.applyTreeSort();
            this.snapshot = this.data;
            this.data = temp;
        }
    },
    
    /**
     * Recusively collects rec descendants and adds them to records[] array.
     *
     * @access private
     * @param {Record[]} records
     * @param {Record} rec
     */
    collectNodeChildrenTreeSorted : function(records, rec)
    {
        var i, len,
            child, 
            children = this.getNodeChildren(rec);
                
        for (i = 0, len = children.length; i < len; i++) {
            child = children[i];
            records.push(child);
            this.collectNodeChildrenTreeSorted(records, child); 
        }
    },
    
    /**
     * Returns current active node.
     * 
     * @access public
     * @return {Record}
     */
    getActiveNode : function()
    {
        return this.active_node;
    },
    
    /**
     * Sets active node.
     * 
     * @access public
     * @param {Record} rc Record to set active. 
     */
    setActiveNode : function(rc)
    {
        if (this.active_node !== rc) {
            if (rc) {
                if (this.data.indexOf(rc) != -1) {
                    if (this.fireEvent('beforeactivenodechange', this, this.active_node, rc) !== false) {
                        this.active_node = rc;
                        this.fireEvent('activenodechange', this, this.active_node, rc);
                    }
                }
                else {
                    throw "Given record is not from the store.";
                }
            }
            else {
                if (this.fireEvent('beforeactivenodechange', this, this.active_node, rc) !== false) {
                    this.active_node = rc;
                    this.fireEvent('activenodechange', this, this.active_node, rc);
                }
            }
        }
    },
     
    /**
     * Returns true if node is expanded.
     *
     * @access public
     * @param {Record} rc
     */
    isExpandedNode : function(rc)
    {
        return rc.ux_maximgb_tg_expanded === true;
    },
    
    /**
     * Sets node expanded flag.
     *
     * @access private
     */
    setNodeExpanded : function(rc, value)
    {
        rc.ux_maximgb_tg_expanded = value;
    },
    
    /**
     * Returns true if node's ancestors are all expanded - node is visible.
     *
     * @access public
     * @param {Record} rc
     */
    isVisibleNode : function(rc)
    {
        var i, len,
                ancestors = this.getNodeAncestors(rc),
                result = true;
        
        for (i = 0, len = ancestors.length; i < len; i++) {
            result = result && this.isExpandedNode(ancestors[i]);
            if (!result) {
                break;
            }
        }
        
        return result;
    },
    
    /**
     * Returns true if node is a leaf.
     *
     * @access public
     * @return {Boolean}
     */
    isLeafNode : function(rc)
    {
        return rc.get(this.leaf_field_name) == true;
    },
    
    /**
     * Returns true if node was loaded.
     *
     * @access public
     * @return {Boolean}
     */
    isLoadedNode : function(rc)
    {
        var result;
        
        if (rc.ux_maximgb_tg_loaded !== undefined) {
            result = rc.ux_maximgb_tg_loaded;
        }
        else if (this.isLeafNode(rc) || this.hasChildNodes(rc)) {
            result = true;
        }
        else {
            result = false;
        }
        
        return result;
    },
    
    /**
     * Sets node loaded state.
     *
     * @access private
     * @param {Record} rc
     * @param {Boolean} value
     */
    setNodeLoaded : function(rc, value)
    {
        rc.ux_maximgb_tg_loaded = value;
    },
    
    /**
     * Returns node's children offset.
     *
     * @access public
     * @param {Record} rc
     * @return {Integer} 
     */
    getNodeChildrenOffset : function(rc)
    {
        return rc.ux_maximgb_tg_offset || 0;
    },
    
    /**
     * Sets node's children offset.
     *
     * @access private
     * @param {Record} rc
     * @parma {Integer} value 
     */
    setNodeChildrenOffset : function(rc, value)
    {
        rc.ux_maximgb_tg_offset = value;
    },
    
    /**
     * Returns node's children total count
     *
     * @access public
     * @param {Record} rc
     * @return {Integer}
     */
    getNodeChildrenTotalCount : function(rc)
    {
        return rc.ux_maximgb_tg_total || 0;
    },
    
    /**
     * Sets node's children total count.
     *
     * @access private
     * @param {Record} rc
     * @param {Integer} value
     */
    setNodeChildrenTotalCount : function(rc, value)
    {
        rc.ux_maximgb_tg_total = value;
    },
    
    /**
     * Collapses node.
     *
     * @access public
     * @param {Record} rc
     * @param {Record} rc Node to collapse. 
     */
    collapseNode : function(rc)
    {
        if (
            this.isExpandedNode(rc) &&
            this.fireEvent('beforecollapsenode', this, rc) !== false 
        ) {
            this.setNodeExpanded(rc, false);
            this.fireEvent('collapsenode', this, rc);
        }
    },
    
    /**
     * Expands node.
     *
     * @access public
     * @param {Record} rc
     */
    expandNode : function(rc)
    {
        var params;
        
        if (
            !this.isExpandedNode(rc) &&
            this.fireEvent('beforeexpandnode', this, rc) !== false
        ) {
            // If node is already loaded then expanding now.
            if (this.isLoadedNode(rc)) {
                this.setNodeExpanded(rc, true);
                this.fireEvent('expandnode', this, rc);
            }
            // If node isn't loaded yet then expanding after load.
            else {
                params = {};
                params[this.paramNames.active_node] = rc.id;
                this.load({
                    add : true,
                    params : params,
                    callback : this.expandNodeCallback,
                    scope : this
                });
            }
        }
    },
    
    /**
     * @access private
     */
    expandNodeCallback : function(r, options, success)
    {
        var rc = this.getById(options.params[this.paramNames.active_node]);
        
        if (success && rc) {
            this.setNodeExpanded(rc, true);
            this.fireEvent('expandnode', this, rc);
        }
        else {
            this.fireEvent('expandnodefailed', this, options.params[this.paramNames.active_node], rc);
        }
    },
    
    /**
     * Expands all nodes.
     *
     * @access public
     */
    expandAll : function()
    {
        var r, i, len, records = this.data.getRange();
        this.suspendEvents();
        for (i = 0, len = records.length; i < len; i++) {
            r = records[i];
            if (!this.isExpandedNode(r)) {
                this.expandNode(r);
            }
        }
        this.resumeEvents();
        this.fireEvent('datachanged', this);
    },
    
    /**
     * Collapses all nodes.
     *
     * @access public
     */
    collapseAll : function()
    {
        var r, i, len, records = this.data.getRange();
        
        this.suspendEvents();
        for (i = 0, len = records.length; i < len; i++) {
            r = records[i];
            if (this.isExpandedNode(r)) {
                this.collapseNode(r);
            }
        }
        this.resumeEvents();
        this.fireEvent('datachanged', this);
    },
    
    /**
     * Returns loaded node id from the load options.
     *
     * @access public
     */
    getLoadedNodeIdFromOptions : function(options)
    {
        var result = null;
        if (options && options.params && options.params[this.paramNames.active_node]) {
            result = options.params[this.paramNames.active_node];
        }
        return result;
    },
    
    /**
     * Returns start offset from the load options.
     */
    getPageOffsetFromOptions : function(options)
    {
        var result = 0;
        if (options && options.params && options.params[this.paramNames.start]) {
            result = parseInt(options.params[this.paramNames.start], 10);
            if (isNaN(result)) {
                result = 0;
            }
        }
        return result;
    },
    
    // Public
    hasNextSiblingNode : function(rc)
    {
        return this.getNodeNextSibling(rc) !== null;
    },
    
    // Public
    hasPrevSiblingNode : function(rc)
    {
        return this.getNodePrevSibling(rc) !== null;
    },
    
    // Public
    hasChildNodes : function(rc)
    {
        return this.getNodeChildrenCount(rc) > 0;
    },
    
    // Public
    getNodeAncestors : function(rc)
    {
        var ancestors = [],
            parent;
        
        parent = this.getNodeParent(rc);
        while (parent) {
            ancestors.push(parent);
            parent = this.getNodeParent(parent);    
        }
        
        return ancestors;
    },
    
    // Public
    getNodeChildrenCount : function(rc)
    {
        return this.getNodeChildren(rc).length;
    },
    
    // Public
    getNodeNextSibling : function(rc)
    {
        var siblings,
            parent,
            index,
            result = null;
                
        parent = this.getNodeParent(rc);
        if (parent) {
            siblings = this.getNodeChildren(parent);
        }
        else {
            siblings = this.getRootNodes();
        }
        
        index = siblings.indexOf(rc);
        
        if (index < siblings.length - 1) {
            result = siblings[index + 1];
        }
        
        return result;
    },
    
    // Public
    getNodePrevSibling : function(rc)
    {
        var siblings,
            parent,
            index,
            result = null;
                
        parent = this.getNodeParent(rc);
        if (parent) {
            siblings = this.getNodeChildren(parent);
        }
        else {
            siblings = this.getRootNodes();
        }
        
        index = siblings.indexOf(rc);
        if (index > 0) {
            result = siblings[index - 1];
        }
        
        return result;
    },
    
    // Abstract tree support methods.
    // -----------------------------------------------------------------------------------------------
    
    // Public - Abstract
    getRootNodes : function()
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    getNodeDepth : function(rc)
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    getNodeParent : function(rc)
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    getNodeChildren : function(rc)
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    addToNode : function(parent, child)
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    removeFromNode : function(parent, child)
    {
        throw 'Abstract method call';
    },
    
    // Paging support methods.
    // -----------------------------------------------------------------------------------------------
    /**
     * Returns top level node page offset.
     *
     * @access public
     * @return {Integer}
     */
    getPageOffset : function()
    {
        return this.page_offset;
    },
    
    /**
     * Returns active node page offset.
     *
     * @access public
     * @return {Integer}
     */
    getActiveNodePageOffset : function()
    {
        var result;
        
        if (this.active_node) {
            result = this.getNodeChildrenOffset(this.active_node);
        }
        else {
            result = this.getPageOffset();
        }
        
        return result;
    },
    
    /**
     * Returns active node children count.
     *
     * @access public
     * @return {Integer}
     */
    getActiveNodeCount : function()
    {
        var result;
        
        if (this.active_node) {
            result = this.getNodeChildrenCount(this.active_node);
        }
        else {
            result = this.getRootNodes().length;
        }
        
        return result;
    },
    
    /**
     * Returns active node total children count.
     *
     * @access public
     * @return {Integer}
     */
    getActiveNodeTotalCount : function()
    {
        var result;
        
        if (this.active_node) {
            result = this.getNodeChildrenTotalCount(this.active_node);
        }
        else {
            result = this.getTotalCount();
        }
        
        return result;  
    }
});

/**
 * Tree store for adjacency list tree representation.
 */
Ext.ux.maximgb.tg.AdjacencyListStore = Ext.extend(Ext.ux.maximgb.tg.AbstractTreeStore,
{
    /**
     * @cfg {String} parent_id_field_name Record parent id field name.
     */
    parent_id_field_name : '_parent',
    
    getRootNodes : function()
    {
        var i, 
            len, 
            result = [], 
            records = this.data.getRange();
        
        for (i = 0, len = records.length; i < len; i++) {
            if (records[i].get(this.parent_id_field_name) == null) {
                result.push(records[i]);
            }
        }
        
        return result;
    },
    
    getNodeDepth : function(rc)
    {
        return this.getNodeAncestors(rc).length;
    },
    
    getNodeParent : function(rc)
    {
        return this.getById(rc.get(this.parent_id_field_name));
    },
    
    getNodeChildren : function(rc)
    {
        var i, 
            len, 
            result = [], 
            records = this.data.getRange();
        
        for (i = 0, len = records.length; i < len; i++) {
            if (records[i].get(this.parent_id_field_name) == rc.id) {
                result.push(records[i]);
            }
        }
        
        return result;
    },
    
    addToNode : function(parent, child)
    {
        child.set(this.parent_id_field_name, parent.id);
        this.addSorted(child);
    },
    
    removeFromNode : function(parent, child)
    {
        this.remove(child);
    }
});

Ext.reg('Ext.ux.maximgb.tg.AdjacencyListStore', Ext.ux.maximgb.tg.AdjacencyListStore);

/**
 * Tree store for nested set tree representation.
 */
Ext.ux.maximgb.tg.NestedSetStore = Ext.extend(Ext.ux.maximgb.tg.AbstractTreeStore,
{
    /**
     * @cfg {String} left_field_name Record NS-left bound field name.
     */
    left_field_name : '_lft',
    
    /**
     * @cfg {String} right_field_name Record NS-right bound field name.
     */
    right_field_name : '_rgt',
    
    /**
     * @cfg {String} level_field_name Record NS-level field name.
     */
    level_field_name : '_level',
    
    /**
     * @cfg {Number} root_node_level Root node level.
     */
    root_node_level : 1,
    
    getRootNodes : function()
    {
        var i, 
            len, 
            result = [], 
            records = this.data.getRange();
        
        for (i = 0, len = records.length; i < len; i++) {
            if (records[i].get(this.level_field_name) == this.root_node_level) {
                result.push(records[i]);
            }
        }
        
        return result;
    },
    
    getNodeDepth : function(rc)
    {
        return rc.get(this.level_field_name) - this.root_node_level;
    },
    
    getNodeParent : function(rc)
    {
        var result = null,
            rec, records = this.data.getRange(),
            i, len,
            lft, r_lft,
            rgt, r_rgt,
            level, r_level;
                
        lft = rc.get(this.left_field_name);
        rgt = rc.get(this.right_field_name);
        level = rc.get(this.level_field_name);
        
        for (i = 0, len = records.length; i < len; i++) {
            rec = records[i];
            r_lft = rec.get(this.left_field_name);
            r_rgt = rec.get(this.right_field_name);
            r_level = rec.get(this.level_field_name);
            
            if (
                r_level == level - 1 &&
                r_lft < lft &&
                r_rgt > rgt
            ) {
                result = rec;
                break;
            }
        }
        
        return result;
    },
    
    getNodeChildren : function(rc)
    {
        var lft, r_lft,
            rgt, r_rgt,
            level, r_level,
            records, rec,
            result = [];
                
        records = this.data.getRange();
        
        lft = rc.get(this.left_field_name);
        rgt = rc.get(this.right_field_name);
        level = rc.get(this.level_field_name);
        
        for (i = 0, len = records.length; i < len; i++) {
            rec = records[i];
            r_lft = rec.get(this.left_field_name);
            r_rgt = rec.get(this.right_field_name);
            r_level = rec.get(this.level_field_name);
            
            if (
                r_level == level + 1 &&
                r_lft > lft &&
                r_rgt < rgt
            ) {
                result.push(rec);
            }
        }
        
        return result;
    }
});

Ext.ux.maximgb.tg.GridView = Ext.extend(Ext.grid.GridView, 
{   
    expanded_icon_class : 'ux-maximgb-tg-elbow-minus',
    last_expanded_icon_class : 'ux-maximgb-tg-elbow-end-minus',
    collapsed_icon_class : 'ux-maximgb-tg-elbow-plus',
    last_collapsed_icon_class : 'ux-maximgb-tg-elbow-end-plus',
    skip_width_update_class: 'ux-maximgb-tg-skip-width-update',
    
    // private - overriden
    initTemplates : function()
    {
        var ts = this.templates || {};
        
        if (!ts.row) {
            ts.row = new Ext.Template(
                '<div class="x-grid3-row ux-maximgb-tg-level-{level} {alt}" style="{tstyle} {display_style}">',
                    '<table class="x-grid3-row-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
                        '<tbody>',
                            '<tr>{cells}</tr>',
                            (
                            this.enableRowBody ? 
                            '<tr class="x-grid3-row-body-tr" style="{bodyStyle}">' +
                                '<td colspan="{cols}" class="x-grid3-body-cell" tabIndex="0" hidefocus="on">'+
                                    '<div class="x-grid3-row-body">{body}</div>'+
                                '</td>'+
                            '</tr>' 
                                : 
                            ''
                            ),
                        '</tbody>',
                    '</table>',
                '</div>'
            );
        }
        
        if (!ts.mastercell) {
            ts.mastercell = new Ext.Template(
                '<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} {css}" style="{style}" tabIndex="0" {cellAttr}>',
                    '<div class="ux-maximgb-tg-mastercell-wrap">', // This is for editor to place itself right
                        '{treeui}',
                        '<div class="x-grid3-cell-inner x-grid3-col-{id}" unselectable="on" {attr}>{value}</div>',
                    '</div>',
                '</td>'
            );
        }
        
        if (!ts.treeui) {
            ts.treeui = new Ext.Template(
                '<div class="ux-maximgb-tg-uiwrap" style="width: {wrap_width}px">',
                    '{elbow_line}',
                    '<div style="left: {left}px" class="{cls}">&#160;</div>',
                '</div>'
            );
        }
        
        if (!ts.elbow_line) {
            ts.elbow_line = new Ext.Template(
                '<div style="left: {left}px" class="{cls}">&#160;</div>'
            );
        }
        
        this.templates = ts;
        Ext.ux.maximgb.tg.GridView.superclass.initTemplates.call(this);
    },
    
    // Private - Overriden
    doRender : function(cs, rs, ds, startRow, colCount, stripe)
    {
        var ts = this.templates, ct = ts.cell, rt = ts.row, last = colCount-1;
        var tstyle = 'width:'+this.getTotalWidth()+';';
        // buffers
        var buf = [], cb, c, p = {}, rp = {tstyle: tstyle}, r;
        for (var j = 0, len = rs.length; j < len; j++) {
            r = rs[j]; cb = [];
            var rowIndex = (j+startRow);
            
            var row_render_res = this.renderRow(r, rowIndex, colCount, ds, this.cm.getTotalWidth());
            
            if (row_render_res === false) {
                for (var i = 0; i < colCount; i++) {
                    c = cs[i];
                    p.id = c.id;
                    p.css = i == 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
                    p.attr = p.cellAttr = "";
                    p.value = c.renderer.call(c.scope, r.data[c.name], p, r, rowIndex, i, ds);                              
                    p.style = c.style;
                    if(Ext.isEmpty(p.value)){
                        p.value = "&#160;";
                    }
                    if(this.markDirty && r.dirty && typeof r.modified[c.name] !== 'undefined'){
                        p.css += ' x-grid3-dirty-cell';
                    }
                    // ----- Modification start
                    if (c.id == this.grid.master_column_id) {
                        p.treeui = this.renderCellTreeUI(r, ds);
                        ct = ts.mastercell;
                    }
                    else {
                        ct = ts.cell;
                    }
                    // ----- End of modification
                    cb[cb.length] = ct.apply(p);
                }
            }
            else {
                cb.push(row_render_res);
            }
            
            var alt = [];
            if (stripe && ((rowIndex+1) % 2 == 0)) {
                alt[0] = "x-grid3-row-alt";
            }
            if (r.dirty) {
                alt[1] = " x-grid3-dirty-row";
            }
            rp.cols = colCount;
            if(this.getRowClass){
                alt[2] = this.getRowClass(r, rowIndex, rp, ds);
            }
            rp.alt = alt.join(" ");
            rp.cells = cb.join("");
            // ----- Modification start
            if (!ds.isVisibleNode(r)) {
                rp.display_style = 'display: none;';
            }
            else {
                rp.display_style = '';
            }
            rp.level = ds.getNodeDepth(r);
            // ----- End of modification
            buf[buf.length] =  rt.apply(rp);
        }
        return buf.join("");
    },
  
    renderCellTreeUI : function(record, store)
    {
        var tpl = this.templates.treeui,
            line_tpl = this.templates.elbow_line,
            tpl_data = {},
            rec, parent,
            depth = level = store.getNodeDepth(record);
        
        tpl_data.wrap_width = (depth + 1) * 16; 
        if (level > 0) {
            tpl_data.elbow_line = '';
            rec = record;
            left = 0;
            while(level--) {
                parent = store.getNodeParent(rec);
                if (parent) {
                    if (store.hasNextSiblingNode(parent)) {
                        tpl_data.elbow_line = 
                            line_tpl.apply({
                                left : level * 16, 
                                cls : 'ux-maximgb-tg-elbow-line'
                            }) + 
                            tpl_data.elbow_line;
                    }
                    else {
                        tpl_data.elbow_line = 
                            line_tpl.apply({
                                left : level * 16,
                                cls : 'ux-maximgb-tg-elbow-empty'
                            }) +
                            tpl_data.elbow_line;
                    }
                }
                else {
                    throw [
                        "Tree inconsistency can't get level ",
                        level + 1,
                        " node(id=", rec.id, ") parent."
                    ].join("");
                }
                rec = parent;
            }
        }
        if (store.isLeafNode(record)) {
            if (store.hasNextSiblingNode(record)) {
                tpl_data.cls = 'ux-maximgb-tg-elbow';
            }
            else {
                tpl_data.cls = 'ux-maximgb-tg-elbow-end';
            }
        }
        else {
            tpl_data.cls = 'ux-maximgb-tg-elbow-active ';
            if (store.isExpandedNode(record)) {
                if (store.hasNextSiblingNode(record)) {
                    tpl_data.cls += this.expanded_icon_class;
                }
                else {
                    tpl_data.cls += this.last_expanded_icon_class;
                }
            }
            else {
                if (store.hasNextSiblingNode(record)) {
                    tpl_data.cls += this.collapsed_icon_class;
                }
                else {
                    tpl_data.cls += this.last_collapsed_icon_class;
                }
            }
        }
        tpl_data.left = 1 + depth * 16;
            
        return tpl.apply(tpl_data);
    },
    
    // Template method
    renderRow : function(record, index, col_count, ds, total_width)
    {
        return false;
    },
    
    // private - overriden
    afterRender : function()
    {
        Ext.ux.maximgb.tg.GridView.superclass.afterRender.call(this);
        this.updateAllColumnWidths();
    },
    
    // private - overriden to support missing column td's case, if row is rendered by renderRow() 
    // method.
    updateAllColumnWidths : function()
    {
        var tw = this.getTotalWidth(),
        clen = this.cm.getColumnCount(),
        ws = [],
        len,
        i;
        for(i = 0; i < clen; i++){
            ws[i] = this.getColumnWidth(i);
        }
        this.innerHd.firstChild.style.width = this.getOffsetWidth();
        this.innerHd.firstChild.firstChild.style.width = tw;
        this.mainBody.dom.style.width = tw;
        for(i = 0; i < clen; i++){
            var hd = this.getHeaderCell(i);
            hd.style.width = ws[i];
        }
    
        var ns = this.getRows(), row, trow;
        for(i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = tw;
            if(row.firstChild){
                row.firstChild.style.width = tw;
                trow = row.firstChild.rows[0];
                for (var j = 0; j < clen && j < trow.childNodes.length; j++) {
                    if (!Ext.fly(trow.childNodes[j]).hasClass(this.skip_width_update_class)) {
                        trow.childNodes[j].style.width = ws[j];
                    }
                }
            }
        }
    
        this.onAllColumnWidthsUpdated(ws, tw);
    },

    // private - overriden to support missing column td's case, if row is rendered by renderRow() 
    // method.
    updateColumnWidth : function(col, width)
    {
        var w = this.getColumnWidth(col);
        var tw = this.getTotalWidth();
        this.innerHd.firstChild.style.width = this.getOffsetWidth();
        this.innerHd.firstChild.firstChild.style.width = tw;
        this.mainBody.dom.style.width = tw;
        var hd = this.getHeaderCell(col);
        hd.style.width = w;

        var ns = this.getRows(), row;
        for(var i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = tw;
            if(row.firstChild){
                row.firstChild.style.width = tw;
                if (col < row.firstChild.rows[0].childNodes.length) {
                    if (!Ext.fly(row.firstChild.rows[0].childNodes[col]).hasClass(this.skip_width_update_class)) {
                        row.firstChild.rows[0].childNodes[col].style.width = w;
                    }
                }
            }
        }

        this.onColumnWidthUpdated(col, w, tw);
    },

    // private - overriden to support missing column td's case, if row is rendered by renderRow() 
    // method.
    updateColumnHidden : function(col, hidden)
    {
        var tw = this.getTotalWidth();
        this.innerHd.firstChild.style.width = this.getOffsetWidth();
        this.innerHd.firstChild.firstChild.style.width = tw;
        this.mainBody.dom.style.width = tw;
        var display = hidden ? 'none' : '';

        var hd = this.getHeaderCell(col);
        hd.style.display = display;

        var ns = this.getRows(), row, cell;
        for(var i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = tw;
            if(row.firstChild){
                row.firstChild.style.width = tw;
                if (col < row.firstChild.rows[0].childNodes.length) {
                    if (!Ext.fly(row.firstChild.rows[0].childNodes[col]).hasClass(this.skip_width_update_class)) {
                        row.firstChild.rows[0].childNodes[col].style.display = display;
                    }
                }
            }
        }

        this.onColumnHiddenUpdated(col, hidden, tw);
        delete this.lastViewWidth; // force recalc
        this.layout();
    },
    
    // private - overriden to skip hidden rows processing.
    processRows : function(startRow, skipStripe)
    {
        var processed_cnt = 0;
        
        if(this.ds.getCount() < 1){
            return;
        }
        skipStripe = !this.grid.stripeRows; //skipStripe || !this.grid.stripeRows;
        startRow = startRow || 0;
        var rows = this.getRows();
        var processed_cnt = 0;
        
        Ext.each(rows, function(row, idx){
            row.rowIndex = idx;
            row.className = row.className.replace(this.rowClsRe, ' ');
            if (row.style.display != 'none') {
                if (!skipStripe && ((processed_cnt + 1) % 2 === 0)) {
                    row.className += ' x-grid3-row-alt';
                }
                processed_cnt++;
            }
        }, this);
        
        Ext.fly(rows[0]).addClass(this.firstRowCls);
        Ext.fly(rows[rows.length - 1]).addClass(this.lastRowCls);
    },
    
    ensureVisible : function(row, col, hscroll)
    {
        var ancestors, record = this.ds.getAt(row);
        
        if (!this.ds.isVisibleNode(record)) {
            ancestors = this.ds.getNodeAncestors(record);
            while (ancestors.length > 0) {
                record = ancestors.shift();
                if (!this.ds.isExpandedNode(record)) {
                    this.ds.expandNode(record);
                }
            }
        }
        
        return Ext.ux.maximgb.tg.GridView.superclass.ensureVisible.call(this, row, col, hscroll);
    },
    
    // Private
    expandRow : function(record, skip_process)
    {
        var ds = this.ds,
            i, len, row, pmel, children, index, child_index;
        
        if (typeof record == 'number') {
            index = record;
            record = ds.getAt(index);
        }
        else {
            index = ds.indexOf(record);
        }
        
        skip_process = skip_process || false;
        
        row = this.getRow(index);
        pmel = Ext.fly(row).child('.ux-maximgb-tg-elbow-active');
        if (pmel) {
            if (ds.hasNextSiblingNode(record)) {
                pmel.removeClass(this.collapsed_icon_class);
                pmel.removeClass(this.last_collapsed_icon_class);
                pmel.addClass(this.expanded_icon_class);
            }
            else {
                pmel.removeClass(this.collapsed_icon_class);
                pmel.removeClass(this.last_collapsed_icon_class);
                pmel.addClass(this.last_expanded_icon_class);
            }
        }
        if (ds.isVisibleNode(record)) {
            children = ds.getNodeChildren(record);
            for (i = 0, len = children.length; i < len; i++) {
                child_index = ds.indexOf(children[i]);
                row = this.getRow(child_index);
                row.style.display = 'block';
                if (ds.isExpandedNode(children[i])) {
                    this.expandRow(child_index, true);
                }
            }
        }
        if (!skip_process) {
            this.processRows(0);
        }
        //this.updateAllColumnWidths();
    },
    
    collapseRow : function(record, skip_process)
    {
        var ds = this.ds,
            i, len, children, row, index, child_index;
                
        if (typeof record == 'number') {
            index = record;
            record = ds.getAt(index);
        }
        else {
            index = ds.indexOf(record);
        }
        
        skip_process = skip_process || false;
        
        row = this.getRow(index);
        pmel = Ext.fly(row).child('.ux-maximgb-tg-elbow-active');
        if (pmel) {
            if (ds.hasNextSiblingNode(record)) {
                pmel.removeClass(this.expanded_icon_class);
                pmel.removeClass(this.last_expanded_icon_class);
                pmel.addClass(this.collapsed_icon_class);
            }
            else {
                pmel.removeClass(this.expanded_icon_class);
                pmel.removeClass(this.last_expanded_icon_class);
                pmel.addClass(this.last_collapsed_icon_class);
            }
        }
        children = ds.getNodeChildren(record);
        for (i = 0, len = children.length; i < len; i++) {
            child_index = ds.indexOf(children[i]);
            row = this.getRow(child_index);
            if (row.style.display != 'none') {
                row.style.display = 'none'; 
                this.collapseRow(child_index, true);
            }
        }
        if (!skip_process) {
            this.processRows(0);
        }
        //this.updateAllColumnWidths();
    },
    
    /**
     * @access private
     */
    initData : function(ds, cm)
    {
        Ext.ux.maximgb.tg.GridView.superclass.initData.call(this, ds, cm);
        if (this.ds) {
            this.ds.un('expandnode', this.onStoreExpandNode, this);
            this.ds.un('collapsenode', this.onStoreCollapseNode, this);
        }
        if (ds) {
            ds.on('expandnode', this.onStoreExpandNode, this);
            ds.on('collapsenode', this.onStoreCollapseNode, this);
        }
    },
    
    onLoad : function(store, records, options)
    {
        var ridx;
        
        if (
            options && 
            options.params && 
            (
                options.params[store.paramNames.active_node] === null ||
                store.indexOfId(options.params[store.paramNames.active_node]) == -1
            )
        ) {
            Ext.ux.maximgb.tg.GridView.superclass.onLoad.call(this, store, records, options);
        }
    },
    
    onAdd : function(ds, records, index)
    {
        Ext.ux.maximgb.tg.GridView.superclass.onAdd.call(this, ds, records, index);
        if (this.mainWrap) {
           //this.updateAllColumnWidths();
           this.processRows(0);
        }
    },
    
    onRemove : function(ds, record, index, isUpdate)
    {
        Ext.ux.maximgb.tg.GridView.superclass.onRemove.call(this, ds, record, index, isUpdate);
        if(isUpdate !== true){
            if (this.mainWrap) {
                //this.updateAllColumnWidths();
                this.processRows(0);
            }
        }
    },
    
    onUpdate : function(ds, record)
    {
        Ext.ux.maximgb.tg.GridView.superclass.onUpdate.call(this, ds, record);
        if (this.mainWrap) {
            //this.updateAllColumnWidths();
            this.processRows(0);
        }
    },
    
    onStoreExpandNode : function(store, rc)
    {
        this.expandRow(rc);
    },
    
    onStoreCollapseNode : function(store, rc)
    {
        this.collapseRow(rc);
    }
});

Ext.ux.maximgb.tg.GridPanel = Ext.extend(Ext.m3.GridPanel, 
{
    /**
     * @cfg {String|Integer} master_column_id Master column id. Master column cells are nested.
     * Master column cell values are used to build breadcrumbs.
     */
    master_column_id : 0,
    
    /**
     * @cfg {Stirng} TreeGrid panel custom class.
     */
    tg_cls : 'ux-maximgb-tg-panel',
	
    // Private
    initComponent : function()
    {
        this.initComponentPreOverride();
        Ext.ux.maximgb.tg.GridPanel.superclass.initComponent.call(this);
        this.getSelectionModel().on('selectionchange', this.onTreeGridSelectionChange, this);
        this.initComponentPostOverride();
    },
    
    initComponentPreOverride : Ext.emptyFn,
    
    initComponentPostOverride : Ext.emptyFn,
    
    // Private
    onRender : function(ct, position)
    {
        Ext.ux.maximgb.tg.GridPanel.superclass.onRender.call(this, ct, position);
        this.el.addClass(this.tg_cls);
    },

    /**
     * Returns view instance.
     *
     * @access private
     * @return {GridView}
     */
    getView : function()
    {
        if (!this.view) {
            this.view = new Ext.ux.maximgb.tg.GridView(this.viewConfig);
        }
        return this.view;
    },
    
    /**
     * @access private
     */
    onClick : function(e)
    {
        var target = e.getTarget(),
            view = this.getView(),
            row = view.findRowIndex(target),
            store = this.getStore(),
            sm = this.getSelectionModel(), 
            record, record_id, do_default = true;
        
        // Row click
        if (row !== false) {
            if (Ext.fly(target).hasClass('ux-maximgb-tg-elbow-active')) {
                record = store.getAt(row);
                if (store.isExpandedNode(record)) {
                    store.collapseNode(record);
                }
                else {
                    store.expandNode(record);
                }
                do_default = false;
            }
        }

        if (do_default) {
            Ext.ux.maximgb.tg.GridPanel.superclass.onClick.call(this, e);
        }
    },

    /**
     * @access private
     */
    onMouseDown : function(e)
    {
        var target = e.getTarget();

        if (!Ext.fly(target).hasClass('ux-maximgb-tg-elbow-active')) {
            Ext.ux.maximgb.tg.GridPanel.superclass.onMouseDown.call(this, e);
        }
    },
    
    /**
     * @access private
     */
    onTreeGridSelectionChange : function(sm, selection)
    {
        var record, ancestors, store = this.getStore();
        // Row selection model
        if (sm.getSelected) {
            record = sm.getSelected();
            store.setActiveNode(record);
        }
        // Cell selection model
        else if (sm.getSelectedCell && selection) {
            record = selection.record;
            store.setActiveNode(record);
        }

        // Ensuring that selected node is visible.
        if (record) {
            if (!store.isVisibleNode(record)) {
                ancestors = store.getNodeAncestors(record);
                while (ancestors.length > 0) {
                    store.expandNode(ancestors.pop());
                }
            }
        }
    }
});

Ext.ux.maximgb.tg.EditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel, 
{
    /**
     * @cfg {String|Integer} master_column_id Master column id. Master column cells are nested.
     * Master column cell values are used to build breadcrumbs.
     */
    master_column_id : 0,

    // Private
    initComponent : function()
    {
        this.initComponentPreOverride();
    
        Ext.ux.maximgb.tg.EditorGridPanel.superclass.initComponent.call(this);
        
        this.getSelectionModel().on(
            'selectionchange',
            this.onTreeGridSelectionChange,
            this
        );
        
        this.initComponentPostOverride();
    },
    
    initComponentPreOverride : Ext.emptyFn,
    
    initComponentPostOverride : Ext.emptyFn,
    
    // Private
    onRender : function(ct, position)
    {
        Ext.ux.maximgb.tg.EditorGridPanel.superclass.onRender.call(this, ct, position);
        this.el.addClass('ux-maximgb-tg-panel');
    },

    /**
     * Returns view instance.
     *
     * @access private
     * @return {GridView}
     */
    getView : function()
    {
        if (!this.view) {
            this.view = new Ext.ux.maximgb.tg.GridView(this.viewConfig);
        }
        return this.view;
    },
    
    /**
     * @access private
     */
    onClick : function(e)
    {
        var target = e.getTarget(),
            view = this.getView(),
            row = view.findRowIndex(target),
            store = this.getStore(),
            sm = this.getSelectionModel(), 
            record, record_id, do_default = true;
        
        // Row click
        if (row !== false) {
            if (Ext.fly(target).hasClass('ux-maximgb-tg-elbow-active')) {
                record = store.getAt(row);
                if (store.isExpandedNode(record)) {
                    store.collapseNode(record);
                }
                else {
                    store.expandNode(record);
                }
                do_default = false;
            }
        }

        if (do_default) {
            Ext.ux.maximgb.tg.EditorGridPanel.superclass.onClick.call(this, e);
        }
    },

    /**
     * @access private
     */
    onMouseDown : function(e)
    {
        var target = e.getTarget();

        if (!Ext.fly(target).hasClass('ux-maximgb-tg-elbow-active')) {
            Ext.ux.maximgb.tg.EditorGridPanel.superclass.onMouseDown.call(this, e);
        }
    },
    
    /**
     * @access private
     */
    onTreeGridSelectionChange : function(sm, selection)
    {
        var record, ancestors, store = this.getStore();
        // Row selection model
        if (sm.getSelected) {
            record = sm.getSelected();
            store.setActiveNode(record);
        }
        // Cell selection model
        else if (sm.getSelectedCell && selection) {
            record = selection.record;
            store.setActiveNode(record);
        }

        // Ensuring that selected node is visible.
        if (record) {
            if (!store.isVisibleNode(record)) {
                ancestors = store.getNodeAncestors(record);
                while (ancestors.length > 0) {
                    store.expandNode(ancestors.pop());
                }
            }
        }
    }
});

/**
 * Paging toolbar for work this AbstractTreeStore.
 */
Ext.ux.maximgb.tg.PagingToolbar = Ext.extend(Ext.PagingToolbar,
{
    onRender : function(ct, position)
    {
        Ext.ux.maximgb.tg.PagingToolbar.superclass.onRender.call(this, ct, position);
        this.updateUI();
    },

    getPageData : function()
    {
        var total = 0, cursor = 0;
        if (this.store) {
            cursor = this.store.getActiveNodePageOffset();
            total = this.store.getActiveNodeTotalCount();
        }
        return {
            total : total,
            activePage : Math.ceil((cursor + this.pageSize) / this.pageSize),
            pages :  total < this.pageSize ? 1 : Math.ceil(total / this.pageSize)
        };
    },
    
    updateInfo : function()
    {
        var count = 0, cursor = 0, total = 0, msg;
        if (this.displayItem) {
            if (this.store) {
                cursor = this.store.getActiveNodePageOffset();
                count = this.store.getActiveNodeCount();
                total = this.store.getActiveNodeTotalCount();
            }
            msg = count == 0 ?
                this.emptyMsg 
                    :
                String.format(
                    this.displayMsg,
                    cursor + 1, cursor + count, total
                );
            this.displayItem.setText(msg);
        }
    },
    
    updateUI : function()
    {
        var d = this.getPageData(), ap = d.activePage, ps = d.pages;
        
        this.afterTextItem.setText(String.format(this.afterPageText, d.pages));
        this.inputItem.setValue(ap);
        
        this.first.setDisabled(ap == 1);
        this.prev.setDisabled(ap == 1);
        this.next.setDisabled(ap == ps);
        this.last.setDisabled(ap == ps);
        this.refresh.enable();
        this.updateInfo();
    },
    
    bindStore : function(store, initial)
    {
        if (!initial && this.store) {
            this.store.un('activenodechange', this.onStoreActiveNodeChange, this);
        }
        if (store) {
            store.on('activenodechange', this.onStoreActiveNodeChange, this);
        }
        Ext.ux.maximgb.tg.PagingToolbar.superclass.bindStore.call(this, store, initial);
    },
    
    beforeLoad : function(store, options)
    {
        var paramNames = this.getParams();
        
        Ext.ux.maximgb.tg.PagingToolbar.superclass.beforeLoad.call(this, store, options);
        
        if (options && options.params) {
            if(options.params[paramNames.start] === undefined) {
                options.params[paramNames.start] = 0;
            }
            if(options.params[paramNames.limit] === undefined) {
                options.params[paramNames.limit] = this.pageSize;
            }
        }
    },
    
    /**
     * Move to the first page, has the same effect as clicking the 'first' button.
     */
    moveFirst : function()
    {
        this.doLoad(0);
    },

    /**
     * Move to the previous page, has the same effect as clicking the 'previous' button.
     */
    movePrevious : function()
    {
        var store = this.store,
            cursor = store ? store.getActiveNodePageOffset() : 0;
            
        this.doLoad(Math.max(0, cursor - this.pageSize));
    },

    /**
     * Move to the next page, has the same effect as clicking the 'next' button.
     */
    moveNext : function()
    {
        var store = this.store,
            cursor = store ? store.getActiveNodePageOffset() : 0;
            
        this.doLoad(cursor + this.pageSize);
    },

    /**
     * Move to the last page, has the same effect as clicking the 'last' button.
     */
    moveLast : function()
    {
        var store = this.store,
            cursor = store ? store.getActiveNodePageOffset() : 0,
            total = store ? store.getActiveNodeTotalCount() : 0,
            extra = total % this.pageSize;

        this.doLoad(extra ? (total - extra) : total - this.pageSize);
    },
    
    onStoreActiveNodeChange : function(store, old_rec, new_rec)
    {
        if (this.rendered) {
            this.updateUI();
        }
    }
});

Ext.reg('Ext.ux.maximgb.tg.GridPanel', Ext.ux.maximgb.tg.GridPanel);
Ext.reg('Ext.ux.maximgb.tg.EditorGridPanel', Ext.ux.maximgb.tg.EditorGridPanel);
Ext.reg('Ext.ux.maximgb.tg.PagingToolbar', Ext.ux.maximgb.tg.PagingToolbar);


/**
 * Окно на базе Ext.Window
 */

Ext.m3.Window = Ext.extend(Ext.Window, {
	constructor: function(baseConfig, params){

		// Ссылка на родительское окно
		this.parentWindow = null;
		
		// Контекст
		this.actionContextJson = null;
		
		if (params && params.parentWindowID) {
			this.parentWindow = Ext.getCmp(params.parentWindowID);
		}
		
        if (params && params.helpTopic) {
            this.m3HelpTopic = params.helpTopic;
        }
    
		if (params && params.contextJson){
			this.actionContextJson = params.contextJson;
		}
    
        // на F1 что-то нормально не вешается обработчик..
        //this.keys = {key: 112, fn: function(k,e){e.stopEvent();console.log('f1 pressed');}}
    
		Ext.m3.Window.superclass.constructor.call(this, baseConfig);
	},
    initTools: function(){
        if (this.m3HelpTopic){
            var m3HelpTopic = this.m3HelpTopic;
            this.addTool({id: 'help', handler:function(){ showHelpWindow(m3HelpTopic);}});
        }
        Ext.m3.Window.superclass.initTools.call(this);
    }
})



/**
 * Расширенное дерево на базе Ext.ux.maximgb.tg.GridPanel
 * http://www.sencha.com/forum/showthread.php?76331-TreeGrid-%28Ext.ux.maximgb.tg%29-a-tree-grid-component-based-on-Ext-s-native-grid.
 * http://max-bazhenov.com/dev/ux.maximgb.tg/index.php
 * @param {Object} config
 */
Ext.m3.AdvancedTreeGrid = Ext.extend(Ext.ux.maximgb.tg.GridPanel, {
	constructor: function(baseConfig, params){

		// Проверки значений
		assert(params.storeParams.url, "Некорректо задано url. \
			url=" + params.storeParams.url);

		// Заполнение Store
		var columnsToRecord = params.columnsToRecord || [];
		columnsToRecord.push(
			{name: '_id', type: 'int'}
			,{name: '_level', type: 'int'}
			,{name: '_lft', type: 'int'}
			,{name: '_rgt', type: 'int'}
			,{name: '_is_leaf', type: 'bool'}
			,{name: '_parent', type: 'int'}
		);
		
		var store = new Ext.ux.maximgb.tg.AdjacencyListStore({
			autoLoad : true,
			url: params.storeParams.url,
			reader: new Ext.data.JsonReader({
					id: '_id',
					root: params.storeParams.root,
					totalProperty: 'total',
					successProperty: 'success'
				}, 
				Ext.data.Record.create(columnsToRecord)
			)
		});
		
		var botom_bar;
		if (params.bbar) {
			botom_bar = new Ext.ux.maximgb.tg.PagingToolbar({
				store: store
				,displayInfo:true
				,pageSize: params.bbar.pageSize
			});
		}
		
		var config = Ext.applyIf({
			store: store 
			,bbar: botom_bar
		}, baseConfig);
		
		Ext.m3.AdvancedTreeGrid.superclass.constructor.call(this, config, params);
	}
});


/**
 * Панель редактирования адреса
 */
Ext.m3.AddrField = Ext.extend(Ext.Container, {
	constructor: function(baseConfig, params){
		
		var items = params.items || [];
		
		var place_store = new Ext.data.JsonStore({
			url: params.kladr_url,
			idProperty: 'code',
			root: 'rows',
			totalProperty: 'total',
			fields: [{name: 'code'},
				{name: 'display_name'},
				{name: 'socr'},
				{name: 'zipcode'},
				{name: 'gni'},
				{name: 'uno'},
				{name: 'okato'},
				{name: 'addr_name'}
			]
		});
		if (params.place_record != '' && params.place_record != undefined) {
			var rec = Ext.util.JSON.decode(params.place_record);
    		place_store.loadData({total:1, rows:[rec]});
		}
		if (params.read_only) 
			var field_cls = 'm3-grey-field' 
		else
			var field_cls = ''
		this.place = new Ext.form.ComboBox({
			name: params.place_field_name,
			fieldLabel: params.place_label,
			allowBlank: params.place_allow_blank,
            readOnly: params.read_only,
            cls: field_cls,
			hideTrigger: true,
			minChars: 2,
			emptyText: 'Введите населенный пункт...',
			queryParam: 'filter',
			store: place_store,
			resizable: true,
			displayField: 'display_name',
			valueField: 'code',
			mode: 'remote',
			hiddenName: params.place_field_name,
			valueNotFoundText: '',
            invalidClass: params.invalid_class
		});		
		this.place.setValue(params.place_value);
		
        this.zipcode = new Ext.form.TextField({
            name: params.zipcode_field_name,
            value: params.zipcode_value,
            emptyText: 'индекс',
            readOnly: params.read_only,
            cls: field_cls,
            width: 55,
            maskRe: /[0-9]/
        });
		
		if (params.level > 1) {
			var street_store = new Ext.data.JsonStore({
				url: params.street_url,
				idProperty: 'code',
				root: 'rows',
				totalProperty: 'total',
				fields: [{name: 'code'},
					{name: 'display_name'},
					{name: 'socr'},
					{name: 'zipcode'},
					{name: 'gni'},
					{name: 'uno'},
					{name: 'okato'},
					{name: 'name'}
				]
			});
			if (params.street_record != '' && params.street_record != undefined) {
				var rec = Ext.util.JSON.decode(params.street_record);
				street_store.loadData({total:1, rows:[rec]});
			}
			this.street = new Ext.form.ComboBox({
				name: params.street_field_name,
				fieldLabel: params.street_label,
				allowBlank: params.street_allow_blank,
                readOnly: params.read_only,
                cls: field_cls,
				hideTrigger: true,
				minChars: 2,
				emptyText: 'Введите улицу...',
				queryParam: 'filter',
				store: street_store,
				resizable: true,
				displayField: 'display_name',
				valueField: 'code',
				mode: 'remote',
				hiddenName: params.street_field_name,
                valueNotFoundText: '',
                invalidClass: params.invalid_class
			});
			this.street.setValue(params.street_value);
			
			if (params.level > 2) {
				this.house = new Ext.form.TextField({
					name: params.house_field_name,
                    allowBlank: params.house_allow_blank,
                    readOnly: params.read_only,
                    cls: field_cls,
					fieldLabel: params.house_label,
					value: params.house_value,
					emptyText: '',
					width: 40,
                    invalidClass: params.invalid_class
				});
				if (params.use_corps) {
					this.corps = new Ext.form.TextField({
						name: params.corps_field_name,
						allowBlank: params.corps_allow_blank,
						readOnly: params.read_only,
						cls: field_cls,
						fieldLabel: params.corps_label,
						value: params.corps_value,
						emptyText: '',
						width: 40,
						invalidClass: params.invalid_class
					});
				}
				if (params.level > 3) {
					this.flat = new Ext.form.TextField({
						name: params.flat_field_name,
						fieldLabel: params.flat_label,
						value: params.flat_value,
                        allowBlank: params.flat_allow_blank,
                        readOnly: params.read_only,
                        cls: field_cls,
						emptyText: '',
						width: 40,
                        invalidClass: params.invalid_class
					});
				}
			}
		}
		if (params.addr_visible) {
			this.addr = new Ext.form.TextArea({
				name: params.addr_field_name,
				anchor: '100%',
				fieldLabel: params.addr_label,
				value: params.addr_value,
				readOnly: true,
				cls: field_cls,
				height: 36
			});
		}
		if (params.view_mode == 1){
			// В одну строку
			this.place.flex = 1;
			if (params.level > 2) {
    			var row_items = [this.place, this.zipcode];
    		} else {
	    		var row_items = [this.place];
	    	}
	    		
			if (params.level > 1) {
				this.street.flex = 1;
				this.street.fieldLabel = params.street_label;
				row_items.push({
						xtype: 'label'
						,style: {padding:'3px'}
    					,text: params.street_label+':'
					}
					, this.street
				);
				if (params.level > 2) {
					this.house.fieldLabel = params.house_label;
					row_items.push({
							xtype: 'label'
							,style: {padding:'3px'}
	    					,text: params.house_label+':'
						}
						, this.house
					);
					if (params.use_corps) {
						this.corps.fieldLabel = params.corps_label;
						row_items.push({
								xtype: 'label'
								,style: {padding:'3px'}
								,text: params.corps_label+':'
							}
							, this.corps
						);
					}
					if (params.level > 3) {
						this.flat.fieldLabel = params.flat_label;
						row_items.push({
								xtype: 'label'
								,style: {padding:'3px'}
		    					,text: params.flat_label+':'
							}
							, this.flat
						);
					}
				}
			}
			var row = {
				xtype: 'compositefield'
				, anchor: '100%'
				, fieldLabel: params.place_label
				, items: row_items
                , invalidClass: params.invalid_composite_field_class

			};
			items.push(row);
			if (params.addr_visible) {
				items.push(this.addr);
			}
		}
		if (params.view_mode == 2){
			// В две строки
			if (params.level > 2) {
			    this.place.flex = 1;
			    var row = {
				    xtype: 'compositefield'
				    , anchor: '100%'
				    , fieldLabel: params.place_label
				    , items: [this.place, this.zipcode]
                    , invalidClass: params.invalid_composite_field_class
			    };
			    items.push(row);
			} else {
			    this.place.anchor = '100%';
			    items.push(this.place);
			}
			if (params.level > 1) {
				this.street.flex = 1;
				var row_items = [this.street];
				if (params.level > 2) {
					this.house.fieldLabel = params.house_label;
					row_items.push({
							xtype: 'label'
							,style: {padding:'3px'}
	    					,text: params.house_label+':'
						}
						, this.house
					);
					if (params.use_corps) {
						this.corps.fieldLabel = params.corps_label;
						row_items.push({
								xtype: 'label'
								,style: {padding:'3px'}
								,text: params.corps_label+':'
							}
							, this.corps
						);
					}
					if (params.level > 3) {
						this.flat.fieldLabel = params.flat_label;
						row_items.push({
								xtype: 'label'
								,style: {padding:'3px'}
		    					,text: params.flat_label+':'
							}
							, this.flat
						);
					}
				}
				var row = {
					xtype: 'compositefield'
					, anchor: '100%'
					, fieldLabel: params.street_label
					, items: row_items
                    , invalidClass: params.invalid_composite_field_class
				};
				items.push(row);
			}
			if (params.addr_visible) {
				items.push(this.addr);
			}
		}
		if (params.view_mode == 3){
			// В три строки
			if (params.level > 2) {
			    this.place.flex = 1;
			    var row = {
				    xtype: 'compositefield'
				    , anchor: '100%'
				    , fieldLabel: params.place_label
				    , items: [this.place, this.zipcode]
                    , invalidClass: params.invalid_composite_field_class
			    };
			    items.push(row);
			} else {
			    this.place.anchor = '100%';
			    items.push(this.place);
			}
			if (params.level > 1) {
				this.street.anchor = '100%';
				items.push(this.street);
				if (params.level > 2) {
					var row_items = [{
						xtype: 'container'
						, layout: 'form'
						, items: this.house
                        , style: {overflow: 'hidden'}
					}];
					if (params.use_corps) {
						row_items.push({
							xtype: 'container'
							, layout: 'form'
							, items: this.corps
							, style: {overflow: 'hidden'}
						});
					}
					if (params.level > 3) {
						row_items.push({
							xtype: 'container'
							, layout: 'form'
							, style: {padding: '0px 0px 0px 5px', overflow: 'hidden'}
							, items: this.flat
						});
					}
					var row = new Ext.Container({
						anchor: '100%'
						, layout: 'column'
						, items: row_items
                        , style: {overflow: 'hidden'}
					});
					items.push(row);
				}
			}
			if (params.addr_visible) {
				items.push(this.addr);
			}
		}
						
		var config = Ext.applyIf({
			items: items
			, get_addr_url: params.get_addr_url
			, level: params.level
			, use_corps: params.use_corps
			, addr_visible: params.addr_visible
			, style: {overflow: 'hidden'}
		}, baseConfig);
		
		Ext.Container.superclass.constructor.call(this, config);
	}
	, beforeStreetQuery: function(qe) {
		this.street.getStore().baseParams.place_code = this.place.value;		
	}
	, clearStreet: function() {		
    	this.street.setValue('');		
	}
    , afterRenderAddr: function(){
        //вашем обработчик dbl click через DOM елемент
        if (this.addr_visible) {
            this.addr.getEl().on('dblclick', this.onDblClickAddr, this)
        }
    }

	, initComponent: function(){
		Ext.m3.AddrField.superclass.initComponent.call(this);		
		this.mon(this.place, 'change', this.onChangePlace, this);
		if (this.level > 1) {
			this.mon(this.street, 'change', this.onChangeStreet, this);
			if (this.level > 2) {
				this.mon(this.house, 'change', this.onChangeHouse, this);
				if (this.use_corps) {
					this.mon(this.corps, 'change', this.onChangeCorps, this);
				}
				this.mon(this.zipcode, 'change', this.onChangeZipcode, this);
				if (this.level > 3) {
					this.mon(this.flat, 'change', this.onChangeFlat, this);
				}
			}
		}
		this.mon(this.place, 'beforequery', this.beforePlaceQuery, this);
		if (this.level > 1) {
			this.mon(this.street, 'beforequery', this.beforeStreetQuery, this);
		}
        if (this.addr_visible) {
    		this.addr.on('afterrender', this.afterRenderAddr, this)
    	}
		
		this.addEvents(
            /**
             * @event change
             * При изменении адресного поля целиком.
             */
		    'change',
			/**
             * @event change_place
             * При изменении населенного пункта
             * @param {AddrField} this
             * @param {Place_code} Код нас. пункта по КЛАДР
             * @param {Store} Строка с информацией о данных КЛАДРа по выбранному пункту
             */
			'change_place',
			/**
             * @event change_street
             * При изменении улицы
             * @param {AddrField} this
             * @param {Street_code} Код улицы по КЛАДР
             * @param {Store} Строка с информацией о данных КЛАДРа по выбранной улице
             */
			'change_street',
			/**
             * @event change_house
             * При изменении дома
             * @param {AddrField} this
             * @param {House} Номер дома
             */
			'change_house',
            /**
             * @event change_corps
             * При изменении скорпуса
             * @param {AddrField} this
             * @param {Corps} Номер корпуса
             */
            'change_corps',
			/**
             * @event change_flat
             * При изменении квартиры
             * @param {AddrField} this
             * @param {Flat} Номер квартиры
             */
			'change_flat',
			/**
             * @event change_zipcode
             * При изменении индекса
             * @param {AddrField} this
             * @param {zipcode} индекс
             */
			'change_zipcode',
			/**
             * @event before_query_place
             * Перед запросом данных о населенном пункте
             * @param {AddrField} this
             * @param {Event} Событие
             */
			'before_query_place');
	}	
	, getNewAddr: function (){
		var place_id;
		if (this.place != undefined) {
			place_id = this.place.getValue();
		}
		var street_id;
		if (this.street != undefined) {
			street_id = this.street.getValue();
		}
		var house_num;
		if (this.house != undefined) {
			house_num = this.house.getValue();
		}
		var corps_num;
		if (this.corps != undefined) {
			corps_num = this.corps.getValue();
		}
		var flat_num;
		if (this.flat != undefined) {
			flat_num = this.flat.getValue();
		}
		var zipcode;
		if (this.zipcode != undefined) {
			zipcode = this.zipcode.getValue();
		}
		var place = null;
		var place_data =  this.place.getStore().data.get(place_id);
		if (place_data != undefined) {
			place = place_data.data;
		}
		var street = null;
		var street_data =  this.street.getStore().data.get(street_id);
		if (street_data != undefined) {
			street = street_data.data;
		}
		
		var new_addr = this.generateTextAddr(place, street, house_num, corps_num, flat_num, zipcode);
		if (this.addr != undefined) {
			this.addr.setValue(new_addr);
		}

        return new_addr;
    }
	, generateTextAddr: function(place, street, house, corps, flat, zipcode) {
		/* Формирование текстового представления полного адреса */
		
		var addr_text = '';
		if (street != undefined) {
			addr_text = place.addr_name+', '+street.socr+' '+street.name;
		} else {
			addr_text = place.addr_name;
		}
		// проставим индекс
		if (zipcode != '') {
            addr_text = zipcode+', '+addr_text;
		}
		// обработаем и поставим дом с квартирой
        if (house != '' && house != undefined) {
            addr_text = addr_text+', '+'д. '+house;
        }
        // обработаем и поставим дом с квартирой
		if (corps != '' && corps != undefined) {
			addr_text = addr_text+', '+'корп. '+corps;
		}
        if (flat != '' && flat != undefined) {
            addr_text = addr_text+', '+'кв. '+flat;
        }
		return addr_text;
	}
	, setNewAddr: function(newAddr){
		if (this.addr != undefined) {
			this.addr.value = newAddr;
		}
	}
	, onChangePlace: function(){
		var val = this.place.getValue();
		var data =  this.place.getStore().data.get(val);
		if (data != undefined) {
			data = data.data;
		    if (data.zipcode) {
		        this.zipcode.setValue(data.zipcode)
		    }
		} else {
			this.place.setValue('');
		}
		this.clearStreet();
		this.fireEvent('change_place', this, val, data);
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, onChangeStreet: function(){
		var val = this.street.getValue();
		var data =  this.street.getStore().data.get(val);
		if (data != undefined) {
			data = data.data;
		    if (data.zipcode) {
		        this.zipcode.setValue(data.zipcode)
		    }
		} else {
			this.clearStreet();
		}
		this.fireEvent('change_street', this, val, data);
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, onChangeHouse: function(){
		this.fireEvent('change_house', this, this.house.getValue());
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, onChangeCorps: function(){
		this.fireEvent('change_corps', this, this.corps.getValue());
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, onChangeFlat: function(){
		this.fireEvent('change_flat', this, this.flat.getValue());
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, onChangeZipcode: function(){
		this.fireEvent('change_zipcode', this, this.zipcode.getValue());
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, beforePlaceQuery: function(qe) {
		this.fireEvent('before_query_place', this, qe);
	}
    , onDblClickAddr: function(qe) {
        if (this.addr_visible) {
            this.addr.setReadOnly(false);
        }
    }
            
});

'use strict';
/**
 * Расширенный комбобокс, включает несколько кнопок
 * @param {Object} baseConfig
 * @param {Object} params
 */

Ext.m3.AdvancedComboBox = Ext.extend(Ext.m3.ComboBox, {
	constructor: function(baseConfig, params){

		/**
		 * Инициализация значений
		 */
		
		// Будет ли задаваться вопрос перед очисткой значения
		this.askBeforeDeleting = true;
		
		this.actionSelectUrl = null;
		this.actionEditUrl = null;
		this.actionContextJson = null;
		
		this.hideBaseTrigger = false;
		
		this.defaultValue = null;
		this.defaultText = null;
        this.defaultRecord = null;
		
		// кнопка очистки
		this.hideTriggerClear = params.hideClearTrigger || false;
		
		// кнопка выбора из выпадающего списка
		this.hideTriggerDropDown = false;
		
		// кнопка выбора из справочника
		this.hideTriggerDictSelect =  params.hideDictSelectTrigger || false;
		
		// кнопка редактирования элемента
		this.hideTriggerDictEdit = true;
		if (!params.hideEditTrigger){
			this.hideTriggerDictEdit = params.hideEditTrigger;
		}
		
		// Количество записей, которые будут отображаться при нажатии на кнопку 
		// выпадающего списка
		this.defaultLimit = '50';
		
		// css классы для иконок на триггеры 
		this.triggerClearClass = 'x-form-clear-trigger';
		this.triggerSelectClass = 'x-form-select-trigger';
		this.triggerEditClass = 'x-form-edit-trigger';



		assert(params.actions, 'params.actions is undefined');
		
		if (params.actions.actionSelectUrl) {
			this.actionSelectUrl = params.actions.actionSelectUrl;
		}
		
		if (params.actions.actionEditUrl) {
			this.actionEditUrl = params.actions.actionEditUrl;
		}
		
		this.askBeforeDeleting = params.askBeforeDeleting;
		this.actionContextJson = params.actions.contextJson;
		
		this.hideBaseTrigger = false;
		if (baseConfig.hideTrigger) {
			delete baseConfig.hideTrigger;
			this.hideBaseTrigger = true;
		}
		

		this.defaultValue = params.defaultValue;
		this.defaultText = params.defaultText;
        this.defaultRecord = Ext.decode(params.recordValue);

		this.baseTriggers = [{
				iconCls: 'x-form-clear-trigger',
				handler: null,
				hide: null
			},{
				iconCls:'', 
				handler: null,
				hide: null
			},{
				iconCls:'x-form-select-trigger', 
				handler: null,
				hide: null
			},{
				iconCls:'x-form-edit-trigger', 
				handler: null,
				hide: true
			}
		];
		this.allTriggers = [].concat(this.baseTriggers);
		if (params.customTriggers) {
			Ext.each(params.customTriggers, function(item, index, all){
				this.allTriggers.push(item);
			}, this);
		
		}

		Ext.m3.AdvancedComboBox.superclass.constructor.call(this, baseConfig);
	},
	/**
	 * Конфигурация компонента 
	 */
	initComponent: function () {
		Ext.m3.AdvancedComboBox.superclass.initComponent.call(this);
		
		// см. TwinTriggerField
        this.triggerConfig = {
            tag:'span', cls:'x-form-twin-triggers', cn:[]};

		Ext.each(this.allTriggers, function(item, index, all){
			this.triggerConfig.cn.push(
				{tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + item.iconCls}
			);
		}, this);

		if (!this.actionSelectUrl) {
			this.hideTriggerDictSelect = true;
		}
		
		if (!this.actionEditUrl) {
			this.hideTriggerDictEdit = true;
		}
		
		if (this.hideBaseTrigger){
			this.hideTriggerDropDown = true;
		}

		// Значения по-умолчанию
        if (this.defaultRecord){
            var record = new Ext.data.Record(this.defaultRecord);
            this.setRecord(record);
        } else {
            if (this.defaultValue && this.defaultText) {
                this.addRecordToStore(this.defaultValue, this.defaultText);
            }
        }

        this.validator = this.validateField;

		// Инициализация базовой настройки триггеров
		this.initBaseTrigger();
		
		this.addEvents(
			/**
			 * Генерируется сообщение при нажатии на кнопку вызыва запроса на сервер
			 * Параметры:
			 *   this - Сам компонент
			 * Возвр. значения:
			 *   true - обработка продолжается
			 *   false - отмена обработки
			*/
			'beforerequest',
		
			/**
			 * Генерируется сообщение после выбора значения. 
			 * Здесь может быть валидация и прочие проверки
			 * Параметры:
			 *   this - Сам компонент
			 *   id - Значение 
			 *   text - Текстовое представление значения
			 * Возвр. значения:
			 *   true - обработка продолжается
			 *   false - отмена обработки
			*/
			'afterselect',
		
			/**
			 * Генерируется сообщение после установки значения поля
			 * По-умолчанию в комбобоксе change генерируется при потери фокуса
			 * В данном контроле вызов change сделан после выбора значения и 
			 * потеря фокуса контрола обрабатывается вручную
			 * Параметры:
			 *   this - Сам компонент
			*/
			'changed'
		);
		
		this.getStore().baseParams = Ext.applyIf({start:0, limit: this.defaultLimit }, this.getStore().baseParams );
        this.triggerAction = 'all';
	},
	// см. TwinTriggerField
	getTrigger : function(index){
        return this.triggers[index];
    },
	// см. TwinTriggerField
    initTrigger : function(){
        var ts = this.trigger.select('.x-form-trigger', true),
            triggerField = this;
        ts.each(function(t, all, index){
			
            var triggerIndex = 'Trigger'+(index+1);
            t.hide = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = 'none';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = true;
            };
            t.show = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = '';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = false;
            };

            if( this.allTriggers[index].hide ){
                t.dom.style.display = 'none';
                this['hidden' + triggerIndex] = true;
            }
        }, this);

        this.disableTriggers(this.disabled);
		
        this.triggers = ts.elements;
    },

    getWidth: function() {
        // неверно пересчитывался размер поля
        //Ext.m3.AdvancedComboBox.superclass.getWidth.call(this);
        return(this.el.getWidth() + this.getTriggerWidth());
    },
    /**
     * Устанавливает или снимает с кнопок обработчики,
     * в зависимости от того, доступно ли поле.
     */
    disableTriggers: function(disabled){
        if (this.trigger) {
            var ts = this.trigger.select('.x-form-trigger', true);
            ts.each(function(t, all, index){
                var handler = this.allTriggers[index].handler,
                    events = Ext.elCache[t.id].events;
                if (!disabled) {
                    // Чтобы не добавлять событие несколько раз, нужно проверить есть ли оно уже
                    if (!events.click || events.click.length === 0){
                        t.on('click', handler, this, {preventDefault:true});
                        t.addClassOnOver('x-form-trigger-over');
                        t.addClassOnClick('x-form-trigger-click');
                    }
                } else {
                    t.un('click', handler, this, {preventDefault:true});
                }
            }, this);
        } else {
            this.baseTriggers[0].hide = disabled;
            this.baseTriggers[1].hide = disabled;
            this.baseTriggers[2].hide = disabled;
            this.baseTriggers[3].hide = disabled;
        }
    }

	/**
	 * Инициализация первоначальной настройки триггеров 
	 */
	,initBaseTrigger: function(){
		this.baseTriggers[0].handler = this.onTriggerClearClick;
		this.baseTriggers[1].handler = this.onTriggerDropDownClick;
		this.baseTriggers[2].handler = this.onTriggerDictSelectClick;
		this.baseTriggers[3].handler = this.onTriggerDictEditClick;
		
		this.baseTriggers[0].hide = this.hideTriggerClear || this.readOnly || this.disabled;
		this.baseTriggers[1].hide = this.hideTriggerDropDown || this.readOnly || this.disabled;
		this.baseTriggers[2].hide = this.hideTriggerDictSelect || this.readOnly || this.disabled;
		this.baseTriggers[3].hide = this.hideTriggerDictEdit || this.readOnly || this.disabled;
		
		if (!this.getValue()) {
			this.baseTriggers[0].hide = true;
			this.baseTriggers[3].hide = true; 
		}
	},
	
	// см. TwinTriggerField
    getTriggerWidth: function(){
        var tw = 0;
        Ext.each(this.triggers, function(t, index){
            var triggerIndex = 'Trigger' + (index + 1),
                w = t.getWidth();

            if(w === 0 && !this['hidden' + triggerIndex]){
                tw += this.defaultTriggerWidth;
            }else{
                tw += w;
            }
        }, this);
        return tw;
    },
	// см. TwinTriggerField
    // private
    onDestroy : function() {
        Ext.destroy(this.triggers);
		Ext.destroy(this.allTriggers);
		Ext.destroy(this.baseTriggers);
        Ext.m3.AdvancedComboBox.superclass.onDestroy.call(this);
    },

	/**
	 * Вызывает метод выпадающего меню у комбобокса
	 **/
	onTriggerDropDownClick: function() {
		if (this.fireEvent('beforerequest', this)) {

			if (this.isExpanded()) {
				this.collapse();
			} else {
				this.onFocus({});
				this.doQuery(this.allQuery, true);
			}
			this.el.focus();
		}
	},
	/**
	 * Кнопка открытия справочника в режиме выбора
	 */
	onTriggerDictSelectClick: function() {
		this.onSelectInDictionary();
	},
	/**
	 * Кнопка очистки значения комбобокса
	 */
	onTriggerClearClick: function() {
		if (this.askBeforeDeleting) {
			var scope = this;
			Ext.Msg.show({
	            title: 'Подтверждение',
	            msg: 'Вы действительно хотите очистить выбранное значение?',
	            icon: Ext.Msg.QUESTION,
	            buttons: Ext.Msg.YESNO,
	            fn: function(btn,text,opt){
	                if (btn === 'yes') {
	                    scope.clearValue(); 
	                }
	            }
	        });	
		} else {
			this.clearValue();
		}
	},
	/**
	 * Кнопка открытия режима редактирования записи
	 */
	onTriggerDictEditClick: function() {
		this.onEditBtn();
	},
	/**
	 * При выборе значения необходимо показывать кнопку "очистить"
	 * @param {Object} record
	 * @param {Object} index
	 */
	onSelect: function(record, index){
		if (this.fireEvent('afterselect', this, record.data[this.valueField], record.data[this.displayField] )) {
			Ext.m3.AdvancedComboBox.superclass.onSelect.call(this, record, index);
            this.showClearBtn();
            this.showEditBtn();
			this.fireEvent('change', this, record.data[this.valueField || this.displayField]);
			this.fireEvent('changed', this);
		}
	},
	/**
	 * Показывает кнопку очистки значения
	 */
	showClearBtn: function(){
        if (!this.hideTriggerClear && this.rendered && !this.readOnly && !this.disabled) {
            this.getTrigger(0).show();
        } else {
            this.hiddenTrigger1 = false || this.hideTriggerClear || this.readOnly || this.disabled;
        }
	},
	/**
	 * Скрывает кнопку очистки значения
	 */
	hideClearBtn: function(){
        if (this.rendered) {
            this.getTrigger(0).hide();
        } else {
            this.hiddenTrigger1 = true;
        }
	},
	/**
	 * Показывает кнопку открытия карточки элемента
	 */
	showEditBtn: function(){
        if (this.actionEditUrl && this.rendered && !this.hideTriggerDictEdit && this.getValue()) {
            this.getTrigger(3).show();
        } else {
            this.hiddenTrigger4 = false || this.actionEditUrl || this.hideTriggerDictEdit || this.readOnly || this.disabled;
        }
	},
	/**
	 * Скрывает кнопку открытия карточки элемента
	 */
	hideEditBtn: function(){
        if (this.actionEditUrl && this.rendered) {
            this.getTrigger(3).hide();
        } else {
            this.hiddenTrigger4 = true;
        }
	},
	/**
	 * Перегруженный метод очистки значения, плюс ко всему скрывает 
	 * кнопку очистки
	 */
	clearValue: function(){
		var oldValue = this.getValue();
		Ext.m3.AdvancedComboBox.superclass.clearValue.call(this);
		this.hideClearBtn();
		this.hideEditBtn();
		
		this.fireEvent('change', this, '', oldValue);
		this.fireEvent('changed', this);
	},
	/**
	 * Перегруженный метод установки значения, плюс ко всему отображает 
	 * кнопку очистки
	 */
	setValue: function(value){
		Ext.m3.AdvancedComboBox.superclass.setValue.call(this, value);
		if (value) {
			this.showClearBtn();
			this.showEditBtn();
		}
	},
	/**
	 * Генерирует ajax-запрос за формой выбора из справочника и
	 * вешает обработку на предопределенное событие closed_ok
	 */
	onSelectInDictionary: function(){
		assert( this.actionSelectUrl, 'actionSelectUrl is undefined' );
		
		if(this.fireEvent('beforerequest', this)) { 
			var scope = this;
			Ext.Ajax.request({
				url: this.actionSelectUrl,
				method: 'POST',
				params: this.actionContextJson,
				success: function(response, opts){
				    var win = smart_eval(response.responseText);
				    if (win){
				        win.on('closed_ok',function(id, displayText){
							if (scope.fireEvent('afterselect', scope, id, displayText)) {
								scope.addRecordToStore(id, displayText);
							}
							
				        });
				    }
				},
				failure: function(response, opts){
					uiAjaxFailMessage.apply(this, arguments);
				}
			});
		}
	},
	/**
	 * Добавляет запись в хранилище и устанавливает ее в качестве выбранной
	 * @param {Object} id Идентификатор
	 * @param {Object} value Отображаемое значение
	 */
	addRecordToStore: function(id, value){
        var record = new Ext.data.Record(),
            oldValue = this.getValue();
        record.id = id;
        record[this.displayField] = value;

        this.getStore().loadData({total:1, rows:[record]}, true);

        this.setValue(id);
        this.collapse();

        this.fireEvent('change', this, id, oldValue);
        this.fireEvent('changed', this);
    },
    /**
     * Установка значения как готовой записи
     * @param {Ext.data.Record} record Запись-значение
     */
    setRecord: function(record){
        if (record){
            var store = this.getStore(),
            // узнаем ключ новой записи
                key = record.data[this.valueField],
            // найдем похожую запись
                index = store.find(this.valueField, key);

            // если нашли, то заменим запись
            if (index >= 0) {
                store.removeAt(index);
            }
            // иначе добавим
            store.add(record);
            // сделаем ее выбранной
            this.onSelect(record, index);
        } else {
            this.clearValue();
        }
    },
    /**
     * Получение значения как записи из store
     * @return {Ext.data.Record} Запись-значение
     */
    getRecord: function(){
        var store = this.getStore(),
        // узнаем ключ записи
            key = this.getValue(),
        // найдем запись
            index = store.find(this.valueField, key);
        // если нашли, то вернем
        if (index >= 0) {
            return store.getAt(index);
        }
        // иначе вернем пусто
        return null;
    },
	/**
	 * Обработчик вызываемый по нажатию на кнопку редактирования записи
	 */
	onEditBtn: function(){
		assert( this.actionEditUrl, 'actionEditUrl is undefined' );
		
		// id выбранного элемента для редактирования
		var value_id = this.getValue();
		assert( value_id, 'Value not selected but edit window called' );
		
		Ext.Ajax.request({
			url: this.actionEditUrl,
			method: 'POST',
			params: Ext.applyIf({id: value_id}, this.actionContextJson),
			success: function(response, opts){
			    smart_eval(response.responseText);
			},
			failure: function(response, opts){
				uiAjaxFailMessage();
			}
		});
	},
	/**
	 * Не нужно вызывать change после потери фокуса
	 */
	triggerBlur: function () {
		if(this.focusClass){
            this.el.removeClass(this.focusClass);
        }
		if(this.wrap){
            this.wrap.removeClass(this.wrapFocusClass);
        }
        // Очистка значения, если введено пустое значение
        if (!this.getRawValue() && this.getValue()) {
            this.clearValue();
        }
        this.validate();
	},

    /**
     * Проверка поля на корректность
     */
    validateField: function(value) {
        // поле неверно, если в него ввели текст, который не совпадает с выбранным текстом
        return (this.getRawValue() === this.getText());
    },

    /**
     * Отображение(скрытие) основных триггеров: Очистки, редактирования, выбора из справочника и выпадающего списка.
     * Поведение зависит от выбранного флага show
     */
    showTriggers: function(show){

        if (show){
            if (this.getValue()) {
                this.showClearBtn();
                this.showEditBtn();
            }
            if (!this.hideTriggerDictSelect){
                this.getTrigger(2).show();
            }
            if (!this.hideTriggerDropDown){
                this.getTrigger(1).show();
            }
        }else{
            this.hideClearBtn();
            this.hideEditBtn();
            this.getTrigger(2).hide();
            this.getTrigger(1).hide();
        }
    },

    /**
     * При изменении доступности поля, нужно также поменять доступность всех его кнопок
     */
    setDisabled: function(disabled){

        this.disableTriggers(disabled);
        Ext.m3.AdvancedComboBox.superclass.setDisabled.call(this, disabled);

        // Отображаем триггеры при disabled=false, т.е. поле вновь активно.
        this.showTriggers(!disabled);
     },
     
    /**
     * При изменении доступности поля, нужно также поменять доступность всех его кнопок
     */
    setReadOnly: function(readOnly){
        var width = this.getWidth();
        this.disableTriggers(readOnly);
        Ext.m3.AdvancedComboBox.superclass.setReadOnly.call(this, readOnly);
        if (readOnly){
            this.el.setWidth(width);
            if (this.wrap) this.wrap.setWidth(width);
        } else {

            this.showTriggers(!readOnly);

            this.onResize(width);
        }
    }
});

Ext.reg('m3-select', Ext.m3.AdvancedComboBox);

/**
 * Компонент поля даты.
 * Добавлена кнопа установки текущий даты
 */
Ext.m3.AdvancedDataField = Ext.extend(Ext.form.DateField, {
	constructor: function(baseConfig, params){

		// Базовый конфиг для тригеров
		this.baseTriggers = [
			{
				iconCls: 'x-form-date-trigger'
				,handler: null
				,hide:null
			},
			{
				iconCls: 'x-form-current-date-trigger'
				,handler: null
				,hide:null
			}
		];

		this.hideTriggerToday = false;


		if (params.hideTriggerToday) {
			this.hideTriggerToday = true;
		};

		Ext.m3.AdvancedDataField.superclass.constructor.call(this, baseConfig);
	}
	,initComponent: function(){
		Ext.m3.AdvancedDataField.superclass.initComponent.call(this);

        this.triggerConfig = {
            tag:'span', cls:'x-form-twin-triggers', cn:[]};

		Ext.each(this.baseTriggers, function(item, index, all){
			this.triggerConfig.cn.push(
				{tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + item.iconCls}
			);
		}, this);

		this.initBaseTrigger()
	},
	initTrigger : function(){

        var ts = this.trigger.select('.x-form-trigger', true);
        var triggerField = this;
        ts.each(function(t, all, index){

            var triggerIndex = 'Trigger'+(index+1);
            t.hide = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = 'none';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = true;
            };
            t.show = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = '';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = false;
            };

            if( this.baseTriggers[index].hide ){
                t.dom.style.display = 'none';
                this['hidden' + triggerIndex] = true;
            }
            this.mon(t, 'click', this.baseTriggers[index].handler, this, {preventDefault:true});
            t.addClassOnOver('x-form-trigger-over');
            t.addClassOnClick('x-form-trigger-click');
        }, this);

        this.triggers = ts.elements;
    }
	,initBaseTrigger: function(){
		this.baseTriggers[0].handler = this.onTriggerClick;
		this.baseTriggers[1].handler = function(){
			var today = new Date();
			this.setValue( today );
			this.fireEvent('select', this, today);
		};
		this.baseTriggers[1].hide = this.hideTriggerToday;
	},
	onBlur : function(){
	/*
	   В суперклассе Ext.form.TriggerField данный метод перекрывается пустой функцией,
   	   видимо для того, чтобы все изменения и событие change происходили только при нажатии на триггеры,
 	   но данное поведение весьма неудобно в колоночных фильтрах, где требуется корректное срабатывание
           blur и change при потере фокуса.
	   Данная реализация метода взята из базового класса Ext.formField
	*/
	    this.beforeBlur();
	    if(this.focusClass){
	        this.el.removeClass(this.focusClass);
	    }
	    this.hasFocus = false;
	    if(this.validationEvent !== false && (this.validateOnBlur || this.validationEvent == 'blur')){
	        this.validate();
	    }
	    var v = this.getValue();
	    if(String(v) !== String(this.startValue)){
	        this.fireEvent('change', this, v, this.startValue);
	    }
	    this.fireEvent('blur', this);
	    this.postBlur();
    }

});

Ext.reg('m3-date', Ext.m3.AdvancedDataField );

/**
 * Crafted by ZIgi
 */

Ext.ns('Ext.m3');

/**
 * @class Ext.m3.BackgroundOperationProxy Класс обеспечивающий интерфейс для
 * опроса сервера с заданным интервалом. При получении данных срабатывает событие update, в качестве
 * аргумента к событию передается объект следуеющего вида
 * {
 *     value:0.3, //текущий прогресс от 0 до 1
 *     alive: true, // производиться ли операция на серврере
 *     text:'' // строка сообщение с сервера
 * }
 */
Ext.m3.BackgroundOperationProxy = Ext.extend(Ext.util.Observable, {
    /**
     * @cfg {String} адрес сервера для комуникации
     */
    url:'/',
    
    /**
     * @cfg {Number} промежуток в мс между опросами сервера
     */
    interval:1000,

    /**
     * @boundary {String} значение, используемое для идентификации фоновой операции
     */
    boundary:'default-boundary',

    /**
     * @cfg {String} Название парамтетра с командой серверу
     */
    commandParam:'command',

    /**
     * @cfg {String} Название параметра с\о значением баундари
     */
    boundaryParam:'boundary',

    constructor:function(cfg) {
        Ext.apply(this, cfg);
        Ext.m3.BackgroundOperationProxy.superclass.constructor.call(this);

        //таск раннер - класс выполняющий некую функцию в бескончено цикле с заданным интервалом
        this.taskRunner = new Ext.util.TaskRunner();
        this.task = {
            run:this.wait,
            interval:this.interval,
            scope:this
        };

        this.isRunning = false;

        this.addEvents('update');
        this.addEvents('result_ready');
    },

    /**
     * @public Команда старта операции
     * params содержит параметры начала выполнения операции
     */
    start:function(params) {
        this.doRequest('start', this.run, params);
    },

    /**
     * @public Команда остановки операции
     */
    stop:function(params) {
        this.stopWaiting();
        this.doRequest('stop', function(response) {
            this.fireEvent('update', this.parseResponse(response));
        }, params);
    },

    /**
     * @public Команда проверки прогресса
     */
    ping:function(params) {
        this.doRequest('request', this.run, params);
    },

    /**
     * @private Запуск цикла опроса
     */
    run:function(response) {
        if (!this.isRunning) {
            this.isRunning = true;
            this.taskRunner.start( this.task);
        }

        this.fireEvent('update', this.parseResponse(response));
    },

    /**
     * @private Остановка цикла опроса
     */
    stopWaiting:function() {
        if (this.isRunning) {
            this.isRunning = false;
            this.taskRunner.stop(this.task);
        }
    },

    /**
     * @private Обработка ответа сервера
     */
    waitCallback:function(response) {
        var responseObj = this.parseResponse(response);
        if (!responseObj.alive) {
            this.stopWaiting();

            /* запрашиваем результат операции с сервера */
            this.doRequest('result', function(responseResult){
               this.fireEvent('result_ready', this.parseResponse(responseResult));
            });
        }

        this.fireEvent('update',responseObj);
    },

    /**
     * @private Это функция запускается в бексонечном цикле
     */
    wait:function() {
        this.doRequest('request', this.waitCallback);
    },

    /**
     * @private Запрос на сервер
     */
    doRequest:function(command,successCallback, params) {
        var request_params = {};
        request_params[this.commandParam] = command;
        request_params[this.boundaryParam] = this.boundary;
        if(params != undefined){
            Ext.applyIf(request_params, params);
        }

        Ext.Ajax.request({
            url:this.url,
            success:successCallback,
            failure:this.requestError,
            scope:this,
            params: request_params
        });
    },

    /**
     * @private Обработка серверной ошибки
     */
    requestError:function(response, opts) {
        this.stopWaiting();
        if (window.uiAjaxFailMessage) {
            window.uiAjaxFailMessage(response,opts);
        }
    },

    /**
     * @public Вызывает для очистки ресурсов
     */
    destroy:function() {
        this.taskRunner.stopAll();
    },

    /**
     * @private Преобразование ответа сервера
     */
    parseResponse:function(response) {
        return Ext.util.JSON.decode(response.responseText);
    }
});

/**
 * @class Ext.m3.BackgroundOperationBar
 * Экстовый прогресс бар, с привязаным к нему прокси. Интерфейс комуникации с сервером:
 * start(), stop(), ping()
 */
Ext.m3.BackgroundOperationBar = Ext.extend(Ext.ProgressBar, {

    /**
     * @cfg {String} Урл
     */
    url:'/',

    /**
     * @cfg {Number} Интервал опроса
     */
    interval:1000,

    initComponent:function() {
        Ext.m3.BackgroundOperationBar.superclass.initComponent.call(this);
        this.serverProxy = new Ext.m3.BackgroundOperationProxy({
            url:this.url,
            interval:this.interval,
            boundary:this.boundary
        });

        //mon вместо on чтобы функция хендлер уничтожалась вместе с объектом прогрес бара
        this.mon(this.serverProxy, 'update', this.onUpdate, this);
        this.on('destroy', this.onDestroy)
    },

    ping:function(params) {
        this.serverProxy.ping(params);
    },

    start:function(params) {
        this.serverProxy.start(params);
    },

    stop:function(params) {
        this.serverProxy.stop();
    },

    onUpdate:function(obj) {
        this.updateProgress( obj.value,obj.text );
    },

    onDestroy:function() {
        this.serverProxy.destroy();
    }
});
/**
 * @class Ext.m3.CodeEditor
 * @extends Ext.Panel
 * Converts a panel into a code mirror editor with toolbar
 * @constructor
 *
 * @version 0.1
 */

 // Define a set of code type configurations

Ext.ns('Ext.m3.CodeEditorConfig');
Ext.apply(Ext.m3.CodeEditorConfig, {
    parser: {
        python: { mode: {name: "python", version: 2, singleLineStringErrors: false}},
        css: {mode: "css"},
        html: {mode: "text/html", tabMode: "indent"},
        javascript:{ mode:{ name: "javascript", json: true}},
        sql: {lineNumbers: true, matchBrackets: true, indentUnit: 4, mode: "text/x-plsql"}
    }
});

//Ext.ns('Ext.m3');
Ext.m3.CodeEditor = Ext.extend(Ext.Panel, {
    sourceCode: '/*Default code*/ ',
    readOnly: false,
    theme:'default',
    constructor: function(baseConfig){
        Ext.m3.CodeEditor.superclass.constructor.call(this, baseConfig);
    },

    initComponent: function() {
        // this property is used to determine if the source content changes
        this.contentChanged = false;

        Ext.apply(this, {
            items: [{
                xtype: 'textarea',
                readOnly: this.readOnly,
                hidden: true,
                value: this.sourceCode,
                enableKeyEvents: true
            }]
        });

        this.addEvents('editorkeyevent','editorfocus');

        Ext.m3.CodeEditor.superclass.initComponent.apply(this, arguments);
    },


    onRender: function() {
        Ext.m3.CodeEditor.superclass.onRender.apply(this, arguments);

        this.oldSourceCode = this.sourceCode;
        // trigger editor on afterlayout
        this.on('afterlayout', this.triggerCodeEditor, this, {
            single: true
        });

    },
    /* Хендлер перехвата клавиатурных действий */
    fireKeyEvent:function(i,e) {
        this.fireEvent('editorkeyevent', i, e);
    },

    fireFocusEvent:function() {
        this.fireEvent('editorfocus');
    },

    contentChange: function() {
        var oCmp = this.getTextArea();
        var sCode = this.codeMirrorEditor.getValue();

        oCmp.setValue(sCode);
        if(this.oldSourceCode == sCode) this.setTitleClass(true);
        else this.setTitleClass();
        this.fireEvent('contentchanged', this);
    },

    /** @private*/
    triggerCodeEditor: function() {
        var oThis = this;
        var oCmp = this.getTextArea();
        var editorConfig = Ext.applyIf(this.codeMirrorEditor || {}, {
            height: "100%",
            width: "100%",
            theme: this.theme,
            lineNumbers: true,
            indentUnit: 4,
            tabMode: "shift",
            matchBrackets: true,
            textWrapping: false,
            content: oCmp.getValue(),
            readOnly: oCmp.readOnly,
            autoMatchParens: true,
            /* Событие нажатия клавиши */
            onKeyEvent: this.fireKeyEvent.createDelegate(this),
            /* Событие изменения контента */
            onChange: this.contentChange.createDelegate(this),
            /* Событие фокуса эдитора */
            onFocus:this.fireFocusEvent.createDelegate(this)
       });

        var sParserType = oThis.parser || 'python';
        editorConfig = Ext.applyIf(editorConfig, Ext.m3.CodeEditorConfig.parser[sParserType]);

        this.codeMirrorEditor = new CodeMirror.fromTextArea(Ext.getDom(oCmp.id), editorConfig);
    },

    setTitleClass: function(){
        this.contentChanged = arguments[0] !== true;
    },

    getTextArea:function() {
        return this.findByType('textarea')[0];
    }
});

Ext.reg('uxCodeEditor', Ext.m3.CodeEditor);

/**
 * Окно на базе Ext.m3.Window, которое включает такие вещи, как:
 * 1) Submit формы, если она есть;
 * 2) Навешивание функции на изменение поля, в связи с чем обновляется заголовок 
 * окна;
 * 3) Если поля формы были изменены, то по-умолчанию задается вопрос "Вы 
 * действительно хотите отказаться от внесенных измений";
 */

Ext.m3.EditWindow = Ext.extend(Ext.m3.Window, {
	/**
	 * Инициализация первонального фунционала
	 * @param {Object} baseConfig Базовый конфиг компонента
	 * @param {Object} params Дополнительные параметры 
	 */
	constructor: function(baseConfig, params){
		
		/**
		 * id формы в окне, для сабмита
		 */
		this.formId = null;
		
		/**
		 * url формы в окне для сабмита
		 */
		this.formUrl = null;
		
		/**
		 * url формы в окне для чтения данных
		 */
		this.dataUrl = null;

		/**
		 * Количество измененных полей
		 */
		this.changesCount = 0;

		/**
		 * Оргинальный заголовок
		 */
		this.originalTitle = null;


		if (params) {
			if (params.form) {
				if (params.form.id){
					this.formId = params.form.id;
				}
				if (params.form.url){
					this.formUrl = params.form.url;
				}
			}
			if (params.dataUrl){
				this.dataUrl = params.dataUrl;
			}
		}

		Ext.m3.EditWindow.superclass.constructor.call(this, baseConfig, params);
	}
	/**
	 * Инициализация дополнительного функционала
	 */
	,initComponent: function(){
		Ext.m3.EditWindow.superclass.initComponent.call(this);

		// Устанавливает функции на изменение значения
		this.items.each(function(item){
			this.setFieldOnChange(item, this);
		}, this);

		this.addEvents(
			/**
			 * Генерируется сообщение до начала запроса на сохранение формы
			 * Проще говоря до начала submit'a
			 * Параметры:
			 *   this - Сам компонент
			 *   @param {Object} submit - sumbit-запрос для отправки на сервер
			*/
			'beforesubmit'
            /*
             * Генерируется после сабмита формы, позволяет перекрыть, например, закрытие формы
             * Параметры:
             *   this - Сам компонент
             *   @param {Object} form - то что проходит в success обработчик сабмита
             *   @param {Object} action - то что проходит в success обработчик сабмита
             */
            ,'aftersubmit'
            /**
             * Генерируется при ошибке в момент сабмита формы, позволяет реагировать на ошибки сохранения
             * Параметры:
             *   this - Сам компонент
             *   @param {Object} form - то что проходит в success обработчик сабмита
             *   @param {Object} action - то что проходит в success обработчик сабмита
             */
            ,'submitfailed'
			/**
			 * Генерируется, если произошел запрос на закрытие окна
			 * (через win.close()) при несохраненных изменениях, а пользователь
			 * в диалоге, запрашивающем подтверждение закрытия без сохранения,
			 * отказался закрывать окно.
			 * Параметры:
			 *   this - Сам компонент
			 */
			 ,'closing_canceled'
			 /*
			  * Генерируеются перед отправкой запроса на сервер за обновленными данными.
			  * Можно изменить передаваемые параметры.
			  *   this - Сам компонент
			  *   @param {Object} load - Параметры ajax-запроса для отправки на сервер
			  */
			 ,'beforeloaddata'
			 /*
			  * Генерируеются после успешного запроса данных.
			  *   this - Сам компонент
			  *   @param {Object} action - Результаты запроса
			  */
			 ,'dataloaded'
			)

	}
	/**
	 * Получает форму по formId
	 */
	,getForm: function() {
		assert(this.formId, 'Не задан formId для формы');

		return Ext.getCmp(this.formId).getForm();
	}
	/**
	 * Проверяет форму на наличие некорректных полей, отдает список label'ов этих полей
	 */
    ,getInvalidNames: function(submittedForm){
                var invalidNames = [];
                submittedForm.items.each(function(f){
                   if(!f.validate()){
                       invalidNames.push('<br>- ' + f.fieldLabel)
                   }
                });
                return invalidNames
            }
    /**
	 * Сообщить пользователю об имеющихся некорректно заполненных полях.
	 * Будет использоваться для переопределения способа уведомления в потомках.
	 * @param {list} invalidNames
	 */
    ,showInvalidFields: function(invalidNames){
        Ext.Msg.show({
          title: 'Проверка формы',
          msg: 'На форме имеются некорректно заполненные поля:' + invalidNames.toString() + '.',
          buttons: Ext.Msg.OK,
          icon: Ext.Msg.WARNING
        });
    } 
	/**
	 * Сабмит формы
	 * @param {Object} btn
	 * @param {Object} e
	 * @param {Object} baseParams
	 */
	,submitForm: function(btn, e, baseParams){
		assert(this.formUrl, 'Не задан url для формы');

		var form = Ext.getCmp(this.formId).getForm();
		if (form){
            var invalidNames = this.getInvalidNames(form);
            if (invalidNames.length){
            	this.showInvalidFields(invalidNames);
			    return;
            }
		}
				
        var scope = this;
		var mask = new Ext.LoadMask(this.body, {msg:'Сохранение...'});
		var params = Ext.applyIf(baseParams || {}, this.actionContextJson || {});

        // На форме могут находиться компоненты, которые не являются полями, но их можно сабмитить
        // Находим такие компоненты по наличию атрибутов name и localEdit
        var getControls = function(items){
            var result = new Array();
            for (var i = 0; i < items.getCount(); i++){
                var control = items.get(i);
                if (control.name && control.localEdit){
                    result.push(control);
                } else if (control instanceof Ext.Container && control.items != undefined) {
                    var cc = getControls(control.items);
                    result = result.concat(cc);
                }
            }
            return result;
        }

        // В params сабмита добавляются пары, где ключ - имя компонента,
        // а значение - массив из записей стора этого компонента. Пример:
        // "mainGrid": [{"id": 1, "name": "First"}, {"id": 2, "name": "Second"}]
        var cControls = getControls(this.items);
        for (var i = 0; i < cControls.length; i++){
            var cControl = cControls[i];
            var cStore = cControl.getStore();
            var cStoreData = new Array();
            for (var k = 0; k < cStore.data.items.length; k++){
                cStoreData.push(cStore.data.items[k].data);
            }
            params[cControl.name] = Ext.util.JSON.encode(cStoreData);
        }

        // вытащим из формы все поля и исключим их из наших параметров, иначе они будут повторяться в submite
        var fElements = form.el.dom.elements || (document.forms[form.el.dom] || Ext.getDom(form.el.dom)).elements;
        var name;
        Ext.each(fElements, function(element){
            name = element.name;
            if (!element.disabled && name) {
                delete params[name];
            }
        });

        var submit = {
            url: this.formUrl,
            submitEmptyText: false,
            params: params,
            scope: this,
            success: function(form, action) {
                try {
                    if (this.fireEvent('aftersubmit', this, form, action)) {
                        this.fireEvent('closed_ok', action.response.responseText);
                        this.close(true);
                        smart_eval(action.response.responseText);
                    }
                } finally {
                    mask.hide();
                    this.disableToolbars(false);
                }
            },
            failure: function(form, action) {
                if (this.fireEvent('submitfailed', this, form, action)) {
                    uiAjaxFailMessage.apply(this, arguments);
                }
                mask.hide();
                this.disableToolbars(false);
            }
        };
        
        if (scope.fireEvent('beforesubmit', submit)) {
            this.disableToolbars(true);
        	mask.show();
        	form.submit(submit);
        }
	}
	
	 /**
	  * Функция на изменение поля
	  * @param {Object} sender
	  * @param {Object} newValue
	  * @param {Object} oldValue
	  */
	,onChangeFieldValue: function (sender, newValue, oldValue, window) {

		if (sender.originalValue !== newValue) {
			if (!sender.isModified) {
				window.changesCount++;
			}
			sender.isModified = true;
		} else {
			if (sender.isModified){
				window.changesCount--;
			}
					
			sender.isModified = false;
		}
		
		window.updateTitle();
		sender.updateLabel();
    },

    /**
     * Сбрасывает признаки модифицированности формы.
     * Пропадает звездочка в заголовке и возвращаются исходные стили контролов.
     * @param {Object} container контейнер с которого начинается сброс.
     */
    clearModificationFlag: function(container){
        var cont = container || this;
        assert(cont instanceof Ext.Container, 'Должен быть контейнер');

        this.changesCount = 0;
        this.updateTitle();

        cont.items.each(function(item){
            if (item instanceof Ext.form.Field && item.isEdit){
                item.originalValue = item.getValue();
                item.startValue = item.getValue();
                // Это не стандартные атрибуты. Они объявлены в m3.js
                item.isModified = false;
                item.updateLabel();
            } else if (item instanceof Ext.Container){
                this.clearModificationFlag(item);
            }
        }, this);
    }

	/**
	 * Рекурсивная установка функции на изменение поля
	 * @param {Object} item
	 */
	,setFieldOnChange: function (item, window){
		if (item) {
			if (item instanceof Ext.form.Field && item.isEdit) {
                if (item instanceof Ext.form.Checkbox){
                    // Комбобокс, в отличие от остальных полей, вызывает change только после blur, а
                    // в случае клика не работает совсем. Поэтому доверять можно только эвенту check.
                    item.on('check', function(scope, checked){
                        window.onChangeFieldValue(scope, checked, !checked, window);
                    });
                } else {
                    item.on('change', function(scope, newValue, oldValue){
                        window.onChangeFieldValue(scope, newValue, oldValue, window);
                    });
                }
			}
			if (item.items) {
				if (!(item.items instanceof Array)) {	
					item.items.each(function(it){					
            			window.setFieldOnChange(it, window);
        			});
				} else {
					for (var i = 0; i < item.items.length; i++) {
						window.setFieldOnChange(item.items[i], window);
					}
				}
			}
			//оказывается есть еще и заголовочные элементы редактирования
			if (item.titleItems) {
				for (var i = 0; i < item.titleItems.length; i++) {
					window.setFieldOnChange(item.titleItems[i], window);
				}
			}
		}
	}
	
	/**
	 * Обновление заголовка окна
	 */
	,updateTitle: function(){
		// сохраним оригинальное значение заголовка
		if (this.title !== this.originalTitle && this.originalTitle === null) {
			this.originalTitle = this.title;
		}

		if (this.changesCount !== 0) {
			this.setTitle('*'+this.originalTitle);
		} else {
			this.setTitle(this.originalTitle);
		}
	}
	/**
	 * Перегрузка закрытия окна со вставкой пользовательского приложения
	 * @param {Bool} forceClose Приндтельное (без вопросов) закрытие окна
	 * 
	 * Если forceClose != true и пользователь в ответ на диалог
	 * откажется закрывать окно, возбуждается событие 'closing_canceled'
	 */
	,close: function (forceClose) {
        if (this.changesCount !== 0 && !forceClose ) {
            if(this.fireEvent('beforeclose', this) !== false){
                Ext.Msg.show({
                    title: "Внимание",
                    msg: "Данные были изменены! Cохранить изменения?",
                    buttons: Ext.Msg.YESNOCANCEL,
                    fn: function(buttonId, text, opt){
                        if (buttonId === 'yes') {
                            this.submitForm();
                        } else if (buttonId === 'no') {
                            if(this.hidden){
                                this.doClose();
                            }else{
                                this.hide(null, this.doClose, this);
                            }
                        } else {
                           this.fireEvent('closing_canceled');
                        }
                    },
                    animEl: 'elId',
                    icon: Ext.MessageBox.QUESTION,
                    scope: this
                });
            }
        } else {
            Ext.m3.EditWindow.superclass.close.call(this);
        }
	}
    ,disableToolbars: function(disabled){
        var toolbars = [this.getTopToolbar(), this.getFooterToolbar(), 
                       this.getBottomToolbar()];
        for (var i=0; i<toolbars.length; i++){
            if (toolbars[i]){
                toolbars[i].setDisabled(disabled);
            }
        }
    }
    /**
     * Динамическая загрузка данных формы
     */
    ,loadForm: function() {        
        this.disableToolbars(true);
   
        var mask = new Ext.LoadMask(this.body, {msg:'Чтение данных...'});
        mask.show();
        if (this.fireEvent('beforeloaddata', this)) {
        	
        	assert(this.dataUrl, 'Не задан dataUrl для формы');
        	this.getForm().doAction('load', {
                url: this.dataUrl
                ,params: Ext.applyIf({isGetData: true}, this.actionContextJson || {})
                ,success: this.onSuccessLoadForm.createDelegate(this, [mask], true)
                ,failure: this.onFailureLoadForm.createDelegate(this, [mask], true)
               ,scope: this
            });
        }
    },
    /**
     * Функция выполнения в момент успешной загрузки данных на форму окна
     * @param form Ссылка на форму
     * @param action Действия объекта для операции
     * @param mask Параметр маскирования
     */
    onSuccessLoadForm: function(form, action, mask){
        // Сложным контролам, данные которых хранятся в Store, недостаточно присвоить value.
        // Для них передаются готовые записи Store целиком.
        var field,
            id,
            record,            
            complexData = action.result['complex_data'];
            
        for (var fieldName in complexData){
            field = form.findField(fieldName);
            assert(field instanceof Ext.form.TriggerField,
                String.format('Поле {0} не предназначено для загрузки данных', fieldName));
            
            id = complexData[fieldName].id;
            
            // Запись значения в стор только при условии, что оно не пустое
            if (id) {
                // Создаем запись и добавляем в стор
                record = new Ext.data.Record();
                record.set('id', id);
                record.set(field.displayField, complexData[fieldName].value);
                field.getStore().add([record]);

                // Устанавливаем новое значение
                field.setValue(id);
                field.collapse();
            } else {
                field.clearValue();
            }
        }
        
        mask.hide();
        this.disableToolbars(false);
        this.fireEvent('dataloaded', action);
    },
    /**
     * Функция, в случае ошибочной загрузки данных в форму окна
     * @param form Ссылка на форму
     * @param action Действия объекта для операции
     * @param mask Параметр маскирования
     */
    onFailureLoadForm: function (form, action, mask){
        uiAjaxFailMessage.apply(this, arguments);
        mask.hide();
        this.disableToolbars(false);
   }
})

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
        if (!this.grid.tbar){
            this.grid.elements += ',tbar';
            tbar = new Ext.Toolbar();
            this.grid.tbar = tbar;
            this.grid.add(tbar);
            this.grid.doLayout();
    }
        //добавим кнопку
        this.grid.tbar.insert(0, new Ext.Button({
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
/**
 * Окно показа контекстной помощи
 */

Ext.m3.HelpWindow = Ext.extend(Ext.Window, {
    constructor: function(baseConfig, params){
        this.title = 'Справочная информация';
        this.maximized = true;
        this.maximizable = true;
        this.minimizable = true;
        this.width=800;
        this.height=550;

    Ext.m3.HelpWindow.superclass.constructor.call(this, baseConfig);
  }
});

function showHelpWindow(url){

    window.open(url);
}

Ext.ns('Ext.m3');

/**
 * @class Ext.ux.form.MultiSelectField
 * @extends Ext.m3.AdvancedComboBox
 *
 * Контрол для выбора множества значений. Может быть использован как локальное комбо,
 * с галочками в выпадающем списке. Или же так же как выбор из справочника, с установкой пака
 * Отличается от выбора из спровочника переопределенным шаблоном для отображения выпадающего списка
 * с галочками. Реальные значения храняться как массив рекордов в свойстве checkedItems
 */
Ext.m3.MultiSelectField = Ext.extend(Ext.m3.AdvancedComboBox, {

    /**
     * @cfg {String} delimeter Разделитель для отображение текста в поле
     */

    delimeter:',',
    multipleDisplayValue: null,

    initComponent:function() {
        this.checkedItems = [];
        this.hideTriggerDictEdit = true;
        this.editable = false;

        if (!this.tpl) {
             this.tpl = '<tpl for="."><div class="x-combo-list-item x-multi-combo-item">' +
            '<img src="' + Ext.BLANK_IMAGE_URL + '" class="{[this.getImgClass(values)]}" />' +
            '<div>{' + this.displayField + '}</div></div></tpl>';
            
            this.tpl = new Ext.XTemplate(this.tpl, {
                getImgClass: this.getCheckboxCls.createDelegate(this)
            })

        }

       Ext.m3.MultiSelectField.superclass.initComponent.apply(this);
    },

    setValue:function(v) {

        if (!v || v === '[]'){
            this.hideClearBtn();
        }
        else {
            this.showClearBtn();
        }
        this.value = this.getValue();
        this.setRawValue(this.getText());
        if (this.hiddenField) {
            this.hiddenField.value = this.value;
        }
        if (this.el) {
            this.el.removeClass(this.emptyClass);
        }
    },

    getValue : function () {
        var value = [];
		Ext.each(this.checkedItems, function (record) {
			value.push(record.get(this.valueField));
		}, this);

        // vahotin 31.08.12
        // Если поле не содержит значение, то возвращаем пустую строку.
        // Это необходимо для того, чтобы в базовом классе AdvancedComboBox
        // корректно проходила проверка в методе initBaseTrigger
        var res;
        if (value.length){
            res = Ext.util.JSON.encode(value);
        } else {
            res = "";
        }

		return res;
        //
	},

    initValue:function() {
        var i = 0, obj, values, val, record;

        if (this.store && this.value && this.mode === 'local') {
            //Случай, если контрол используется как локальный комбобокс
            //со множественным выбором
            values = Ext.util.JSON.decode(this.value);
            this.store.each(function (r) {
			    Ext.each(values, function (value) {
			        if (r.get(this.valueField) == value) {
			            this.checkedItems.push(r);
			            return false;
			        }
			    }, this);					
		    }, this);
        }
        else if (this.value) {
            //Попробуем создать значения из того что нам прислали с сервера
            //ожидаем что там будут некие объекты с полями значения и отображения
            values = Ext.util.JSON.decode(this.value);

            for (;i < values.length; i++) {
                val = values[i];

                if (typeof(val) !== 'object' ||
                    !( val[this.displayField] && val[this.valueField] )){
                    continue;
                }
                
                record = new Ext.data.Record();
                record.data[this.valueField] = val[this.valueField];
                record.data[this.displayField] = val[this.displayField];

                this.checkedItems.push(record);
            }
        }

       Ext.m3.MultiSelectField.superclass.initValue.call(this);
    },

    getText : function () {
		var value = [];
		Ext.each(this.checkedItems, function (record) {
			value.push(record.get(this.displayField));
		}, this);
		if (value.length > 1 && this.multipleDisplayValue){
			return this.multipleDisplayValue;
		} else {
			return value.join(this.delimeter + ' ');
		}
	},

    getCheckboxCls:function(record) {
        var i = 0;
        for (; i < this.checkedItems.length; i++) {
            if ( record[this.valueField] == this.checkedItems[i].data[this.valueField] ) {
                return 'x-grid3-check-col-on';
            }
        }

        return 'x-grid3-check-col';
    },

    getCheckedRecords:function() {
        return this.checkedItems;    
    },

    onSelect : function (record, checkedIndex) {
        var index;

        index = this.findCheckedRecord(record);
        
        if (this.fireEvent("beforeselect", this, record, checkedIndex) !== false) {
			if (index === -1) {
			    this.checkedItems.push(record);
			} else {
			    this.checkedItems.remove( this.checkedItems[index]);
			}

            this.refreshItem(record);

			this.setValue(this.getValue());
            this.fireChangeEventOnDemand();
            this.fireEvent("select", this, this.checkedItems);
        }
	},

    /**
     * Чтобы сохранить совместимость c концепцией изменения полей ExtJS
     * приходится имитировать поведение Ext.form.Field.onBlur().
     * иначе событие 'change' у нашего поля никогда не вызывается.
     */
    fireChangeEventOnDemand: function(){
        var newValue = this.getValue();
        if (String(newValue) !== String(this.startValue)){
            this.fireEvent('change', this, newValue, this.startValue);
        }
        this.startValue = newValue;
    },

    refreshItem:function(record) {
        if (this.view) {
            this.view.refreshNode(this.store.indexOf(record));
        }
    },

    onSelectInDictionary: function(){
		if(this.fireEvent('beforerequest', this)) {
			Ext.Ajax.request({
				url: this.actionSelectUrl
				,method: 'POST'
				,params: this.actionContextJson
				,success: function(response){
				    var win = smart_eval(response.responseText);
				    if (win){
                        win.initMultiSelect(this.checkedItems);
				        win.on('closed_ok',function(records){
                            this.addRecordsToStore( records);
                            this.fireChangeEventOnDemand();
                            this.fireEvent('select', this, this.checkedItems);
				        }, this);
				    }
				}
				,failure: function(response, opts){
					window.uiAjaxFailMessage.apply(this, arguments);
				},
                scope:this
			});
		}
	},

    /**
     * Срабатывает при нажатии на кнопку "Очистить".
     * Отменяет выбор в DataView this.view и очищает строку на форме.
     */
    clearValue:function() {
        this.checkedItems = [];
        if (this.view)
            this.view.refresh();

        this.setValue(this.getValue());
        this.fireChangeEventOnDemand();
    },

    addRecordsToStore: function(records){
    	var i = 0, newRecords = [], record;

        for (; i< records.length;i++) {
            record = new Ext.data.Record();
            record.data[this.valueField] = records[i].data[this.valueField];
            record.data[this.displayField] = records[i].data[this.displayField];
            newRecords.push( record );
        }

        this.checkedItems = newRecords;
        if (this.view)
            this.view.refresh();
        this.setValue(this.getValue());
	},

    findCheckedRecord:function(record) {
        var i = 0, index = -1;

        for (; i < this.checkedItems.length;i++) {
            if (this.checkedItems[i].data[this.valueField]
                    === record.data[this.valueField]) {
                index = i;
                break;
            }
        }

        return index;
    }

});

Ext.reg('m3-multiselect', Ext.m3.MultiSelectField );

Ext.namespace('Ext.ux');

/**
 * Notification окна оповещения, создает цепочку окон оповещения с автоскрытием
 *  принимает аргументы
 *  title - заголовок,
 *  html - содержание,
 *  iconCls - иконка
 */
Ext.ux.NotificationMgr = {
    notifications: [],
    originalBodyOverflowY: null
};
Ext.ux.Notification = Ext.extend(Ext.Window, {
    initComponent: function () {
        // TODO: Параметры не перекрываются если наследоваться от этого объекта.
        Ext.apply(this, {
            iconCls: this.iconCls || 'icon-accept',
            cls: 'x-notification',
            autoHeight: true,
            plain: true,
            draggable: false,
            bodyStyle: 'text-align:center',
            padding: 5,
            header: false,
            shadow: false,
            'float': true
        });
        this.closedCallback = function () {};
        if (this.autoDestroy) {
            this.task = new Ext.util.DelayedTask(this.hide, this);
        } else {
            this.closable = true;
        }
        Ext.ux.Notification.superclass.initComponent.apply(this);
    },
    setMessage: function (msg) {
        this.body.update(msg);
    },
    setTitle: function (title, iconCls) {
        Ext.ux.Notification.superclass.setTitle.call(this, title, iconCls || this.iconCls);
    },
    registerCallbackOnClosed: function (callback) {
        this.closedCallback = callback;
    },
    onDestroy: function () {
        Ext.ux.NotificationMgr.notifications.remove(this);
        Ext.ux.Notification.superclass.onDestroy.call(this);
        this.closedCallback();
    },
    cancelHiding: function () {
        this.addClass('fixed');
        if (this.autoDestroy) {
            this.task.cancel();
        }
    },
    afterShow: function () {
        Ext.ux.Notification.superclass.afterShow.call(this);
        Ext.fly(this.body.dom).on('click', this.cancelHiding, this);
    },
    animShow: function () {
        var pos = 120,
            i = 0,
            notifyLength = Ext.ux.NotificationMgr.notifications.length;
        // save original body overflowY
        if (Ext.ux.NotificationMgr.originalBodyOverflowY == null) {
            Ext.ux.NotificationMgr.originalBodyOverflowY = document.body.style.overflowY;
        }


        document.body.style.overflow = 'hidden';

        this.setSize(this.width, 100);


        for (null; i < notifyLength; i += 1) {
            pos += Ext.ux.NotificationMgr.notifications[i].getSize().height + 10;
        }

        Ext.ux.NotificationMgr.notifications.push(this);

        this.el.alignTo(document.body, "br-br", [ -10, -pos ]);

        this.el.slideIn("b", {
            duration: 1.2,
            callback: this.afterShow,
            scope: this
        });
    },
    animHide: function () {
        this.el.ghost("t", {
            duration: 1.2,
            remove: false,
            callback : function () {
                Ext.ux.NotificationMgr.notifications.remove(this);

                document.body.style.overflow = 'auto';

                this.destroy();
            }.createDelegate(this)
        });
    },
    focus: Ext.emptyFn
});

/**
 * Объектный грид, включает в себя тулбар с кнопками добавить, редактировать и удалить
 * @param {Object} config
 */
Ext.m3.ObjectGrid = Ext.extend(Ext.m3.GridPanel, {
	constructor: function(baseConfig, params){
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.columnParamName = params.columnParamName; // используется при режиме выбора ячеек. через этот параметр передается имя выбранной колонки
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		this.readOnly = params.readOnly;
		// признак клиентского редактирования
		this.localEdit = params.localEdit;
        // имя для сабмита в режиме клиентского редактирования
        this.name = params.name;
		
		Ext.m3.ObjectGrid.superclass.constructor.call(this, baseConfig, params);
	}
	
	,initComponent: function(){
		Ext.m3.ObjectGrid.superclass.initComponent.call(this);
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
    				    scope.disableToolbars(false);
				    }
					return child_win;
				}
				mask.hide();
				scope.disableToolbars(false);
			}
           ,failure: function(){ 
               uiAjaxFailMessage.apply(this, arguments);
               mask.hide();
               scope.disableToolbars(false);
               
           }
		};
		
		if (this.fireEvent('beforenewrequest', this, req)) {
			var scope = this;

			this.disableToolbars(true);
			mask.show();
			Ext.Ajax.request(req);
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
    						scope.disableToolbars(false);
						}
						return child_win;
					}
					mask.hide();
                    scope.disableToolbars(false);
				}
               ,failure: function(){ 
                   uiAjaxFailMessage.apply(this, arguments);
                   mask.hide();
                   scope.disableToolbars(false);
               }
			};
			
			if (this.fireEvent('beforeeditrequest', this, req)) {
				var scope = this;
				this.disableToolbars(true);
				mask.show();
				Ext.Ajax.request(req);
			}
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
    		                		   scope.disableToolbars(false);
    		                	   }
		                		   return child_win;
		                	   }
		                	   mask.hide();
                               scope.disableToolbars(false);
						   }
                           ,failure: function(){ 
                               uiAjaxFailMessage.apply(this, arguments);
                               mask.hide();
                               scope.disableToolbars(false);
                           }
		                };
						if (scope.fireEvent('beforedeleterequest', scope, req)) {
						    scope.disableToolbars(true);
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
	    var window = smart_eval(response.responseText);
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
	    var window = smart_eval(response.responseText);
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
                    smart_eval(response.responseText);
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
                smart_eval(response.responseText);
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
			}
		} else {
			this.getStore().load(); 	
		}

	}
	,disableToolbars: function(disabled){
        var toolbars = [this.getTopToolbar(), this.getFooterToolbar(), 
                       this.getBottomToolbar()]
        for (var i=0; i<toolbars.length; i++){
            if (toolbars[i]&&!this.readOnly){
                toolbars[i].setDisabled(disabled);
            }
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
});

Ext.m3.EditorObjectGrid = Ext.extend(Ext.m3.EditorGridPanel, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.columnParamName = params.columnParamName; // используется при режиме выбора ячеек. через этот параметр передается имя выбранной колонки
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;

        // признак клиентского редактирования
      	this.localEdit = params.localEdit;

        // имя для сабмита в режиме клиентского редактирования
        this.name = params.name;
		
		Ext.m3.EditorObjectGrid.superclass.constructor.call(this, baseConfig, params);
	}
	
	,initComponent: function(){
		Ext.m3.EditorObjectGrid.superclass.initComponent.call(this);
		var store = this.getStore();
		store.baseParams = Ext.applyIf(store.baseParams || {}, this.actionContextJson || {});
		
		
		this.addEvents(
			/**
			 * Событие до запроса добавления записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер
			 */
			'beforenewrequest',
			/**
			 * Событие после запроса добавления записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afternewrequest',
			/**
			 * Событие до запроса редактирования записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер 
			 */
			'beforeeditrequest',
			/**
			 * Событие после запроса редактирования записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'aftereditrequest',
			/**
			 * Событие до запроса удаления записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер 
			 */
			'beforedeleterequest',
			/**
			 * Событие после запроса удаления записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afterdeleterequest'
			);
		
	}
	/**
	 * Нажатие на кнопку "Новый"
	 */
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		var params = this.getMainContext();
		params[this.rowIdName] = '';

		var req = {
			url: this.actionNewUrl,
			params: params,
			success: function(res, opt){
				if (scope.fireEvent('afternewrequest', scope, res, opt)) {
					return scope.childWindowOpenHandler(res, opt);
				}
			},
			failure: Ext.emptyFn
		};
		
		if (this.fireEvent('beforenewrequest', this, req)) {
			var scope = this;
			Ext.Ajax.request(req);
		}
		
	}
	/**
	 * Нажатие на кнопку "Редактировать"
	 */
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().hasSelection()) {
			var baseConf = this.getSelectionContext(this.localEdit);
			var req = {
				url: this.actionEditUrl,
				params: baseConf,
				success: function(res, opt){
					if (scope.fireEvent('aftereditrequest', scope, res, opt)) {
						return scope.childWindowOpenHandler(res, opt);
					}
				},
				failure: Ext.emptyFn
			};
			
			if (this.fireEvent('beforeeditrequest', this, req)) {
				var scope = this;
				Ext.Ajax.request(req);
			}
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
						var req = {
		                   url: scope.actionDeleteUrl,
		                   params: baseConf,
		                   success: function(res, opt){
		                	   if (scope.fireEvent('afterdeleterequest', scope, res, opt)) {
		                		   return scope.deleteOkHandler(res, opt);
		                	   }
						   },
		                   failure: Ext.emptyFn
		                };
						if (scope.fireEvent('beforedeleterequest', scope, req)) {
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
	,childWindowOpenHandler: function (response, opts){
		
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(){
				return scope.refreshStore()
			});
	    }
	}
	/**
	 * Хендлер на удаление окна
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,deleteOkHandler: function (response, opts){
		smart_eval(response.responseText);
		this.refreshStore();
	}
	,refreshStore: function (){
		if (this.allowPaging) {
			var pagingBar = this.getBottomToolbar(); 
			if(pagingBar &&  pagingBar instanceof Ext.PagingToolbar){
			    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
		        pagingBar.changePage(active_page);
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
});
/**
 * Объектное дерево, включает в себя тулбар с кнопками добавить (в корень и дочерний элемент), редактировать и удалить
 * @param {Object} config
 */
Ext.m3.ObjectTree = Ext.extend(Ext.ux.tree.TreeGrid, {
	constructor: function(baseConfig, params){
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		this.parentIdName = params.parentIdName;
        this.incrementalUpdate = params.incrementalUpdate;
		if (params.customLoad) {
			var ajax = Ext.Ajax;
			this.on('expandnode',function (node){
				var nodeList = new Array();
				if (node.hasChildNodes()){
					for (var i=0; i < node.childNodes.length; i++){
						if(!node.childNodes[i].isLoaded()) {
							nodeList.push(node.childNodes[i].id);
						}	
					}
				}
				if (nodeList.length > 0) {
					ajax.request({
						url: params.actions.dataUrl
						,params: {'list_nodes': nodeList.join(',')}
						,success: function(response, opts){
							var res = Ext.util.JSON.decode(response.responseText);
							if (res) {
								for (var i=0; i < res.length; i++){
									var curr_node = node.childNodes[i];
									for (var j=0; j < res[i].children.length; j++){
										var newNode = new Ext.tree.AsyncTreeNode(res[i].children[j]);
										curr_node.appendChild(newNode);
										curr_node.loaded = true;
									}
								}
							} 
						}
						,failure: function(response, opts){
						   Ext.Msg.alert('','failed');
						}
					});
				}
			});
		}
		// Параметр "Сортировать папки"
		// если true, то папки всегда будут выше простых элементов
		// если false, то папки ведут себя также как элементы
		baseConfig.folderSort = true;
		baseConfig.enableSort = false;
		if (params.folderSort != undefined) {
			baseConfig.folderSort = params.folderSort; 
		}
		Ext.m3.ObjectTree.superclass.constructor.call(this, baseConfig, params);
	},

	initComponent: function(){
		var loader = this.getLoader(); 
		loader.baseParams = this.getMainContext();
		
		Ext.m3.ObjectTree.superclass.initComponent.call(this);
		// Созадем свой сортировщик с переданными параметрами
		var sorter = new Ext.ux.tree.TreeGridSorter(this, {folderSort: this.folderSort, property: this.columns[0].dataIndex || 'text'});        
        // Повесим отображение маски при загрузке дерева
        loader.on('beforeload', this.onBeforeLoad, this);
        loader.on('load', this.onLoad, this);
        loader.on('loadexception', this.onLoadException, this);
        // еще настроим loader, чтобы правильно передавал узел через параметр
        loader.nodeParameter = this.rowIdName; 

        this.addEvents(
			/**
			 * Событие до запроса добавления записи - запрос отменится при возврате false
			 * @param {ObjectTree} this - само дерево
			 * @param {JSON} request - AJAX-запрос для отправки на сервер
             * @param isChild - флаг того, что запрос идет на дочерний узел
			 */
			'beforenewrequest',

            /**
			 * Событие до запроса редактирования записи - запрос отменится при возврате false
			 * @param {ObjectTree} this - само дерево
			 * @param {JSON} request - AJAX-запрос для отправки на сервер
			 */
			'beforeeditrequest',

            /**
			 * Событие до запроса удаления записи - запрос отменится при возврате false
			 * @param {ObjectTree} this - само дерево
			 * @param {JSON} request - AJAX-запрос для отправки на сервер
			 */
			'beforedeleterequest'
        );
	},
	
	showMask: function(visible) {
		var loader = this.getLoader();
		if (this.treeLoadingMask == undefined) {
			this.treeLoadingMask = new Ext.LoadMask(this.el, {msg:"Загрузка..."});
		}
		if (visible) {
			this.treeLoadingMask.show();
		} else {
			this.treeLoadingMask.hide();
		}
	},
	
	onBeforeLoad: function(treeloader, node, callback){
		this.showMask(true);
	},
	
	onLoad: function(treeloader, node, response){
		this.showMask(false);
	},
	
	onLoadException: function(treeloader, node, response){
		this.showMask(false);
	},

	onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');

        var req = {
            url: this.actionNewUrl,
	        method: 'POST',
	        params: this.getMainContext(),
            scope: this,
	        success: function(res, opt){
		   		return this.childWindowOpenHandler(res, opt, 'new');
		    },
	        failure: function(){
                uiAjaxFailMessage.apply(this, arguments);
            }
    	};

        if (this.fireEvent('beforenewrequest', this, req, false)) {
			Ext.Ajax.request(req);
		}
	},

	onNewRecordChild: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		if (!this.getSelectionModel().getSelectedNode()) {
			Ext.Msg.show({
			   title: 'Новый',
			   msg: 'Элемент не выбран',
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.INFO
			});
			return;
		}
		var baseConf = this.getSelectionContext();
		baseConf[this.parentIdName] = baseConf[this.rowIdName];
		delete baseConf[this.rowIdName];
		var scope = this;

        var req = {
            url: this.actionNewUrl,
            scope: this,
	        method: "POST",
	        params: baseConf,
	        success: function(res, opt){
		   		return this.childWindowOpenHandler(res, opt, 'newChild');
		    },
	        failure: function(){
                uiAjaxFailMessage.apply(this, arguments);
            }
    	};

        if (this.fireEvent('beforenewrequest', this, req, true)) {
			Ext.Ajax.request(req);
		}
	},

	onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().getSelectedNode()) {
			var baseConf = this.getSelectionContext();

            var req = {
		        url: this.actionEditUrl,
                scope: this,
		        method: 'POST',
		        params: baseConf,
		        success: function(res, opt){
			   		return this.childWindowOpenHandler(res, opt, 'edit');
			    },
		        failure: function(){
                    uiAjaxFailMessage.apply(this, arguments);
                }
		    };

            if (this.fireEvent('beforeeditrequest', this, req)) {
			    Ext.Ajax.request(req);
		    }
    	}
	},

	onDeleteRecord: function (){
        assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
        assert(this.rowIdName, 'rowIdName is not define');
        var node = this.getSelectionModel().getSelectedNode()
        if (node) {
        
            Ext.Msg.show({
               title: 'Удаление записи',
               scope: this,
               msg: 'Вы действительно хотите удалить выбранную запись?',
               icon: Ext.Msg.QUESTION,
               buttons: Ext.Msg.YESNO,
               fn: function(btn, text, opt){
                   if (btn != 'yes')
                    return;
    
                    if (this.getSelectionModel().getSelectedNode()) {
                        var baseConf = this.getSelectionContext();
    
                        var req = {
                            url: this.actionDeleteUrl,
                            scope: this,
                            params: baseConf,
                            success: function(res, opt){
                                 return this.deleteOkHandler(res, opt);
                            },
                            failure: function(){
                                uiAjaxFailMessage.apply(this, arguments);
                            }
                        };
    
                        if (this.fireEvent('beforedeleterequest', this, req)) {
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
    },

	childWindowOpenHandler: function (response, opts, operation){
        
        var window = smart_eval(response.responseText);
        if(window){
            window.on('closed_ok', function(data){
                if (this.incrementalUpdate){
                    // нам пришел узел дерева
                    var obj = Ext.util.JSON.decode(data);
                    var selectedNode = this.getSelectionModel().getSelectedNode();
                    var newSelectNode = this.getLoader().createNode(obj.data);
                    switch (operation){
                        case 'edit':
                            // при редактировании заменим старый узел на новый
                            var parentNode = selectedNode.parentNode;
                            parentNode.removeChild(selectedNode);
		             if (!parentNode.expanded) {
               	         parentNode.expand(false, false);
           		     }
                            parentNode.appendChild(newSelectNode);
                            break;

                        // Добавление нового узла в корень
                        case 'new':
                            var rootNode = this.getRootNode();
                            rootNode.appendChild(newSelectNode);
                            break;

                        // Добавление происходит в текущий выделенный узел
                        case 'newChild':
                            // если детки уже загружены, то сразу добавляем
                            if (selectedNode.children) {
                                if (!selectedNode.expanded) {
                                    selectedNode.expand(false, false);
                                }
                                selectedNode.appendChild(newSelectNode);
                            } else {
                                // если узел еще не раскрыт
                                if (!selectedNode.expanded) {
                                    // если узел еще не загружен
                                    if (!selectedNode.leaf && selectedNode.childNodes.length == 0) {
                                        // загружаем его так, чтобы после загрузки выделить элемент
                                        selectedNode.on('expand', function(){
                                            var newSelectNode = this.getNodeById(obj.data.id);
                                            newSelectNode.select();
                                        }, this, {single: true});
                                        selectedNode.expand(false, false);
                                        newSelectNode = undefined;
                                    } else {
                                        // если загружен, то добавляем
                                        selectedNode.leaf = false;
                                        selectedNode.expand(false, false);
                                        selectedNode.appendChild(newSelectNode);
                                    }
                                } else {
                                    // если раскрыт, то сразу добавляем
                                    selectedNode.appendChild(newSelectNode);
                                }
                            }
                            break;
                    }
                    if (newSelectNode) {
                        newSelectNode.select();
                    }
                }
                else {
                    return this.refreshStore()
                }
            }, this);
        }
    }
	,deleteOkHandler: function (response, opts){
        if (this.incrementalUpdate){
            // проверка на ошибки уровня приложения
            var res = Ext.util.JSON.decode(response.responseText);
            if(!res.success){
                smart_eval(response.responseText);
                return;
            }
            // нам просто надо удалить выделенный элемент
            var selectedNode = this.getSelectionModel().getSelectedNode();
            var parentNode = selectedNode.parentNode;
            parentNode.removeChild(selectedNode);
            parentNode.select();
        } else {
            smart_eval(response.responseText);
            this.refreshStore();
        }
	}
	,refreshStore: function (){
		this.getLoader().baseParams = this.getMainContext();
		this.getLoader().load(this.getRootNode());
	}
	/**
     * Получение основного контекста дерева
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
    	if (this.getSelectionModel().getSelectedNode()) {
			baseConf[this.rowIdName] = this.getSelectionModel().getSelectedNode().id;
		}
		return baseConf;
    }
});


Ext.namespace('Ext.ux');

Ext.ux.OnDemandLoad = function(){

    loadComponent = function(component, callback){
        var fileType = component.substring(component.lastIndexOf('.'));
        var head = document.getElementsByTagName("head")[0];
        var done = false;
        if (fileType === ".js") {
            var fileRef = document.createElement('script');
            fileRef.setAttribute("type", "text/javascript");
            fileRef.setAttribute("src", component);
            fileRef.onload = fileRef.onreadystatechange = function(){
                if (!done) {
                    done = true;
                    if(typeof callback == "function"){
                        callback();
                    };
                    head.removeChild(fileRef);
                }
            };
        } else if (fileType === ".css") {
            var fileRef = document.createElement("link");
            fileRef.setAttribute("type", "text/css");
            fileRef.setAttribute("rel", "stylesheet");
            fileRef.setAttribute("href", component);
        }
        if (typeof fileRef != "undefined") {
            head.appendChild(fileRef);
        }
    };

    return {
        load: function(components, callback){
                loadComponent(components, callback);
        }
    };
}();
Ext.ux.PagingTreeNodeUI = Ext.extend(Ext.ux.tree.TreeGridNodeUI,
  {
    renderElements : function(n, a, targetNode, bulkRender){
        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';
        var attribs = n.attributes;
        var currentBlock = parseInt(n.parentNode.attributes.page) || 0;
        var fullCount = attribs.fullCount;
        var blockSize = n.parentNode.attributes.pageLimit || attribs.limit || 25;
        n.parentNode.attributes.pageLimit = blockSize;
        var blockCount = Math.ceil(fullCount/blockSize);
        var t = n.getOwnerTree();
        var cols = t.columns;
        var  c = cols[0];
        var renderBtn = function(stringStack, pageNum, text, addlClass)
        {
          stringStack.push('<div class="gs_tree_pgbtn')
          if(addlClass)
            stringStack.push(' ' + addlClass);
          stringStack.push('"><div gs:page="');
          stringStack.push(pageNum);
          stringStack.push('" class="x-tree-col-text">');
          stringStack.push(text);
          stringStack.push('</div></div>');
        }

         var buf = [
             '<li class="gs_tree_pagingbar" style="list-style:none;"><div ext:tree-node-id="',n.id,'" class="x-tree-node-el ', a.cls,'">',
             '<span unselectable="on" style="float:left;">Лист ',currentBlock+1, " из ", blockCount, '</span></a>'];

        var i;

        if(currentBlock!=0)
          renderBtn(buf, currentBlock-1, '<');

        if(blockCount<11)
        {
          for(i=0; i<blockCount; i++)
            renderBtn(buf, i, i+1, currentBlock==i?'gs_tree_pgbtn_sel':null);
        }
        else
        {
          // always render the link to the first page:
          renderBtn(buf, 0, 1, currentBlock==0?'gs_tree_pgbtn_sel':null);

          // render the current page link and the three links before and after:
          var from = Math.max(1, currentBlock-2);
          var to = Math.min(blockCount-1, currentBlock+3);

          if(from>1)
            buf.push('<div class="x-tree-col"><div class="x-tree-col-text">...</div></div>');

          for(i=from; i<to; i++)
            renderBtn(buf, i, i+1, currentBlock==i?'gs_tree_pgbtn_sel':null);

          if(to<blockCount-1)
            buf.push('<div class="x-tree-col"><div class="x-tree-col-text">...</div></div>');

          renderBtn(buf, blockCount-1, blockCount, currentBlock==blockCount-1?'gs_tree_pgbtn_sel':null);
        }
        if(currentBlock!=blockCount-1)
          renderBtn(buf, currentBlock+1, '>');


        var post= ['<div class="x-tree-col"><div id="last" class="x-tree-col-text">Показаны строки от ',currentBlock*blockSize+1, ' до ', Math.min((currentBlock+1)*blockSize, fullCount), " из ", fullCount, '</div></div>',
            '<div class="x-clear"></div></div>',
            '<ul class="x-tree-node-ct" style="display:none;"></ul>',
            "</li></div></td>"];

        var nodeStr = buf.join('')+post.join('');
        buf =  [
             '<tbody class="x-tree-node">',
                '<tr ext:tree-node-id="', n.id ,'" class="x-tree-node-el x-tree-node-leaf x-tree-pagingnode', a.cls, '">',
            '<td colspan="',cols.length,'" class="x-treegrid-col x-tree-pagingnode-td">',
            '<span class="x-tree-node-indent" style="float:left;">', this.indentMarkup, "</span>",
                        '<img src="', this.emptyIcon, '" class="x-tree-elbow" style="float:left;"/>',
                        '<img src="', a.icon || this.emptyIcon, '" class="', (a.icon ? " x-tree-node-inline-icon" : ""), (a.iconCls ? " "+a.iconCls : ""), '" unselectable="on" style="float:left;"/>',
                        '<a hidefocus="on" class="x-tree-node-anchor" href="', a.href ? a.href : '#', '" tabIndex="1" ',
                        '<a hidefocus="on" class="x-tree-node-anchor" href="', a.href ? a.href : '#', '" tabIndex="1" ',
                            a.hrefTarget ? ' target="'+a.hrefTarget+'"' : '', '>',
            nodeStr,
                    '</td>'
        ];

        nodeStr = buf.join('');

        if(bulkRender !== true && n.nextSibling && n.nextSibling.ui.getEl()){
            this.wrap = Ext.DomHelper.insertHtml("beforeBegin",
                                n.nextSibling.ui.getEl(), nodeStr);
        }
        else{
            this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, nodeStr);
        }
        n.on("click",
          function(node, evt)
          {
            var loader = node.getOwnerTree().getLoader();
            var target = evt.target;
            if(!target.attributes.getNamedItem('gs:page'))
              return false;
            var parent = node.parentNode;
            var pageLimit = parent.attributes.pageLimit || 25;
            var page = target.attributes.getNamedItem('gs:page').value;
            loader.baseParams.limit = pageLimit;
            loader.baseParams.start = page * pageLimit;
            parent.attributes.page = page;
            delete parent.attributes.children;
            parent.getUI().beforeLoad();  //display the loading icon
            loader.load(parent, function()
              {
                parent.getUI().afterLoad();  //remove the loading icon again
                parent.expand();
              });
            delete loader.baseParams.start;
            delete loader.baseParams.limit;

            return false;
          }
        );

        this.elNode = this.wrap.childNodes[0];
        this.ctNode = this.wrap.childNodes[1];
        var cs = this.elNode.firstChild.childNodes;
        this.indentNode = cs[0];
        this.ecNode = cs[1];
        this.iconNode = cs[2];
        this.anchor = cs[3];
        this.textNode = cs[3].firstChild;
    }
});
/**
 * Ext.ux.DateTimePicker & Ext.ux.form.DateTimeField
 * http://www.sencha.com/forum/showthread.php?98292-DateTime-field-again-and-again-)
 * Copyright(c) 2011, Andrew Pleshkov andrew.pleshkov@gmail.com
 * *** DATATEX CHANGES IN ORDER TO ADD A NEW SLIDER FOR SECONDS. 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
Ext.namespace('Ext.ux');

(function () {

    var UX = Ext.ux;

    UX.BaseTimePicker = Ext.extend(Ext.Panel, {

        timeFormat: 'H:i:s',

        header: true,

        nowText: 'Now',

        doneText: 'Done',

        hourIncrement: 1,

        minIncrement: 1,
           
        secIncrement: 1,

        hoursLabel: 'Hours',

        minsLabel: 'Minutes',

        secsLabel: 'Seconds',

        cls: 'ux-base-time-picker',

        width: 210,

        layout: 'form',

        labelAlign: 'top',

        initComponent: function () {
            this.addEvents('select');

            this.hourSlider = new Ext.slider.SingleSlider({
                increment: this.hourIncrement,
                minValue: 0,
                maxValue: 23,
                fieldLabel: this.hoursLabel,
                listeners: {
                    change: this._updateTimeValue,
                    scope: this
                },
                plugins: new Ext.slider.Tip()
            });

            this.minSlider = new Ext.slider.SingleSlider({
                increment: this.minIncrement,
                minValue: 0,
                maxValue: 59,
                fieldLabel: this.minsLabel,
                listeners: {
                    change: this._updateTimeValue,
                    scope: this
                },
                plugins: new Ext.slider.Tip()
            });

            this.secSlider = new Ext.slider.SingleSlider({
                increment: this.secIncrement,
                minValue: 0,
                maxValue: 59,
                fieldLabel: this.secsLabel,
                listeners: {
                    change: this._updateTimeValue,
                    scope: this
                },
                plugins: new Ext.slider.Tip()
            });

            this.setCurrentTime(false);

            this.items = [
                    this.hourSlider,
                    this.minSlider,
                    this.secSlider
            ];

            this.bbar = [
                {
                    text: this.nowText,
                    handler: this.setCurrentTime,
                    scope: this
                },
                '->',
                {
                    text: this.doneText,
                    handler: this.onDone,
                    scope: this
                }
            ];

            UX.BaseTimePicker.superclass.initComponent.call(this);
        },

        setCurrentTime: function (animate) {
            this.setValue(new Date(), !!animate);
        },

        onDone: function () {
            this.fireEvent('select', this, this.getValue());
        },

        setValue: function (value, animate) {
            this.hourSlider.setValue(value.getHours(), animate);
            this.minSlider.setValue(value.getMinutes(), animate);
            this.secSlider.setValue(value.getSeconds(), animate);

            this._updateTimeValue();
        },

        _extractValue: function () {
            var v = new Date();
            v.setHours(this.hourSlider.getValue());
            v.setMinutes(this.minSlider.getValue());
            v.setSeconds(this.secSlider.getValue());
            return v;
        },

        getValue: function () {
            return this._extractValue();
        },

        _updateTimeValue: function () {
            var v = this._extractValue().format(this.timeFormat);

            if (this.rendered) {
                this.setTitle(v);
            }
        },

        afterRender: function () {
            UX.BaseTimePicker.superclass.afterRender.call(this);

            this._updateTimeValue();
        },

        destroy: function () {
            this.purgeListeners();

            this.hourSlider = null;
            this.minSlider = null;
            this.secSlider = null;

            UX.BaseTimePicker.superclass.destroy.call(this);
        }

    });

    Ext.reg('basetimepicker', UX.BaseTimePicker);

})();
Ext.namespace('Ext.ux');

(function () {

    var UX = Ext.ux;

    var CLS = 'ux-date-time-picker';

    UX.DateTimePicker = Ext.extend(Ext.BoxComponent, {

        timeLabel: 'Time',

        timeFormat: 'H:i:s',

        changeTimeText: 'Change...',

        doneText: 'Done',

        initComponent: function () {
            UX.DateTimePicker.superclass.initComponent.call(this);

            this.addEvents('select');

            this.timePickerButton = new Ext.Button({
                text: this.changeTimeText,
                handler: this._showTimePicker,
                scope: this
            });

            this._initDatePicker();

            this.timeValue = new Date();

            if (this.value) {
                this.setValue(this.value);
                delete this.value;
            }
        },

        _initTimePicker: function () {
            if (!this.timeMenu) {
                var menuConfig = this.initialConfig.timeMenu;

                if (menuConfig && menuConfig.xtype) {
                    this.timeMenu = Ext.create(menuConfig);
                } else {                          
                    var picker = Ext.create(
                            Ext.applyIf(this.initialConfig.timePicker || {}, {
                                timeFormat: this.timeFormat
                            }),
                            'basetimepicker'
                            );
                    this.timeMenu = new Menu(picker, menuConfig || {});
                }

                if (!Ext.isFunction(this.timeMenu.getPicker)) {
                    throw 'Your time menu must provide the getPicker() method';
                }

                this.timeMenu.on('timeselect', this.onTimeSelect, this);
            }
        },

        _initDatePicker: function () {
            var config = this.initialConfig.datePicker || {};

            config.internalRender = this.initialConfig.internalRender;

            Ext.applyIf(config, {
                format: this.dateFormat || Ext.DatePicker.prototype.format
            });

            var picker = this.datePicker = Ext.create(config, 'datepicker');

            picker.update = picker.update.createSequence(function () {
                if (this.el != null && this.datePicker.rendered) {
                    var width = this.datePicker.el.getWidth();
                    this.el.setWidth(width + this.el.getBorderWidth('lr') + this.el.getPadding('lr'));
                }
            }, this);
        },

        _renderDatePicker: function (ct) {
            var picker = this.datePicker;

            picker.render(ct);

            var bottomEl = picker.getEl().child('.x-date-bottom');

            var size = bottomEl.getSize(true);
            var style = [
                'position: absolute',
                'bottom: 0',
                'left: 0',
                'overflow: hidden',
                'width: ' + size.width + 'px',
                'height: ' + size.height + 'px'
            ].join(';');

            var div = ct.createChild({
                tag: 'div',
                cls: 'x-date-bottom',
                style: style,
                children: [
                    {
                        tag: 'table',
                        cellspacing: 0,
                        style: 'width: 100%',
                        children: [
                            {
                                tag: 'tr',
                                children: [
                                    {
                                        tag: 'td',
                                        align: 'left'
                                    },
                                    {
                                        tag: 'td',
                                        align: 'right'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            if (picker.showToday) {
                var todayConfig = {};
                Ext.each(['text', 'tooltip', 'handler', 'scope'], function (key) {
                    todayConfig[key] = picker.todayBtn.initialConfig[key];
                });
                this.todayBtn = new Ext.Button(todayConfig).render(div.child('td:first'));
            }

            this.doneBtn = new Ext.Button({
                text: this.doneText,
                handler: this.onDone,
                scope: this
            }).render(div.child('td:last'));
        },

        _getFormattedTimeValue: function (date) {
            return date.format(this.timeFormat);
        },

        _renderValueField: function (ct) {
            var cls = CLS + '-value-ct';

            var timeLabel = !Ext.isEmpty(this.timeLabel)
                    ? '<span class="' + cls + '-value-label">' + this.timeLabel + ':</span>&nbsp;'
                    : '';

            var div = ct.insertFirst({
                tag: 'div',
                cls: [cls, 'x-date-bottom'].join(' ')
            });

            var table = div.createChild({
                tag: 'table',
                cellspacing: 0,
                style: 'width: 100%',
                children: [
                    {
                        tag: 'tr',
                        children: [
                            {
                                tag: 'td',
                                align: 'left',
                                cls: cls + '-value-cell',
                                html: '<div class="' + cls + '-value-wrap">'
                                        + timeLabel
                                        + '<span class="' + cls + '-value">'
                                        + this._getFormattedTimeValue(this.timeValue)
                                        + '</span>'
                                        + '</div>'
                            },
                            {
                                tag: 'td',
                                align: 'right',
                                cls: cls + '-btn-cell'
                            }
                        ]
                    }
                ]
            });

            this.timeValueEl = table.child('.' + cls + '-value');
            this.timeValueEl.on('click', this._showTimePicker, this);

            this.timePickerButton.render(table.child('td:last'));
        },

        onRender: function (ct, position) {
            this.el = ct.createChild({
                tag: 'div',
                cls: CLS,
                children: [
                    {
                        tag: 'div',
                        cls: CLS + '-inner'
                    }
                ]
            }, position);

            UX.DateTimePicker.superclass.onRender.call(this, ct, position);

            var innerEl = this.el.first();

            this._renderDatePicker(innerEl);

            this._renderValueField(innerEl);
        },

        _updateTimeValue: function (date) {
            this.timeValue = date;
            if (this.timeValueEl != null) {
                this.timeValueEl.update(this._getFormattedTimeValue(date));
            }
        },

        setValue: function (value) {
            this._updateTimeValue(value);
            this.datePicker.setValue(value.clone());
        },

        getValue: function () {
            var date = this.datePicker.getValue();

            var time = this.timeValue.getElapsed(this.timeValue.clone().clearTime());

            return new Date(date.getTime() + time);
        },

        onTimeSelect: function (menu, picker, value) {
            this._updateTimeValue(value);
        },

        _showTimePicker: function () {
            this._initTimePicker();
            this.timeMenu.getPicker().setValue(this.timeValue, false);

            if (this.timeMenu.isVisible()) {
                this.timeMenu.hide();
            } else {
                this.timeMenu.show(this.timePickerButton.el, null, this.parentMenu);
            }
        },

        onDone: function () {
            this.fireEvent('select', this, this.getValue());
        },

        destroy: function () {
            Ext.destroy(this.timePickerButton);
            this.timePickerButton = null;

            if (this.timeValueEl) {
                this.timeValueEl.remove();
                this.timeValueEl = null;
            }

            Ext.destroy(this.datePicker);
            this.datePicker = null;

            if (this.timeMenu) {
                Ext.destroy(this.timeMenu);
                this.timeMenu = null;
            }

            if (this.todayBtn) {
                Ext.destroy(this.todayBtn);
                this.todayBtn = null;
            }

            if (this.doneBtn) {
                Ext.destroy(this.doneBtn);
                this.doneBtn = null;
            }

            this.parentMenu = null;

            UX.DateTimePicker.superclass.destroy.call(this);
        }

    });

    Ext.reg('datetimepicker', UX.DateTimePicker);

    //

    var Menu = UX.DateTimePicker.Menu = Ext.extend(Ext.menu.Menu, {

        enableScrolling : false,

        hideOnClick: false,

        plain: true,

        showSeparator: false,

        constructor: function (picker, config) {
            config = config || {};

            if (config.picker) {
                delete config.picker;
            }

            this.picker = Ext.create(picker);

            Menu.superclass.constructor.call(this, Ext.applyIf({
                items: this.picker
            }, config));

            this.addEvents('timeselect');

            this.picker.on('select', this.onTimeSelect, this);
        },

        getPicker: function () {
            return this.picker;
        },

        onTimeSelect: function (picker, value) {
            this.hide();
            this.fireEvent('timeselect', this, picker, value);
        },

        destroy: function () {
            this.purgeListeners();

            this.picker = null;

            Menu.superclass.destroy.call(this);
        }

    });

})();Ext.namespace('Ext.ux.form');

(function () {

    var F = Ext.ux.form;

    var STRICT = Ext.isIE7 && Ext.isStrict;

    var Menu = Ext.extend(Ext.menu.Menu, {

        enableScrolling : false,

        plain: true,

        showSeparator: false,

        hideOnClick : true,

        pickerId : null,

        cls : 'x-date-menu x-date-time-menu',

        constructor: function (picker, config) {
            Menu.superclass.constructor.call(this, Ext.applyIf({
                items: picker
            }, config || {}));

            this.primaryPicker = picker;

            picker.parentMenu = this;

            this.on('beforeshow', this.onBeforeShow, this);

            this.strict = STRICT;

            if (this.strict) {
                this.on('show', this.onShow, this, { single: true, delay: 20 });
            }

            // black magic
            this.picker = picker.datePicker;

            this.relayEvents(picker, ['select']);
            this.on('show', picker.focus, picker);
            this.on('select', this.menuHide, this);

            if (this.handler) {
                this.on('select', this.handler, this.scope || this);
            }
        },

        menuHide : function () {
            if (this.hideOnClick) {
                this.hide(true);
            }
        },

        onBeforeShow : function () {
            if (this.picker) {
                this.picker.hideMonthPicker(true);
            }
        },

        onShow : function () {
            var el = this.picker.getEl();
            el.setWidth(el.getWidth()); // nasty hack for IE7 strict mode
        },

        destroy: function () {
            this.primaryPicker = null;
            this.picker = null;

            Menu.superclass.destroy.call(this);
        }

    });

    //

    //kirov
    F.DateTimeField = Ext.extend(Ext.m3.AdvancedDataField, {
    //F.DateTimeField = Ext.extend(Ext.form.DateField, {

        timeFormat: 'H:i:s',

        defaultAutoCreate : {
            tag: 'input',
            type: 'text',
            size: '22',
            autocomplete: 'off'
        },

        initComponent: function () {
            F.DateTimeField.superclass.initComponent.call(this);

            this.dateFormat = this.dateFormat || this.format;

            var picker = this._createPicker();

            this.format = this.dateFormat + ' ' + this.timeFormat;

            this.menu = new Menu(picker, {
                hideOnClick: false
            });
        },

        _createPicker: function () {
            var config = this.initialConfig.picker || {};

            Ext.apply(config, {
                ctCls: 'x-menu-date-item',
                internalRender: STRICT || !Ext.isIE
            });

            Ext.applyIf(config, {
                dateFormat: this.dateFormat,
                timeFormat: this.timeFormat
            });

            return Ext.create(config, 'datetimepicker');
        },

        onTriggerClick: function () {
            F.DateTimeField.superclass.onTriggerClick.apply(this, arguments);

            this.menu.primaryPicker.setValue(this.getValue() || new Date());
        }

    });

    Ext.reg('datetimefield', F.DateTimeField);
})();

// <kirov
// локализация
if(Ext.ux.DateTimePicker){
    Ext.ux.DateTimePicker.prototype.timeLabel = "Время";
    Ext.ux.DateTimePicker.prototype.changeTimeText = "Изменить...";
    Ext.ux.DateTimePicker.prototype.doneText = "ОК";
}

if(Ext.ux.BaseTimePicker){
    Ext.ux.BaseTimePicker.prototype.nowText = "Текущее";
    Ext.ux.BaseTimePicker.prototype.doneText = "ОК";
    Ext.ux.BaseTimePicker.prototype.hoursLabel = 'Часы';
    Ext.ux.BaseTimePicker.prototype.minsLabel = 'Минуты';
    Ext.ux.BaseTimePicker.prototype.secsLabel = 'Секунды';
}
// kirov>

// <kirov
(function () {

    var F = Ext.ux.form;

    var STRICT = Ext.isIE7 && Ext.isStrict;

    var Menu = Ext.extend(Ext.menu.Menu, {

        enableScrolling : false,

        hideOnClick: false,

        plain: true,

        showSeparator: false,

        constructor: function (picker, config) {
            config = config || {};

            if (config.picker) {
                delete config.picker;
            }

            this.picker = Ext.create(picker);

            Menu.superclass.constructor.call(this, Ext.applyIf({
                items: this.picker
            }, config));

            this.addEvents('timeselect');

            this.picker.on('select', this.onTimeSelect, this);
        },

        getPicker: function () {
            return this.picker;
        },

        onTimeSelect: function (picker, value) {
            this.hide();
            this.fireEvent('timeselect', this, picker, value);
        },

        destroy: function () {
            this.purgeListeners();

            this.picker = null;

            Menu.superclass.destroy.call(this);
        }

    });

    //kirov
    F.AdvTimeField = Ext.extend(Ext.m3.AdvancedDataField, {

        timeFormat: 'H:i:s',

        defaultAutoCreate : {
            tag: 'input',
            type: 'text',
            size: '22',
            autocomplete: 'off'
        },

        initComponent: function () {
            F.AdvTimeField.superclass.initComponent.call(this);

            this.dateFormat = this.dateFormat || this.format;

            var picker = this._createPicker();

            //this.format = this.dateFormat + ' ' + this.timeFormat;
            this.format = this.timeFormat;

            this.menu = new Menu(picker, {
                hideOnClick: false
            });
            this.menu.on('timeselect', this.onTimeSelect, this);
        },

        _createPicker: function () {
            var config = this.initialConfig.picker || {};

            Ext.apply(config, {
                ctCls: 'x-menu-date-item',
                internalRender: STRICT || !Ext.isIE
            });

            Ext.applyIf(config, {
                timeFormat: this.timeFormat
            });

            return Ext.create(config, 'basetimepicker');
        },

        onTriggerClick: function () {
            F.AdvTimeField.superclass.onTriggerClick.apply(this, arguments);

            this.menu.picker.setValue(this.getValue() || new Date());
        },

        onTimeSelect: function (menu, picker, value) {
            this._updateTimeValue(picker, value);
        },

        _updateTimeValue: function (picker) {
            var v = this.getValue() || new Date();
            v.setHours(picker.hourSlider.getValue());
            v.setMinutes(picker.minSlider.getValue());
            v.setSeconds(picker.secSlider.getValue());
            this.setValue(v);
        },

        setValue: function (value) {
            F.AdvTimeField.superclass.setValue.call(this, value);
        }

    });

    Ext.reg('advtimefield', F.AdvTimeField);
})();
//kirov >
Ext.ns('Ext.ux.form');

Ext.ux.form.FileUploadField = Ext.extend(Ext.form.TextField,  {

    /**
     * @cfg {Object} buttonCfg A standard {@link Ext.Button} config object.
     */

    // private
    readOnly: true

    /**
     * @hide
     * @method autoSize
     */
    ,autoSize: Ext.emptyFn

     /**
     * Класс иконки для выбора файла
     */
    ,iconClsSelectFile: 'x-form-file-icon'

    /**
     * Класс иконки для очистки файла
     */
    ,iconClsClearFile: 'x-form-file-clear-icon'

    /**
     * Класс иконки для скачивания файла
     */
    ,iconClsDownloadFile: 'x-form-file-download-icon'

    ,constructor: function(baseConfig, params){
        if (params) {
            if (params.prefixUploadField) {
                this.prefixUploadField = params.prefixUploadField;
            }
            if (params.fileUrl) {
                this.fileUrl = params.fileUrl;
            }                            
            if (baseConfig.readOnly) {
                this.readOnlyAll = true;
            }
            if (params.possibleFileExtensions) {
                this.possibleFileExtensions = params.possibleFileExtensions;
            }
        }

        Ext.ux.form.FileUploadField.superclass.constructor.call(this, baseConfig, params);
    }

    // private
    ,initComponent: function(){
        Ext.ux.form.FileUploadField.superclass.initComponent.call(this);

        this.addEvents(
            /**
             * @event fileselected
             * Fires when the underlying file input field's value has changed from the user
             * selecting a new file from the system file selection dialog.
             * @param {Ext.ux.form.FileUploadField} this
             * @param {String} value The file value returned by the underlying file input field
             */
            'fileselected',
            
            /**
             * Отрабатывает, когда изменилось значение
             */
            'change',
            
            /**
             * Событие, возникающее до изменения значения поля. Если вернуть false
             * то изменения поля не будет, true - изменить значение поля.
             */
            'beforechange'
        );
    }

    // private
    ,onRender : function(ct, position){
        Ext.ux.form.FileUploadField.superclass.onRender.call(this, ct, position);

        // Используем название файла
        this.value = this.getFileName();

        this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-file-wrap'});
        this.el.addClass('x-form-file-text');
        //this.el.dom.removeAttribute('name');

        this.createFileInput();

        var btnCfg = Ext.applyIf(this.buttonCfg || {}, {
            iconCls: this.iconClsSelectFile
        });
        this.buttonFile = new Ext.Button(Ext.apply(btnCfg, {
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-btn' + (btnCfg.iconCls ? ' x-btn-icon' : '')
            ,tooltip: {
                text:'Выбрать файл'
                ,width: 150
            }
        }));

        this.buttonClear = new Ext.Button({
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-clear'
            ,iconCls: this.iconClsClearFile
            ,handler: this.clickClearField
            ,scope: this
            ,hidden: this.value ? false : true
            ,tooltip: {
                text:'Очистить'
                ,width: 65
            }
        });

        this.renderHelperBtn();

        this.bindListeners();
        this.resizeEl = this.positionEl = this.wrap;

        if (this.readOnlyAll) {
            this.buttonFile.setDisabled(true);
            // Перекрывает невидимый индекс
            this.buttonFile.getEl().setStyle('z-index', 3);
            this.buttonClear.setDisabled(true);
            if (this.getHelperBtn() ) {
                this.getHelperBtn().setDisabled(true);
            }
        }

    }
    ,renderHelperBtn: function() {
        this.buttonDownload = new Ext.Button({
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-download'
            ,iconCls: this.iconClsDownloadFile
            ,handler: this.clickDownload
            ,scope: this
            ,hidden: this.value ? false : true
             ,tooltip: {
                text:'Загрузить'
                ,width: 65
            }
        });
    }
    ,getHelperBtn: function(){
        return this.buttonDownload;
    }
    ,bindListeners: function(){
        this.fileInput.on({
            scope: this,
            mouseenter: function() {
                this.buttonFile.addClass(['x-btn-over','x-btn-focus'])
            },
            mouseleave: function(){
                this.buttonFile.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
            },
            mousedown: function(){
                this.buttonFile.addClass('x-btn-click')
            },
            mouseup: function(){
                this.buttonFile.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
            },
             change: function(){
                 if (!this.isFileExtensionOK()){
                     Ext.Msg.show({
                       title:'Внимание'
                       ,msg: 'Неверное расширение файла'
                       ,buttons: Ext.Msg.OK
                       ,fn: Ext.emptyFn
                       ,animEl: 'elId'
                       ,icon: Ext.MessageBox.WARNING
                    });
                     this.reset();
                     return;
                 }
                 var v = this.fileInput.dom.value;
                 if (this.fireEvent('beforechange', this, v)) {	                 		                 
	                 this.setValue(v);
	                 this.fireEvent('fileselected', this, v);
	                 this.fireEvent('change', this, v);
	                 
	                 if (v) {
	                    // Очищаем ссылку на файл
	                    this.fileUrl = null;
	
	                    if (!this.buttonClear.isVisible()) {
	                        this.buttonClear.show();
	                        this.el.setWidth( this.el.getWidth() - this.buttonClear.getWidth());
	                    }
	                 }
                 }
             }
        });
    }

    ,createFileInput : function() {
        this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: (this.prefixUploadField || '') + this.name,
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1,
            width: 20
        });

        Ext.QuickTips.unregister(this.fileInput);
        Ext.QuickTips.register({
            target: this.fileInput,
            text: 'Выбрать файл',
            width: 86,
            dismissDelay: 10000
        });
    }

    ,reset : function(){
        this.fileInput.remove();
        this.createFileInput();
        this.bindListeners();
        Ext.ux.form.FileUploadField.superclass.reset.call(this);
    }

    // private
    ,getFileInputId: function(){
        return this.id + '-file';
    }

    // private
    ,onResize : function(w, h) {
        Ext.ux.form.FileUploadField.superclass.onResize.call(this, w, h);

        this.wrap.setWidth(w);

        var w = this.wrap.getWidth() - this.buttonFile.getEl().getWidth();
        var btnClearWidth = this.buttonClear.getWidth();
        if (btnClearWidth) {
            w -= btnClearWidth;
        }
        var btnDonwloadWidth = this.getHelperBtn() ? this.getHelperBtn().getWidth() : 0;
        if (btnDonwloadWidth) {
            w -= btnDonwloadWidth;
        }

        if (Ext.isWebKit) {
            // Юлядть
            // Некорректная верстка в вебкитовских движках
            this.el.setWidth(w + 5);
        } else {
            this.el.setWidth(w);
        }

    }

    // private
    ,onDestroy: function(){
        Ext.ux.form.FileUploadField.superclass.onDestroy.call(this);
        Ext.QuickTips.unregister(this.fileInput);
        Ext.destroy(this.fileInput, this.buttonFile, this.buttonClear,
            this.getHelperBtn(), this.wrap);
    }

    ,onDisable: function(){
        Ext.ux.form.FileUploadField.superclass.onDisable.call(this);
        this.doDisable(true);
    }

    ,onEnable: function(){
        Ext.ux.form.FileUploadField.superclass.onEnable.call(this);
        this.doDisable(false);

    }

    // private
    ,doDisable: function(disabled){
        this.fileInput.dom.disabled = disabled;
        this.buttonFile.setDisabled(disabled);
        this.buttonClear.setDisabled(disabled);
        if(this.getHelperBtn()) {
            this.getHelperBtn().setDisabled(disabled);
        }
    }

    // private
    ,preFocus : Ext.emptyFn

    // private
    ,alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    }

    //private
    ,clickClearField: function(){    	
    	if (this.fireEvent('beforechange', this, '')){
			this.clearFeild();
    	}
    }
	,clearFeild: function(){
		this.reset();
        this.setValue('');
        this.fireEvent('change', this, '');
        var width = this.el.getWidth() + this.buttonClear.getWidth();
        if (this.getHelperBtn()){
            width += (this.getHelperBtn().isVisible() ? this.getHelperBtn().getWidth() : 0);
            this.getHelperBtn().hide();
        }
        this.el.setWidth(width);
        this.buttonClear.hide();
	},
    
    getFileUrl: function(url){
        return document.location.protocol + '//' + document.location.host +
            '/' + url;
    }
    ,clickDownload: function(){
        var fUrl = this.getFileUrl(this.fileUrl);
        if (fUrl){
            window.open(fUrl);
        }
    }
    ,getFileName: function(){
    	return this.value ? this.value.split('/').reverse()[0] : "";
    }
    ,isFileExtensionOK: function(){
        var fileExtension = this.fileInput.dom.value.split('.');
        if (fileExtension.length > 0){
            //Поиск на существование элемента внутри массива
            return this.possibleFileExtensions ? this.possibleFileExtensions.split(',')
                    .indexOf(fileExtension[fileExtension.length-1].toLowerCase()) != -1 : true;
        }
        return false;
    }
    //override
    ,setReadOnly: function(readOnly){
         Ext.ux.form.FileUploadField.superclass.setReadOnly.call(this, readOnly);
    }
});

Ext.reg('fileuploadfield', Ext.ux.form.FileUploadField);

// backwards compat
Ext.form.FileUploadField = Ext.ux.form.FileUploadField;

Ext.ns('Ext.ux.form');

Ext.ux.form.ImageUploadField = Ext.extend(Ext.form.FileUploadField,  {

     /**
     * Класс иконки для выбора файла
     */
     iconClsSelectFile: 'x-form-image-icon'
    
    /**
     * Класс иконки для очистки файла 
     */
    ,iconClsClearFile: 'x-form-image-clear-icon'

    /**
     * Класс иконки для предпросмотра файла
     */
    ,iconClsPreviewImage: 'x-form-image-preview-icon'
    
    ,constructor: function(baseConfig, params){
        
        if (params) {
            if (params.thumbnailWidth) {
                this.thumbnailWidth = params.thumbnailWidth;
            }
            if (params.thumbnailHeight) {
                this.thumbnailHeight = params.thumbnailHeight;
            }
            if (params.prefixThumbnailImg) {
                this.prefixThumbnailImg = params.prefixThumbnailImg;
            }
            if (params.thumbnail) {
                this.thumbnail = params.thumbnail;
            }
            
        if (params.fileUrl) {
            var mass = params.fileUrl.split('/');
            var dir = mass.slice(0, mass.length - 1);
            var file_name = mass[mass.length-1];
            var prefix = this.prefixThumbnailImg || '';
            var url = String.format('{0}/{1}{2}', dir.join('/'), prefix, file_name);
            
            this.previewTip = new Ext.QuickTip({
                id: 'preview_tip_window',  
                html: String.format('<a href="{0}" rel="lightbox"><image src="{1}" WIDTH={2} HEIGHT={3} OnClick=Ext.getCmp("preview_tip_window").hide()></a>', 
                        params.fileUrl,
                        this.getFileUrl(url),
                        this.thumbnailWidth,
                        this.thumbnailHeight)
                ,autoHide: false
                ,width: this.thumbnailWidth + 10
                ,height: this.thumbnailHeight + 10
            });
        }
        }        
        
        Ext.ux.form.ImageUploadField.superclass.constructor.call(this, baseConfig, params);
    }     
    ,renderHelperBtn: function(){
        if (this.thumbnail) {
            this.buttonPreview = new Ext.Button({
                renderTo: this.wrap
                ,width: 16
                ,cls: 'x-form-file-download'
                ,iconCls: this.iconClsPreviewImage
                ,handler: this.clickHelperBtn
                ,scope: this
                ,hidden: this.value ? false : true
                ,tooltip: {
                    text: 'Предварительный показ'
                    ,width: 140
                }
            });
        }
    }
    ,getHelperBtn: function(){
        return this.buttonPreview;
    }
    ,clickHelperBtn: function(){
        var el = this.getEl();
        var xy = el.getXY()
        this.previewTip.showAt([xy[0], xy[1] + el.getHeight()]);
    }
    ,createFileInput : function() {
        this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: (this.prefixUploadField || '') + this.name,
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1,
            width: 20
        });
        
        Ext.QuickTips.unregister(this.fileInput);
        Ext.QuickTips.register({
            target: this.fileInput,
            text: 'Выбрать изображение',
            width: 130,
            dismissDelay: 10000 
        });
    }
    ,onDestroy: function(){
        Ext.ux.form.ImageUploadField.superclass.onDestroy.call(this);
        Ext.destroy(this.previewTip);
    }
});
// Регистрация lightbox
Ext.ux.Lightbox.register('a[rel^=lightbox]');
Ext.reg('imageuploadfield', Ext.ux.form.ImageUploadField);

/**
 * Функции рендера компонентов-контейнеров
 * @author: prefer
 */
/**
 * Создание расширенного дерева, на базе внешего компонента
 * @param {Object} baseConfig Базовый конфиг для компонента
 * @param {Object} params Дрополнительные параметра для правильной конф-ии
 */
function createAdvancedTreeGrid(baseConfig, params){
	return new Ext.m3.AdvancedTreeGrid(baseConfig, params);
}

/**
 * Создание грида
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createGridPanel(baseConfig, params){
  if (baseConfig.editor) {
    return new Ext.m3.EditorGridPanel(baseConfig, params);
  }
  else {
	  return new Ext.m3.GridPanel(baseConfig, params);
	}
}

/**
 * Создание объектного грида
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createObjectGrid(baseConfig, params){
  if (baseConfig.editor) {
    return new Ext.m3.EditorObjectGrid(baseConfig, params);
  }
  else {
	  return new Ext.m3.ObjectGrid(baseConfig, params);
	}
}

/**
 * Создание объектного дерева
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createObjectTree(baseConfig, params){
	return new Ext.m3.ObjectTree(baseConfig, params);
}

/**
 * Создание расширенного комбобокса
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createAdvancedComboBox(baseConfig, params){
	var adv_combo = new Ext.m3.AdvancedComboBox(baseConfig, params);
//	adv_combo.on('beforeselect',function(){
//		console.log('beforeselect');
//	});
//	adv_combo.on('beforequery',function(e){
//		
//		//e.cancel = true;
//		console.log('beforequery');
//	});
//	adv_combo.on('change',function(){
//		console.log('change');
//	});
//	adv_combo.on('beforerequest',function(){
//		console.log('beforerequest');
//		return false;
//	});
//	adv_combo.on('changed',function(){
//		console.log('changed');
//		//return false;
//	});
//		adv_combo.on('afterselect',function(){
//		console.log(arguments);
//		console.log('afterselect');
//		//return false;
//	});
	
	return adv_combo;
}

/**
 * Создание своего переопределенного компонента DateField
 * @param {Object} baseConfig
 */
function createAdvancedDataField(baseConfig, params){
	return new Ext.m3.AdvancedDataField(baseConfig, params);
}
/**
 * Здесь нужно перегружать объекты и дополнять функционал.
 * Этот файл подключается последним.
 */
 
/**
 * Нужно для правильной работы окна 
 */
Ext.onReady(function(){
	Ext.override(Ext.Window, {
	
	  /*
	   *  Если установлена модальность и есть родительское окно, то
	   *  флаг модальности помещается во временную переменную tmpModal, и 
	   *  this.modal = false;
	   */
	  tmpModal: false 
	  ,manager: new Ext.WindowGroup()
	  // 2011.01.14 kirov
	  // убрал, т.к. совместно с desktop.js это представляет собой гремучую смесь
	  // кому нужно - пусть прописывает Ext.getBody() в своем "десктопе" на onReady или когда хочет
	  //,renderTo: Ext.getBody().id
	  ,constrain: true
	  /**
	   * Выводит окно на передний план
	   * Вызывается в контексте дочернего 
	   * по отношению к parentWindow окну
	   */
	  ,activateChildWindow: function(){
	    this.toFront();
	  }
	  ,listeners: {
	
	    'beforeshow': function (){
                var renderTo = Ext.get(this.renderTo); 
                if ( renderTo ) {
                    if (renderTo.getHeight() < this.getHeight() ) 
                        this.setHeight( renderTo.getHeight() );
                }
				
				if (this.parentWindow) {
					
					this.parentWindow.setDisabled(true);
					
					/*
					 * В Extjs 3.3 Добавили общую проверку в функцию mask, см:
					 *  if (!(/^body/i.test(dom.tagName) && me.getStyle('position') == 'static')) {
	                    	me.addClass(XMASKEDRELATIVE);
	               		 }
					 * 
					 * было до версии 3.3: 
					 *  if(!/^body/i.test(dom.tagName) && me.getStyle('position') == 'static'){
		            		me.addClass(XMASKEDRELATIVE);
		        		}
					 * Теперь же расположение замаскированых окон должно быть относительным
					 * (relative) друг друга
					 * 
					 * Такое поведение нам не подходит и другого решения найдено не было.
					 * Кроме как удалять данный класс
					 * */
					this.parentWindow.el.removeClass('x-masked-relative');
	
					this.parentWindow.on('activate', this.activateChildWindow, this);
					
					this.modal = false;
					this.tmpModal = true;
	                
					if (window.AppDesktop) {
						var el = AppDesktop.getDesktop().taskbar.tbPanel.getTabWin(this.parentWindow);
						if (el) {
							el.mask();
						}
					}
				}
				if (this.modal){
					var taskbar = Ext.get('ux-taskbar');
					if (taskbar) {
	 					taskbar.mask();
					}
						var toptoolbar = Ext.get('ux-toptoolbar');
					if (toptoolbar) {
		 				toptoolbar.mask();
					}
				}
			}
			,'close': function (){
				if (this.tmpModal && this.parentWindow) {			
					this.parentWindow.un('activate', this.activateChildWindow, this);
					this.parentWindow.setDisabled(false);
					this.parentWindow.toFront();
	
					if (window.AppDesktop) {
						var el = AppDesktop.getDesktop().taskbar.tbPanel.getTabWin(this.parentWindow);
						if (el) {
							el.unmask();
						}
					}
				}
	
				if (this.modal){
	 				var taskbar = Ext.get('ux-taskbar');
					if (taskbar) {
	 					taskbar.unmask();
					}
						var toptoolbar = Ext.get('ux-toptoolbar');
					if (toptoolbar) {
		 				toptoolbar.unmask();
					}
				}
			}
			,'hide': function (){
				if (this.modal){
					if (!this.parentWindow) {
		 				var taskbar = Ext.get('ux-taskbar');
						if (taskbar) {
		 					taskbar.unmask();
						}
	 					var toptoolbar = Ext.get('ux-toptoolbar');
						if (toptoolbar) {
			 				toptoolbar.unmask();
						}
					}
				}
			}
		}
	}); 
})
/**
 * Обновим TreeGrid чтобы колонки занимали всю ширину дерева
 */
Ext.override(Ext.ux.tree.TreeGrid, {
	
	// добавлено
	fitColumns: function() {
        var nNewTotalWidth = this.getInnerWidth() - Ext.num(this.scrollOffset, Ext.getScrollBarWidth());
        var nOldTotalWidth = this.getTotalColumnWidth();
        var cs = this.getVisibleColumns();
        var n, nUsed = 0;
        
        for (n = 0; n < cs.length; n++) {
            if (n == cs.length - 1) {
                cs[n].width = nNewTotalWidth - nUsed - 1;
                break;
            }
            cs[n].width = Math.floor((nNewTotalWidth / 100) * (cs[n].width * 100 / nOldTotalWidth)) - 1;
            nUsed += cs[n].width;
        }
        
        this.updateColumnWidths();
    },
	// <--
	onResize : function(w, h) {
        Ext.ux.tree.TreeGrid.superclass.onResize.apply(this, arguments);
        
        var bd = this.innerBody.dom;
        var hd = this.innerHd.dom;

        if(!bd){
            return;
        }

        if(Ext.isNumber(h)){
            bd.style.height = this.body.getHeight(true) - hd.offsetHeight + 'px';
        }

        if(Ext.isNumber(w)){                        
            var sw = Ext.num(this.scrollOffset, Ext.getScrollBarWidth());
            if(this.reserveScrollOffset || ((bd.offsetWidth - bd.clientWidth) > 10)){
                this.setScrollOffset(sw);
            }else{
                var me = this;
                setTimeout(function(){
                    me.setScrollOffset(bd.offsetWidth - bd.clientWidth > 10 ? sw : 0);
                }, 10);
            }
        }
		this.fitColumns(); // добавилась/заменила
    }
}); 

Ext.override(Ext.tree.ColumnResizer, {

    onEnd : function(e){
        var nw = this.proxy.getWidth(),
            tree = this.tree;
        
        this.proxy.remove();
        delete this.dragHd;
        
        tree.columns[this.hdIndex].width = nw;
        //tree.updateColumnWidths(); // закомментировано
		tree.fitColumns();			// добавлено
        
        setTimeout(function(){
            tree.headersDisabled = false;
        }, 100);
    }
});

/**
 * Обновим ячейку дерева чтобы при двойном клике не открывались/сворачивались дочерние узлы
 */
Ext.override(Ext.tree.TreeNodeUI, {
	onDblClick : function(e){
        e.preventDefault();
        if(this.disabled){
            return;
        }
        if(this.fireEvent("beforedblclick", this.node, e) !== false){
            if(this.checkbox){
                this.toggleCheck();
            }
			// закомментировано. 
            //if(!this.animating && this.node.isExpandable()){
            //    this.node.toggle();
            //}
            this.fireEvent("dblclick", this.node, e);
        }
    }
});
/**
 * Исправим ошибку, когда значения emptyText в композитном поле передаются на сервер, даже если установлен признак "не передавать"
 */
Ext.override(Ext.form.Action.Submit, {
	run : function(){
        var o = this.options,
            method = this.getMethod(),
            isGet = method == 'GET';
        if(o.clientValidation === false || this.form.isValid()){
            if (o.submitEmptyText === false) {
                var fields = this.form.items,
                    emptyFields = [];
                fields.each(function(f) {
                    assert(f.el, "Возможно у вас непроинициализировались некоторые поля для отправки. Обратите внимание на TabPanel'и.");
                    if (f.el.getValue() == f.emptyText) {
                        emptyFields.push(f);
                        f.el.dom.value = "";
                    }
					// Добавилось
                    // вот тут сделаем добавку
                    if (f instanceof Ext.form.CompositeField) {
                        f.items.each(function(cf) {
                            if (cf.el.getValue() == cf.emptyText) {
                                emptyFields.push(cf);
                                cf.el.dom.value = "";
                            }
                        });
                    }
					// <--
                });
            }
            Ext.Ajax.request(Ext.apply(this.createCallback(o), {
                form:this.form.el.dom,
                url:this.getUrl(isGet),
                method: method,
                headers: o.headers,
                params:!isGet ? this.getParams() : null,
                isUpload: this.form.fileUpload
            }));
            if (o.submitEmptyText === false) {
                Ext.each(emptyFields, function(f) {
                    if (f.applyEmptyText) {
                        f.applyEmptyText();
                    }
                });
            }
        }else if (o.clientValidation !== false){ // client validation failed
            this.failureType = Ext.form.Action.CLIENT_INVALID;
            this.form.afterAction(this, false);
        }
    }
});

/**
 * Метод  вызывается и при клике и при событии change - сюда добавлена обработка
 * атрибута readOnly, тк в стандартном поведении браузеры обрабаытвают этот атрибут только
 * у текстоввых полей
 */
Ext.override(Ext.form.Checkbox, {
    onClick : function(e){
        if (this.readOnly) {
            e.stopEvent();
            return false;
        }

        if(this.el.dom.checked != this.checked){
            this.setValue(this.el.dom.checked);
        }
    }
});

/**
 * Раньше нельзя было перейти на конкретную страницу в движках webkit. Т.к.
 * Событие PagingBlur наступает раньше pagingChange, и обновлялась текущая 
 * страница, т.к. PagingBlur обновляет индекс.
 */
Ext.override(Ext.PagingToolbar, {
    onPagingBlur: Ext.emptyFn
});

/*
 * Проблема скроллинга хидеров в компонентах ExtPanel или ExtFieldSet
 * (Скролятся только хидеры)
 */

if  (Ext.isIE7 || Ext.isIE6) {
    Ext.Panel.override({
        setAutoScroll: function() {
        if (this.rendered && this.autoScroll) {
            var el = this.body || this.el;
        if (el) {
            el.setOverflow('auto');
            // Following line required to fix autoScroll
            el.dom.style.position = 'relative';
            }
        }
        }
    });
}    
    
/**
 * добавим поддержку чекбоксов по аналогии с TreePanel
 * чек боксы включаются просто передачей checked в сторе 
 */
Ext.override(Ext.ux.tree.TreeGridNodeUI, {
    renderElements : function(n, a, targetNode, bulkRender){
        var t = n.getOwnerTree(),
            cb = Ext.isBoolean(a.checked),
            cb = Ext.isBoolean(a.checked),
            cols = t.columns,
            c = cols[0],
            i, buf, len;

        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';

        buf = [
             '<tbody class="x-tree-node">',
                '<tr ext:tree-node-id="', n.id ,'" class="x-tree-node-el x-tree-node-leaf x-unselectable ', a.cls, '">',
                    '<td class="x-treegrid-col">',
                        '<span class="x-tree-node-indent">', this.indentMarkup, "</span>",
                        '<img src="', this.emptyIcon, '" class="x-tree-ec-icon x-tree-elbow" />',
                        '<img src="', a.icon || this.emptyIcon, '" class="x-tree-node-icon', (a.icon ? " x-tree-node-inline-icon" : ""), (a.iconCls ? " "+a.iconCls : ""), '" unselectable="on" />',
                        cb ? ('<input class="x-tree-node-cb" type="checkbox" ' + (a.checked ? 'checked="checked" />' : '/>')) : '',
                        '<a hidefocus="on" class="x-tree-node-anchor" href="', a.href ? a.href : '#', '" tabIndex="1" ',
                            a.hrefTarget ? ' target="'+a.hrefTarget+'"' : '', '>',
                        '<span unselectable="on">', (c.tpl ? c.tpl.apply(a) : a[c.dataIndex] || c.text), '</span></a>',
                    '</td>'
        ];

        for(i = 1, len = cols.length; i < len; i++){
            c = cols[i];
            buf.push(
                    '<td class="x-treegrid-col ', (c.cls ? c.cls : ''), '">',
                        '<div unselectable="on" class="x-treegrid-text"', (c.align ? ' style="text-align: ' + c.align + ';"' : ''), '>',
                            (c.tpl ? c.tpl.apply(a) : a[c.dataIndex]),
                        '</div>',
                    '</td>'
            );
        }

        buf.push(
            '</tr><tr class="x-tree-node-ct"><td colspan="', cols.length, '">',
            '<table class="x-treegrid-node-ct-table" cellpadding="0" cellspacing="0" style="table-layout: fixed; display: none; width: ', t.innerCt.getWidth() ,'px;"><colgroup>'
        );
        for(i = 0, len = cols.length; i<len; i++) {
            buf.push('<col style="width: ', (cols[i].hidden ? 0 : cols[i].width) ,'px;" />');
        }
        buf.push('</colgroup></table></td></tr></tbody>');

        if(bulkRender !== true && n.nextSibling && n.nextSibling.ui.getEl()){
            this.wrap = Ext.DomHelper.insertHtml("beforeBegin", n.nextSibling.ui.getEl(), buf.join(''));
        }else{
            this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf.join(''));
        }

        this.elNode = this.wrap.childNodes[0];
        this.ctNode = this.wrap.childNodes[1].firstChild.firstChild;
        var cs = this.elNode.firstChild.childNodes;
        this.indentNode = cs[0];
        this.ecNode = cs[1];
        this.iconNode = cs[2];
        index = 3;
        if(cb){
            this.checkbox = cs[3];
            // fix for IE6
            this.checkbox.defaultChecked = this.checkbox.checked;
            index++;
        }
        this.anchor = cs[index];
        this.textNode = cs[index].firstChild;
    }
});
    
/**
 * добавим поддержку чекбоксов по аналогии с TreePanel
 * чек боксы включаются просто передачей checked в сторе 
 */
Ext.override(Ext.ux.tree.TreeGrid, {

    /**
     * Retrieve an array of checked nodes, or an array of a specific attribute of checked nodes (e.g. 'id')
     * @param {String} attribute (optional) Defaults to null (return the actual nodes)
     * @param {TreeNode} startNode (optional) The node to start from, defaults to the root
     * @return {Array}
     */
    getChecked : function(a, startNode){
        startNode = startNode || this.root;
        var r = [];
        var f = function(){
            if(this.attributes.checked){
                r.push(!a ? this : (a == 'id' ? this.id : this.attributes[a]));
            }
        };
        startNode.cascade(f);
        return r;
    }
});

/**
 * По-умолчанию ExtJS отправляет за картинкой на 'http://www.extjs.com/s.gif'
 * Тут укажем что они не правы
 */
Ext.apply(Ext, function(){
    return {
        BLANK_IMAGE_URL : Ext.isIE6 || Ext.isIE7 || Ext.isAir ?
            '/m3static/vendor/extjs/resources/images/default/s.gif' :
            'data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
    };
}());


/**
 * Исправление поведения Ext.ComboBox, когда значения списка с value '' и 0
 * считаются идентичными: теперь сравнение происходит с приведением к строке.
 * Описание ошибки и патч отсюда: http://www.sencha.com/forum/showthread.php?79285
 */
Ext.override(Ext.form.ComboBox, {
    findRecord : function(prop, value){
        var record;
        if(this.store.getCount() > 0){
            this.store.each(function(r){
                if(String(r.data[prop]) == String(value)){
                    record = r;
                    return false;
                }
            });
        }
        return record;
    }
});

/**
 * Добавление/удаление пользовательского класса m3-grey-field после использования
 * setReadOnly для Ext.form.Field и Ext.form.TriggerField
 * см m3.css - стр. 137 .m3-grey-field
 */
var setReadOnlyField = Ext.form.Field.prototype.setReadOnly;
var restoreClass = function(readOnly){
    if(readOnly) {         
        this.addClass('m3-grey-field');
    } else {
        this.removeClass('m3-grey-field');
    }
}
Ext.override(Ext.form.Field, {
    setReadOnly : function(readOnly){
        setReadOnlyField.call(this, readOnly);
        restoreClass.call(this, readOnly);
    }
});
var setReadOnlyTriggerField = Ext.form.TriggerField.prototype.setReadOnly;
Ext.override(Ext.form.TriggerField, {
    setReadOnly : function(readOnly){
        setReadOnlyTriggerField.call(this, readOnly);
        restoreClass.call(this, readOnly);
    }
});

