/*!
 * Ext JS Library 3.3.0
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
/**
 * @class Ext.ux.StartMenu
 * @extends Ext.menu.Menu
 * A start menu object.
 * @constructor
 * Creates a new StartMenu
 * @param {Object} config Configuration options
 *
 * SAMPLE USAGE:
 *
 * this.startMenu = new Ext.ux.StartMenu({
 *      iconCls: 'user',
 *      height: 300,
 *      shadow: true,
 *      title: get_cookie('memberName'),
 *      width: 300
 *  });
 *
 * this.startMenu.add({
 *      text: 'Grid Window',
 *      iconCls:'icon-grid',
 *      handler : this.createWindow,
 *      scope: this
 *  });
 *
 * this.startMenu.addTool({
 *      text:'Logout',
 *      iconCls:'logout',
 *      handler:function(){ window.location = "logout.php"; },
 *      scope:this
 *  });
 */

Ext.namespace("Ext.ux");

Ext.ux.StartMenu = Ext.extend(Ext.menu.Menu, {
    toolsPanelWidth: 100,
    initComponent: function(config) {
        Ext.ux.StartMenu.superclass.initComponent.call(this, config);
		this.items = new Ext.util.MixedCollection();
        var tools = this.toolItems;
        this.toolItems = new Ext.util.MixedCollection();
        if(tools){
            this.addTool.apply(this, tools);
        }
    },

    // private
    onRender : function (ct, position) {
        Ext.ux.StartMenu.superclass.onRender.call(this, ct, position);
        var el = this.el.addClass('ux-start-menu');

        var header = el.createChild({
            tag: "div",
            cls: "x-window-header x-unselectable x-panel-icon "+this.iconCls
        });

        this.header = header;

        var headerText = header.createChild({
            tag: "span",
            cls: "x-window-header-text"
        });
        var tl = header.wrap({
            cls: "ux-start-menu-tl"
        });
        var tr = header.wrap({
            cls: "ux-start-menu-tr"
        });
        var tc = header.wrap({
            cls: "ux-start-menu-tc"
        });

        this.menuBWrap = el.createChild({
            tag: "div",
            cls: "x-window-body x-border-layout-ct ux-start-menu-body"
        });
        var ml = this.menuBWrap.wrap({
            cls: "ux-start-menu-ml"
        });
        var mc = this.menuBWrap.wrap({
            cls: "x-window-mc ux-start-menu-bwrap"
        });

        this.menuPanel = this.menuBWrap.createChild({
            tag: "div",
            cls: "x-panel x-border-panel ux-start-menu-apps-panel"
        });
        this.toolsPanel = this.menuBWrap.createChild({
            tag: "div",
            cls: "x-panel x-border-panel ux-start-menu-tools-panel"
        });

        var bwrap = ml.wrap({cls: "x-window-bwrap"});
        var bc = bwrap.createChild({
            tag: "div",
            cls: "ux-start-menu-bc"
        });
        var bl = bc.wrap({
            cls: "ux-start-menu-bl x-panel-nofooter"
        });
        var br = bc.wrap({
            cls: "ux-start-menu-br"
        });

        this.ul.appendTo(this.menuPanel);

        var toolsUl = this.toolsPanel.createChild({
            tag: "ul",
            cls: "x-menu-list"
        });

        this.mon(toolsUl, 'click', this.onClick, this);
        this.mon(toolsUl, 'mouseover', this.onMouseOver, this);
        this.mon(toolsUl, 'mouseout', this.onMouseOut, this);

        this.items.each(function(item){
            item.parentMenu = this;
        }, this);

        this.toolItems.each(
            function(item){
                var li = document.createElement("li");
                li.className = "x-menu-list-item";
                toolsUl.dom.appendChild(li);
                item.render(li);
                item.parentMenu = this;
            }, this);

        this.toolsUl = toolsUl;

        this.menuBWrap.setStyle('position', 'relative');
        this.menuBWrap.setHeight(this.height - 28);

        this.menuPanel.setStyle({
            padding: '2px',
            position: 'absolute',
            overflow: 'auto'
        });

        this.toolsPanel.setStyle({
            padding: '2px 4px 2px 2px',
            position: 'absolute',
            overflow: 'auto'
        });

        this.setTitle(this.title);
    },

    // private
    findTargetItem : function(e){
        var t = e.getTarget(".x-menu-list-item", this.ul,  true);
        if(t && t.menuItemId){
            if(this.items.get(t.menuItemId)){
                return this.items.get(t.menuItemId);
            }else{
                return this.toolItems.get(t.menuItemId);
            }
        }
    },

    /**
     * Displays this menu relative to another element
     * @param {Mixed} element The element to align to
     * @param {String} position (optional) The {@link Ext.Element#alignTo} anchor position to use in aligning to
     * the element (defaults to this.defaultAlign)
     * @param {Ext.ux.StartMenu} parentMenu (optional) This menu's parent menu, if applicable (defaults to undefined)
     */
    show : function (el, pos, parentMenu) {
        this.parentMenu = parentMenu;
        if(!this.el){
            this.render();
        }

        this.fireEvent("beforeshow", this);
        var posArray = this.el.getAlignToXY(el, pos || this.defaultAlign)
        //kir add 15.03.2011
        // Если taskbar находится вверху, делается переназначение положения.
        posArray[1] = posArray[1] < 0 ? el.getHeight() : posArray[1]
        this.showAt(posArray ,parentMenu, false);

        var tPanelWidth = this.toolsPanelWidth;
        var box = this.menuBWrap.getBox();
        this.menuPanel.setWidth(box.width-tPanelWidth);
        this.menuPanel.setHeight(box.height);

        this.toolsPanel.setWidth(tPanelWidth);
        this.toolsPanel.setX(box.x+box.width-tPanelWidth);
        this.toolsPanel.setHeight(box.height);
    },

    addTool : function(){
        var a = arguments, l = a.length, item;
        for(var i = 0; i < l; i++){
            var el = a[i];
            if(el.text == '-'){
                item = this.addToolSeparator();
            }else if(el.render){ // some kind of Item
                item = this.addToolItem(el);
            }else if(typeof el == "string"){ // string
                if(el == "separator" || el == "-"){
                    item = this.addToolSeparator();
                }else{
                    item = this.addText(el);
                }
            }else if(el.tagName || el.el){ // element
                item = this.addElement(el);
            }else if(typeof el == "object"){ // must be menu item config?
                item = this.addToolMenuItem(el);
            }
        }
        return item;
    },

    /**
     * Adds a separator bar to the Tools
     * @return {Ext.menu.Item} The menu item that was added
     */
    addToolSeparator : function(){
        return this.addToolItem(new Ext.menu.Separator({itemCls: 'ux-toolmenu-sep'}));
    },

    addToolItem : function(item){
        this.toolItems.add(item);
        if(this.ul){
            var li = document.createElement("li");
            li.className = "x-menu-list-item";
            this.ul.dom.appendChild(li);
            item.render(li, this);
            this.delayAutoWidth();
        }
        return item;
    },

    addToolMenuItem : function(config){
        if(!(config instanceof Ext.menu.Item)){
            if(typeof config.checked == "boolean"){ // must be check menu item config?
                config = new Ext.menu.CheckItem(config);
            }else{
                config = new Ext.menu.Item(config);
            }
        }
        return this.addToolItem(config);
    },

    setTitle : function(title, iconCls){
        this.title = title;
        this.header.child('span').update(title);
        return this;
    }
});


