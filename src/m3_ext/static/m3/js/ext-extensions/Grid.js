/**
 * Расширенный грид на базе Ext.grid.GridPanel
 * @param {Object} config
 */

(function () {

    var initComponent;
    // Костыль, чтобы копипаста в livegrid работала
    Ext.m3.configureGrid = initComponent = function () {

        // сделаем enableBubble чуть раньше, чтобы можно было послать event
        this.bubbleEvents.push('gethandler');
        this.enableBubble(this.bubbleEvents);

        var params = this.params || {};

        // Создание ColumnModel если надо
        // раньше был экземпляр ColModel, теперь приходи конфиг
        if (this.cm && !(this.cm instanceof Ext.grid.ColumnModel)) {
            this.cm = Ext.create(this.cm);
        }
        // Добавлене selection model если нужно
        // раньше был экземпляр SelModel, теперь приходи конфиг
        if (this.sm && !(this.sm instanceof Ext.grid.AbstractSelectionModel)) {
            this.sm = Ext.create(this.sm);
        }

        // если это чекбоксы, то добавим колонку
        if (this.sm instanceof Ext.grid.CheckboxSelectionModel ||

            // FIXME: лучше использовать утиную типизацию
            this.sm instanceof Ext.ux.grid.livegrid.CheckboxSelectionModel) {

            if (this.columns) {
                this.columns.unshift(this.sm);
            }
        }

        // Создание GridView если надо
        // раньше был экземпляр GridView, теперь приходи конфиг
        if (this.view && !(this.view instanceof Ext.grid.GridView)) {
            this.view = Ext.create(this.view);
        }

        // Навешивание обработчиков на контекстное меню если нужно
        var funcContMenu;
        if (params.contextMenu) {
            // раньше был экземпляр меню, теперь приходи конфиг
            if (!(params.contextMenu instanceof Ext.menu.Menu)) {
                params.contextMenu = Ext.create(params.contextMenu);
            }

            funcContMenu = function (e) {
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

            funcRowContMenu = function (grid, index, e) {
                e.stopEvent();
                if (this.getSelectionModel().isSelected && !this.getSelectionModel().isSelected(index)) {
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
            Ext.each(columns, function (col) {
                if (col.filter) {
                    needFilterPlugin = true;
                }
                if (typeof col.renderer === 'string') {
                    this.fireEvent('gethandler', col, col.renderer);
                    if (col.handler) {
                        col.renderer = col.handler;
                    }
                }
            }, this);
            if (needFilterPlugin) {
                this.plugins.push(
                    {'ptype': 'gridfilters', 'menuFilterText': 'Фильтр'}
                );
            }
        }

        // объединение обработчиков
        this.on('contextmenu', funcContMenu);
        this.on('rowcontextmenu', funcRowContMenu);
        this.on('beforerender', function (grid) {

            this.getStore().on('exception', storeException, this);

            var bbar = this.getBottomToolbar();
            if (bbar && bbar instanceof Ext.PagingToolbar) {
                var store = this.getStore();
                store.setBaseParam('start', 0);
                store.setBaseParam('limit', bbar.pageSize);
                bbar.bind(store);
            }
        });
    };

    /**
     * Обработчик исключений хранилица
     */
    function storeException(proxy, type, action, options, response, arg) {

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

    var basem3Grid = {

        setBlocked: function (blocked, exclude) {
            if (!includeInArr(exclude, this.itemId)) {
                var containers = [
                    this.getTopToolbar(),
                    this.params.contextMenu,
                    this.params.rowContextMenu
                ];
                Ext.each(containers, function (cont) {
                    if (cont) {
                        cont.cascade(function (item) {
                            item.setBlocked(blocked, exclude);
                        });
                    }
                });
            }
        }
    };

    Ext.define('Ext.m3.GridPanel', Ext.apply(basem3Grid, {
            extend: 'Ext.grid.GridPanel',
            xtype: 'm3-grid',
            initComponent: function () {
                initComponent.apply(this);
                this.callParent();
            }
        })
    );

    Ext.define('Ext.m3.EditorGridPanel', Ext.apply(basem3Grid, {
            extend: 'Ext.grid.EditorGridPanel',
            xtype: 'm3-edit-grid',
            initComponent: function () {
                initComponent.apply(this);
                this.callParent();
            }
        })
    );
})();

Ext.reg('sm-cell', Ext.grid.CellSelectionModel);
Ext.reg('sm-checkbox', Ext.grid.CheckboxSelectionModel);
Ext.reg('sm-row', Ext.grid.RowSelectionModel);

Ext.reg('view-grouping', Ext.grid.GroupingView);