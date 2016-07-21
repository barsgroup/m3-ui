/**
 * Панель пагинатора не требующего общего количества записей
 */

Ext.m3.CountFreePagingToolbar = Ext.extend(Ext.PagingToolbar, {

    displayMsg : 'Показано записей {0} - {1}',

    initComponent : function(){
        Ext.m3.CountFreePagingToolbar.superclass.initComponent.call(this);
        this.items.remove(this.last);
        this.items.remove(this.afterTextItem);
    },

    onLoad : function(store, r, o){
        if(!this.rendered){
            this.dsLoaded = [store, r, o];
            return;
        }

        var p = this.getParams();
        this.cursor = (o.params && o.params[p.start]) ? o.params[p.start] : 0;
        var d = this.getPageData(), ap = d.activePage, ps = d.pages;

        this.inputItem.setValue(ap);
        this.first.setDisabled(ap == 1);
        this.prev.setDisabled(ap == 1);
        this.next.setDisabled(this.store.getCount() <= this.pageSize);
        // remove some records
        if (this.store.getCount() > this.pageSize) {
            for (var i = this.store.getCount() - 1; i > this.pageSize - 1; --i)
                this.store.removeAt(i)
        };
        this.refresh.enable();
        this.updateInfo();
        this.fireEvent('change', this, d);
    },

    getPageData : function(){
        return {
            total : 0,
            activePage : Math.ceil((this.cursor+this.pageSize)/this.pageSize),
            pages :  0
        };
    },

    changePage : function(page){
        var start = (page-1) * this.pageSize;
        if (start < 0)
            start = 0;
        this.doLoad(start);
    },

    doLoad : function(start){
        var o = {}, pn = this.getParams();
        o[pn.start] = start;
        o[pn.limit] = this.pageSize + 1;
        if(this.fireEvent('beforechange', this, o) !== false){
            this.store.load({params:o});
        }
    },

    onPagingKeyDown : function(field, e){
        var k = e.getKey(), d = this.getPageData(), pageNum;
        if (k == e.RETURN) {
            e.stopEvent();
            pageNum = this.readPage(d);
            if(pageNum !== false){
                pageNum = Math.max(1, pageNum) - 1;
                this.doLoad(pageNum * this.pageSize);
            }
        }else if (k == e.HOME){
            e.stopEvent();
            field.setValue(1);
        }else if (k == e.UP || k == e.PAGEUP || k == e.DOWN || k == e.PAGEDOWN){
            e.stopEvent();
            if((pageNum = this.readPage(d))){
                var increment = e.shiftKey ? 10 : 1;
                if(k == e.DOWN || k == e.PAGEDOWN){
                    increment *= -1;
                }
                pageNum += increment;
                if(pageNum >= 1){
                    field.setValue(pageNum);
                }
            }
        }
    },

    bindStore : function(store, initial){
        var doLoad;
        if(!initial && this.store){
            if(store !== this.store && this.store.autoDestroy){
                this.store.destroy();
            }else{
                this.store.un('beforeload', this.beforeLoad, this);
                this.store.un('load', this.onLoad, this);
                this.store.un('exception', this.onLoadError, this);
            }
            if(!store){
                this.store = null;
            }
        }
        if(store){
            store = Ext.StoreMgr.lookup(store);
            store.on({
                scope: this,
                beforeload: this.beforeLoad,
                load: this.onLoad,
                exception: this.onLoadError
            });
            doLoad = true;
            Ext.apply(store.baseParams, {
                limit: this.pageSize + 1
            })
        }
        this.store = store;
        if(doLoad){
            this.onLoad(store, null, {});
        }
    }
});

Ext.reg('countFreePagingToolbar', Ext.m3.CountFreePagingToolbar);