/*!
 * Ext JS Library 3.3.0
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
/**
 * @class Ext.ux.TaskBar
 * @extends Ext.util.Observable
 */
Ext.ux.TaskBar = function(app){
    this.app = app;
    this.init();
}

Ext.extend(Ext.ux.TaskBar, Ext.util.Observable, {
    init : function(){
        this.startMenu = new Ext.ux.StartMenu(Ext.apply({
            iconCls: 'user',
            height: 360,
            shadow: true,
            title: 'Jack Slocum',
            width: 300
        }, this.app.startConfig));

        this.startBtn = new Ext.Button({
            text: 'Пуск',
            id: 'ux-startbutton',
            iconCls:'start',
            menu: this.startMenu,
            menuAlign: 'bl-tl',
            renderTo: 'ux-taskbar-start',
            clickEvent: 'mousedown',
            template: new Ext.Template(
                '<table cellspacing="0" class="x-btn {3}"><tbody><tr>',
                '<td class="ux-startbutton-left"><i>&#160;</i></td>',
                '<td class="ux-startbutton-center"><em class="{5} unselectable="on">',
                    '<button class="x-btn-text {2}" type="{1}" style="height:30px;">{0}</button>',
                '</em></td>',
                '<td class="ux-startbutton-right"><i>&#160;</i></td>',
                "</tr></tbody></table>")
        });

        var width = this.startBtn.getEl().getWidth()+10;

        var sbBox = new Ext.BoxComponent({
            el: 'ux-taskbar-start',
            id: 'TaskBarStart',
            minWidth: width,
            region:'west',
            split: true,
            width: width
        });

        this.tbPanel = new Ext.ux.TaskButtonsPanel({
            el: 'ux-taskbuttons-panel',
            id: 'TaskBarButtons',
            region:'center'
        });

        var container = new Ext.ux.TaskBarContainer({
            el: 'ux-taskbar',
            layout: 'border',
            items: [sbBox,this.tbPanel]
        });

        return this;
    },

    addTaskButton : function(win){
        return this.tbPanel.addButton(win, 'ux-taskbuttons-panel');
    },

    removeTaskButton : function(btn){
        this.tbPanel.removeButton(btn);
    },

    setActiveButton : function(btn){
        this.tbPanel.setActiveButton(btn);
    }
});



/**
 * @class Ext.ux.TaskBarContainer
 * @extends Ext.Container
 */
Ext.ux.TaskBarContainer = Ext.extend(Ext.Container, {
    initComponent : function() {
        Ext.ux.TaskBarContainer.superclass.initComponent.call(this);

        this.el = Ext.get(this.el) || Ext.getBody();
        this.el.setHeight = Ext.emptyFn;
        this.el.setWidth = Ext.emptyFn;
        this.el.setSize = Ext.emptyFn;
        this.el.setStyle({
            overflow:'hidden',
            margin:'0',
            border:'0 none'
        });
        this.el.dom.scroll = 'no';
        this.allowDomMove = false;
        this.autoWidth = true;
        this.autoHeight = true;
        Ext.EventManager.onWindowResize(this.fireResize, this);
        this.renderTo = this.el;
    },

    fireResize : function(w, h){
        this.onResize(w, h, w, h);
        this.fireEvent('resize', this, w, h, w, h);
    }
});



/**
 * @class Ext.ux.TaskButtonsPanel
 * @extends Ext.BoxComponent
 */
Ext.ux.TaskButtonsPanel = Ext.extend(Ext.BoxComponent, {
    activeButton: null,
    enableScroll: true,
    scrollIncrement: 0,
    scrollRepeatInterval: 400,
    scrollDuration: 0.35,
    animScroll: true,
    resizeButtons: true,
    buttonWidth: 168,
    minButtonWidth: 118,
    buttonMargin: 2,
    buttonWidthSet: false,

    initComponent : function() {
        Ext.ux.TaskButtonsPanel.superclass.initComponent.call(this);
        this.on('resize', this.delegateUpdates);

        this.items = [];

        this.stripWrap = Ext.get(this.el).createChild({
            cls: 'ux-taskbuttons-strip-wrap',
            cn: {
                tag:'ul', cls:'ux-taskbuttons-strip'
            }
        });
        this.stripSpacer = Ext.get(this.el).createChild({
            cls:'ux-taskbuttons-strip-spacer'
        });
        this.strip = new Ext.Element(this.stripWrap.dom.firstChild);

        this.edge = this.strip.createChild({
            tag:'li',
            cls:'ux-taskbuttons-edge'
        });
        this.strip.createChild({
            cls:'x-clear'
        });
    },

    addButton : function(win){
        var li = this.strip.createChild({tag:'li'}, this.edge); // insert before the edge
        var btn = new Ext.ux.TaskBar.TaskButton(win, li);

        this.items.push(btn);

        if(!this.buttonWidthSet){
            this.lastButtonWidth = btn.container.getWidth();
        }

        this.setActiveButton(btn);
        return btn;
    },

    removeButton : function(btn){
        var li = document.getElementById(btn.container.id);
        btn.destroy();
        li.parentNode.removeChild(li);

        var s = [];
        for(var i = 0, len = this.items.length; i < len; i++) {
            if(this.items[i] != btn){
                s.push(this.items[i]);
            }
        }
        this.items = s;

        this.delegateUpdates();
    },

    setActiveButton : function(btn){
        this.activeButton = btn;
        this.delegateUpdates();
    },

    delegateUpdates : function(){
        /*if(this.suspendUpdates){
            return;
        }*/
        if(this.resizeButtons && this.rendered){
            this.autoSize();
        }
        if(this.enableScroll && this.rendered){
            this.autoScroll();
        }
    },

    autoSize : function(){
        var count = this.items.length;
        var ow = this.el.dom.offsetWidth;
        var aw = this.el.dom.clientWidth;

        if(!this.resizeButtons || count < 1 || !aw){ // !aw for display:none
            return;
        }

        var each = Math.max(Math.min(Math.floor((aw-4) / count) - this.buttonMargin, this.buttonWidth), this.minButtonWidth); // -4 for float errors in IE
        var btns = this.stripWrap.dom.getElementsByTagName('button');

        this.lastButtonWidth = Ext.get(btns[0].id).findParent('li').offsetWidth;

        for(var i = 0, len = btns.length; i < len; i++) {
            var btn = btns[i];

            var tw = Ext.get(btns[i].id).findParent('li').offsetWidth;
            var iw = btn.offsetWidth;

            btn.style.width = (each - (tw-iw)) + 'px';
        }
    },

    autoScroll : function(){
        var count = this.items.length;
        var ow = this.el.dom.offsetWidth;
        var tw = this.el.dom.clientWidth;

        var wrap = this.stripWrap;
        var cw = wrap.dom.offsetWidth;
        var pos = this.getScrollPos();
        var l = this.edge.getOffsetsTo(this.stripWrap)[0] + pos;

        if(!this.enableScroll || count < 1 || cw < 20){ // 20 to prevent display:none issues
            return;
        }

        wrap.setWidth(tw); // moved to here because of problem in Safari

        if(l <= tw){
            wrap.dom.scrollLeft = 0;
            //wrap.setWidth(tw); moved from here because of problem in Safari
            if(this.scrolling){
                this.scrolling = false;
                this.el.removeClass('x-taskbuttons-scrolling');
                this.scrollLeft.hide();
                this.scrollRight.hide();
            }
        }else{
            if(!this.scrolling){
                this.el.addClass('x-taskbuttons-scrolling');
            }
            tw -= wrap.getMargins('lr');
            wrap.setWidth(tw > 20 ? tw : 20);
            if(!this.scrolling){
                if(!this.scrollLeft){
                    this.createScrollers();
                }else{
                    this.scrollLeft.show();
                    this.scrollRight.show();
                }
            }
            this.scrolling = true;
            if(pos > (l-tw)){ // ensure it stays within bounds
                wrap.dom.scrollLeft = l-tw;
            }else{ // otherwise, make sure the active button is still visible
                this.scrollToButton(this.activeButton, true); // true to animate
            }
            this.updateScrollButtons();
        }
    },

    createScrollers : function(){
        var h = this.el.dom.offsetHeight; //var h = this.stripWrap.dom.offsetHeight;

        // left
        var sl = this.el.insertFirst({
            cls:'ux-taskbuttons-scroller-left'
        });
        sl.setHeight(h);
        sl.addClassOnOver('ux-taskbuttons-scroller-left-over');
        this.leftRepeater = new Ext.util.ClickRepeater(sl, {
            interval : this.scrollRepeatInterval,
            handler: this.onScrollLeft,
            scope: this
        });
        this.scrollLeft = sl;

        // right
        var sr = this.el.insertFirst({
            cls:'ux-taskbuttons-scroller-right'
        });
        sr.setHeight(h);
        sr.addClassOnOver('ux-taskbuttons-scroller-right-over');
        this.rightRepeater = new Ext.util.ClickRepeater(sr, {
            interval : this.scrollRepeatInterval,
            handler: this.onScrollRight,
            scope: this
        });
        this.scrollRight = sr;
    },

    getScrollWidth : function(){
        return this.edge.getOffsetsTo(this.stripWrap)[0] + this.getScrollPos();
    },

    getScrollPos : function(){
        return parseInt(this.stripWrap.dom.scrollLeft, 10) || 0;
    },

    getScrollArea : function(){
        return parseInt(this.stripWrap.dom.clientWidth, 10) || 0;
    },

    getScrollAnim : function(){
        return {
            duration: this.scrollDuration,
            callback: this.updateScrollButtons,
            scope: this
        };
    },

    getScrollIncrement : function(){
        return (this.scrollIncrement || this.lastButtonWidth+2);
    },

    /* getBtnEl : function(item){
        return document.getElementById(item.id);
    }, */

    scrollToButton : function(item, animate){
        item = item.el.dom.parentNode; // li
        if(!item){ return; }
        var el = item; //this.getBtnEl(item);
        var pos = this.getScrollPos(), area = this.getScrollArea();
        var left = Ext.fly(el).getOffsetsTo(this.stripWrap)[0] + pos;
        var right = left + el.offsetWidth;
        if(left < pos){
            this.scrollTo(left, animate);
        }else if(right > (pos + area)){
            this.scrollTo(right - area, animate);
        }
    },

    scrollTo : function(pos, animate){
        this.stripWrap.scrollTo('left', pos, animate ? this.getScrollAnim() : false);
        if(!animate){
            this.updateScrollButtons();
        }
    },

    onScrollRight : function(){
        var sw = this.getScrollWidth()-this.getScrollArea();
        var pos = this.getScrollPos();
        var s = Math.min(sw, pos + this.getScrollIncrement());
        if(s != pos){
            this.scrollTo(s, this.animScroll);
        }
    },

    onScrollLeft : function(){
        var pos = this.getScrollPos();
        var s = Math.max(0, pos - this.getScrollIncrement());
        if(s != pos){
            this.scrollTo(s, this.animScroll);
        }
    },

    updateScrollButtons : function(){
        var pos = this.getScrollPos();
        this.scrollLeft[pos == 0 ? 'addClass' : 'removeClass']('ux-taskbuttons-scroller-left-disabled');
        this.scrollRight[pos >= (this.getScrollWidth()-this.getScrollArea()) ? 'addClass' : 'removeClass']('ux-taskbuttons-scroller-right-disabled');
    }
	
	// prefer add 26.07.10
	// Поиск по win id
	,getTabWin: function(window) {
		
		for (var i=0; i< this.items.length; i++){
			if(this.items[i].win === window) {
				return this.items[i].container;
			}
		}
	}
	
});



/**
 * @class Ext.ux.TaskBar.TaskButton
 * @extends Ext.Button
 */
Ext.ux.TaskBar.TaskButton = function(win, el){
    this.win = win;
    Ext.ux.TaskBar.TaskButton.superclass.constructor.call(this, {
        iconCls: win.iconCls,
        text: Ext.util.Format.ellipsis(win.title, win.iconCls ? 25 : 29),
        tooltip: win.title,
        renderTo: el,
        handler : function(){
			if (!win.masked){
				if (win.minimized || win.hidden) {
					win.show();
				}
				else 
					if (win == win.manager.getActive() && win.minimizable) {
						win.minimize();
					}
					else {
						win.toFront();
					}
            }
        },
        clickEvent:'mousedown',
        template: new Ext.Template(
            '<table cellspacing="0" class="x-btn {3}"><tbody><tr>',
            '<td class="ux-taskbutton-left"><i>&#160;</i></td>',
            '<td class="ux-taskbutton-center"><em class="{5} unselectable="on">',
                '<button class="x-btn-text {2}" type="{1}" style="height:28px;">{0}</button>',
            '</em></td>',
            '<td class="ux-taskbutton-right"><i>&#160;</i></td>',
            "</tr></tbody></table>")
    });
};

Ext.extend(Ext.ux.TaskBar.TaskButton, Ext.Button, {
    onRender : function(){
        Ext.ux.TaskBar.TaskButton.superclass.onRender.apply(this, arguments);

        this.cmenu = new Ext.menu.Menu({
            items: [{
                text: 'Восстановить',
                handler: function(){
                    if(!this.win.isVisible()){
                        this.win.show();
                    }else{
                        this.win.restore();
                    }
                },
                scope: this
            },{
                text: 'Свернуть',
                handler: this.win.minimize,
                scope: this.win
            },{
                text: 'Развернуть',
                handler: this.win.maximize,
                scope: this.win
            }, '-', {
                text: 'Закрыть',
                handler: this.closeWin.createDelegate(this, this.win, true),
                scope: this.win
            }]
        });

        this.cmenu.on('beforeshow', function(){
            var items = this.cmenu.items.items;
            var w = this.win;
			if (w.masked) {
				 for (var i = 0, len = items.length; i < len; i++) {
				 	items[i].setDisabled(true);
				 }
			}
			else {
				items[0].setDisabled(w.maximized !== true && w.hidden !== true);
				items[1].setDisabled(w.minimized === true || !w.minimizable);
				items[2].setDisabled(w.maximized === true || w.hidden === true || !w.maximizable);
			}
        }, this);

        this.el.on('contextmenu', function(e){
            e.stopEvent();
            if(!this.cmenu.el){
                this.cmenu.render();
            }
            //TODO: Правильное отображение положения контекстного меню
            var xy = e.getXY();
            xy[1] -= this.cmenu.el.getHeight();
            this.cmenu.showAt(xy);
        }, this);
    },

    closeWin : function(cMenu, e, win){
        if(!win.isVisible()){
            win.show();
        }else{
            win.restore();
        }
        win.close();
    }
});


Ext.ux.Clock = Ext.extend(Ext.Toolbar.TextItem,{
	shortdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    currTime: function(){
		var d = new Date();
		var dateStr = d.format('d (XXX) M Y G:i:s');
		var day = this.shortdays[d.getDay()];
		return dateStr.replace('XXX', day);
	}
    ,initComponent: function() {
        Ext.apply(this, {
            text: this.currTime()
            ,cls: "x-text-icon"
            ,icon: "clock.png" //Lick to a clock icon
        });
        Ext.ux.Clock.superclass.initComponent.apply(this, arguments);
        
        this.clock_updater = {
            run: this.update,
            scope: this,
            interval: 1000 //1 second
        }
        Ext.TaskMgr.start(this.clock_updater);
    }
    ,update: function() {
        this.setText(this.currTime())
    }
});
Ext.reg('ux_clock', Ext.ux.Clock);

/*!
 * Ext JS Library 3.3.0
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.Desktop = function(app){
    var taskbar,
        desktopEl = Ext.get('x-desktop'),
        taskbarEl = Ext.get('ux-taskbar'),
        shortcuts = Ext.get('x-shortcuts');

    this.taskbar = taskbar = new Ext.ux.TaskBar(app);
    this.xTickSize = this.yTickSize = 1;

    // В ИЕ7 не поддерживается display: inline-block
    // и из-за этого ярлыки на рабочем столе выстраиваются в одну линию
    // Этот недостаток предотвращается навешиванием на ресайз обработчика:
    if (Ext.isIE7) {
        Ext.EventManager.onWindowResize(function () {
            var box,
                shortcutsElements,
                shortcutsWrapers,
                widthBox, // ширина видимого пространства
                widthShortcut,
                lineSize,
                i,
                j,
                colSize,
                tr,
                curIndex;

            box = Ext.select('#x-shortcuts tbody');
            shortcutsElements = Ext.select('#x-shortcuts td');
            widthBox = Ext.select('.desktop-shortcuts').first().getWidth();
            widthShortcut = shortcutsElements.first().getWidth();
            lineSize = Math.floor(widthBox / widthShortcut);
            j = 0;
            colSize = Math.ceil(shortcutsElements.elements.length / lineSize);

            if (1 < colSize) {
                while (j < colSize) {
                    i = 0;
                    tr = document.createElement('tr');
                    while (i < lineSize) {
                        curIndex = (j * lineSize) + i;
                        if (curIndex < shortcutsElements.elements.length) {
                            tr.appendChild(shortcutsElements.elements[curIndex]);
                        }
                        i++;
                    }
                    box.appendChild(tr);
                    j++;
                }
                shortcutsWrapers = Ext.select('#x-shortcuts tr');
                i = 0;
                tr = shortcutsWrapers.elements;
                j = tr.length;
                while (i < j) {
                    if (tr[i].children.length === 0) {
                        tr[i].parentNode.removeChild(tr[i]);
                    }
                    i++;
                }
            }
        });
    }


    //ZIgi 16.12 дабы окна рендерились только внутри десктопа
    //оставляя верхний и нижний тулбары
    Ext.override(Ext.Window,
    {
        renderTo: 'x-desktop'
    });

    var windows = new Ext.WindowGroup();
    var activeWindow;

    var toptoolbarEl = Ext.get('ux-toptoolbar');
    
    var TopToolbar = Ext.extend(Ext.Panel, {
        monitorResize: true,
        autoWidth: true,
        autoHeight: true,
        height: 0,
        style: 'margin-top:0px',
        bodyStyle: 'padding:0px',
        renderTo: 'ux-toptoolbar',       
        autoScroll: true,
        tbar: [],
        initComponent : function() {
            TopToolbar.superclass.initComponent.call(this);
            Ext.EventManager.onWindowResize(this.fireResize, this);
        },
        fireResize : function(w, h){
            this.onResize(w, 0, w, 0);
            this.fireEvent('resize', this, w, h, w, h);
        }
    });

    var ms = app.getModules();
    tools_not_created = true;
    if (ms.length > 0) {
        var pnl;
        var tbar;
        for(var i = 0, len = ms.length; i < len; i++){
            var m = ms[i];
            if (m && m.id) {                           
                if (m.id.indexOf('toptoolbar-item') == 0) {
                    if(tools_not_created){
                        pnl = new TopToolbar();
                        tbar = pnl.getTopToolbar();
                        tools_not_created = false;
                    };
                    if(m.launcher.text == 'FILLBLOCK'){
                        tbar.add('->');
                    } else if(m.launcher.text == 'TIMEBLOCK'){
                        var clock = new Ext.ux.Clock();
                        tbar.add(clock);
                    } else if(m.launcher.text == '-'){
                        tbar.add('-');
    				} else if(m.launcher.text == 'UI_OBJECT'){
                        tbar.add(m.launcher.ui_object);
                    } else {
                        tbar.add({
                            scale: 'small'
                           ,iconAlign: 'left'
                           ,text: m.launcher.text
                           ,iconCls: m.launcher.iconCls
                           ,handler: m.launcher.handler
                           ,menu: m.launcher.menu
    					   ,tooltip: m.launcher.tooltip
                        });
                    };
                };
            }
        };
        if(!tools_not_created){
            pnl.doLayout();
        }
    };  

    function minimizeWin(win){
        win.minimized = true;
        win.hide();
    }

    function markActive(win){
        if(activeWindow && activeWindow != win){
            markInactive(activeWindow);
        }
        taskbar.setActiveButton(win.taskButton);
        activeWindow = win;
        Ext.fly(win.taskButton.el).addClass('active-win');
        win.minimized = false;
    }

    function markInactive(win){
        if(win == activeWindow){
            activeWindow = null;
            Ext.fly(win.taskButton.el).removeClass('active-win');
        }
    }

    function removeWin(win){
        taskbar.removeTaskButton(win.taskButton);
        layout();
    }

    function layout(){
        var viewHeight = Ext.lib.Dom.getViewHeight(),
            taskbarHeight = taskbarEl.getHeight(),
            toptoolbarHeight = toptoolbarEl.getHeight();

        desktopEl.setHeight(viewHeight - taskbarHeight - toptoolbarHeight);
    }
    Ext.EventManager.onWindowResize(layout);

    this.layout = layout;

    this.createWindow = function(win, cls){
        /* D prefer 24.03.10 
         * modify @config parameter to @win parameter
         * win - Готовое окно
         * >>
        var win = new (cls||Ext.Window)(
            Ext.applyIf(config||{}, {
                renderTo: desktopEl,
                manager: windows,
                minimizable: true,
                maximizable: true
            })
        );*/
        //win.render(desktopEl);

        win.taskButton = taskbar.addTaskButton(win);

        //win.cmenu = new Ext.menu.Menu({
        //    items: []
        //});

        win.animateTarget = win.taskButton.el;

        win.on({
            'activate': {
                fn: markActive
            },
            'beforeshow': {
                fn: markActive
            },
            'deactivate': {
                fn: markInactive
            },
            'minimize': {
                fn: minimizeWin
            },
            'close': {
                fn: removeWin
            }
        });

        layout();
        return win;
    };

    this.getManager = function(){
        return windows;
    };

    this.getWindow = function(id){
        return windows.get(id);
    }

    this.getWinWidth = function(){
        var width = Ext.lib.Dom.getViewWidth();
        return width < 200 ? 200 : width;
    }

    this.getWinHeight = function(){
        var height = (Ext.lib.Dom.getViewHeight()-taskbarEl.getHeight());
        return height < 100 ? 100 : height;
    }

    this.getWinX = function(width){
        return (Ext.lib.Dom.getViewWidth() - width) / 2
    }

    this.getWinY = function(height){
        return (Ext.lib.Dom.getViewHeight()-taskbarEl.getHeight() - height - toptoolbarEl.getHeight()) / 2;
    }

    layout();

    // Если в прикладном приложении при создании Ext.app.App передать в словаре
    // параметр primaryEvent, то срабатывание именно этого эвента запустит
    // действие, назначенное на ярлык на рабочем столе.
    // Пример: если передать primaryEvent: 'dblclick', то ярлыки будут
    // открываться только по даблклику.
    var primaryEvent = app.primaryEvent || 'click';
    if(shortcuts){
        shortcuts.on(primaryEvent, function(e, t){
            var t = e.getTarget('td', shortcuts);
			if(t){
                e.stopEvent();
                var module = app.getModule(t.id.replace('-shortcut', ''));
                if(module){
                    module.launcher.handler();
                }
            }
        });
    }

    if (Ext.isIE7) {
        Ext.EventManager.fireResize();
    }
};

/*!
 * Ext JS Library 3.3.0
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.app.App = function(cfg){
    Ext.apply(this, cfg);
    this.addEvents({
        'ready' : true,
        'beforeunload' : true
    });

    Ext.onReady(this.initApp, this);
};

Ext.extend(Ext.app.App, Ext.util.Observable, {
    isReady: false,
    startMenu: null,
    modules: null,

    getStartConfig : function(){
		//
    },

    initApp : function(){
        this.startConfig = this.startConfig || this.getStartConfig();

        this.desktop = new Ext.Desktop(this);

        this.launcher = this.desktop.taskbar.startMenu;

        this.modules = this.getModules();
        if(this.modules){
            this.initModules(this.modules);
        }

        this.init();

        Ext.EventManager.on(window, 'beforeunload', this.onUnload, this);
        this.fireEvent('ready', this);
        this.isReady = true;
    },

    getModules : Ext.emptyFn,
    init : Ext.emptyFn,

    initModules : function(ms){
        for(var i = 0, len = ms.length; i < len; i++){
            var m = ms[i];
			// M prefer 23.03.10 >>
            // this.launcher.add(m.launcher);	
            // -->
            if (m && m.launcher && m.launcher.in_start_menu == true) {
            	this.launcher.add(m.launcher);		
            };
            // prefer <<
           if (m) { 
                m.app = this;
           }
        }
    },

    getModule : function(name){
    	var ms = this.modules;
    	for(var i = 0, len = ms.length; i < len; i++){
            //ZIgi 23.02.11
    		if(ms[i] && ( ms[i].id == name || ms[i].appType == name)){
    			return ms[i];
			}
        }
        return '';
    },

    onReady : function(fn, scope){
        if(!this.isReady){
            this.on('ready', fn, scope);
        }else{
            fn.call(scope, this);
        }
    },

    getDesktop : function(){
        return this.desktop;
    },

    onUnload : function(e){
        if(this.fireEvent('beforeunload', this) === false){
            e.stopEvent();
        }
    }
});

/*!
 * Ext JS Library 3.3.0
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.app.Module = function(config){
    Ext.apply(this, config);
    Ext.app.Module.superclass.constructor.call(this);
    this.init();
}

Ext.extend(Ext.app.Module, Ext.util.Observable, {
    init : Ext.emptyFn
});
