Ext.ns('Ext.ux.grid');

Ext.ux.grid.LockingGridColumnWithHeaderGroup = Ext.extend(Ext.util.Observable, {

    constructor: function (config) {
        this.config = config;
    },

    init: function (grid) {

        if (!grid instanceof Ext.grid.GridPanel) {
            return;
        }

        if (!grid.getStore() instanceof Ext.data.GroupingStore) {
            return;
        }

        Ext.applyIf(grid.colModel, this.columnModelConfig);
        Ext.apply(grid.colModel, this.config.columnModelCfg);
        Ext.apply(grid.colModel, this.columnModelFunctions);

        Ext.applyIf(grid.getView(), this.viewConfig);
        Ext.apply(grid.getView(), this.config.viewCfg);
        Ext.apply(grid.getView(), this.viewFunctions);

        grid.colModel.prepareHdRows.call(grid.colModel);
    },

    columnModelFunctions: {
        /**
         * Returns true if the given column index is currently locked
         * @param {Number} colIndex The column index
         * @return {Boolean} True if the column is locked
         */
        isLocked: function (colIndex) {
            return this.config[colIndex].locked === true;
        },

        isLockedHdGroup: function (rowIndex, groupIndex) {
            return this.rows[rowIndex][groupIndex].locked === true;
        },

        /**
         * Locks or unlocks a given column
         * @param {Number} colIndex The column index
         * @param {Boolean} value True to lock, false to unlock
         * @param {Boolean} suppressEvent Pass false to cause the columnlockchange event not to fire
         */
        setLocked: function (colIndex, value, suppressEvent) {
            if (this.isLocked(colIndex) == value) {
                return;
            }
            this.config[colIndex].locked = value;
            if (!suppressEvent) {
                this.fireEvent('columnlockchange', this, colIndex, value);
            }
        },

        setLockedHdGroup: function (rowIndex, groupIndex, value) {
            if (this.isLockedHdGroup(rowIndex, groupIndex) == value) {
                return;
            }
            this.rows[rowIndex][groupIndex].locked = value;
        },

        /**
         * Returns the total width of all locked columns
         * @return {Number} The width of all locked columns
         */
        getTotalLockedWidth: function () {
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
        getLockedCount: function () {
            var len = this.config.length;

            for (var i = 0; i < len; i++) {
                if (!this.isLocked(i)) {
                    return i;
                }
            }

            //if we get to this point all of the columns are locked so we return the total
            return len;
        },

        getLockedHdGroupCount: function (rowIndex) {
            var row = this.rows[rowIndex],
                len = row.length;

            for (var i = 0; i < len; i++) {
                if (!this.isLockedHdGroup(rowIndex, i)) {
                    return i;
                }
            }

            return len;
        },

        /**
         * Moves a column from one position to another
         * @param {Number} oldIndex The current column index
         * @param {Number} newIndex The destination column index
         */
        moveColumn: function (oldIndex, newIndex) {
            var oldLocked = this.isLocked(oldIndex),
                newLocked = this.isLocked(newIndex);

            if (oldIndex < newIndex && oldLocked && !newLocked) {
                this.setLocked(oldIndex, false, true);
            } else if (oldIndex > newIndex && !oldLocked && newLocked) {
                this.setLocked(oldIndex, true, true);
            }

            Ext.grid.ColumnModel.prototype.moveColumn.apply(this, arguments);
        },

        processLockingHdGroups: function (colIndex) {
            var rows = this.rows,
                pos = [],
                newColIndex,
                lockedCount_0 = this.getLockedHdGroupCount(0);

            if (lockedCount_0 > 0) {
                this.getHdGroupsPositionsToMovie(colIndex, 0, 0, lockedCount_0 - 1, pos, false);
            } else {
                for (var j = 0; j < rows.length; j++) {
                    pos[j] = 0;
                }
            }

            for (var i = 0; i < rows.length; i++) {
                var lockingGroupIndex = this.findHdGroupIndex(colIndex, i),
                    lockedLen = this.getLockedHdGroupCount(i),
                    group = rows[i][lockingGroupIndex];

                if (i == rows.length - 1) {
                    newColIndex = this.getBeforeHdGroupColCount(i, pos[i]);
                }

                this.setLockedHdGroup(i, lockingGroupIndex, true);

                if (group.colspan == 1) {
                    //переносим полностью
                    this.moveHdGroup(i, lockingGroupIndex, pos[i]);
                }
                else {
                    //делим группу
                    var newgroup = {};

                    Ext.apply(newgroup, group);
                    newgroup.colspan = group.colspan - 1;
                    newgroup.locked = false;
                    group.colspan = 1;

                    this.moveHdGroup(i, lockingGroupIndex, pos[i], newgroup);
                }
            }

            this.joinHdGroups();

            return newColIndex;
        },

        processUnLockingHdGroups: function (colIndex) {
            var rows = this.rows,
                pos = [],
                newColIndex,
                lockedCount_0 = this.getLockedHdGroupCount(0);

            if (lockedCount_0 < rows[0].length - 1) {
                this.getHdGroupsPositionsToMovie(colIndex, 0, lockedCount_0, rows[0].length - 1, pos, true);
            } else {
                for (var j = 0; j < rows.length; j++) {
                    pos[j] = this.getLockedHdGroupCount(j);
                }
            }

            for (var i = 0; i < rows.length; i++) {
                var unLockingGrougIndex = this.findHdGroupIndex(colIndex, i),
                    lockedLen = this.getLockedHdGroupCount(i),
                    group = rows[i][unLockingGrougIndex];

                this.setLockedHdGroup(i, unLockingGrougIndex, false);

                if (group.colspan == 1) {

                    if (i == rows.length - 1) {
                        newColIndex = this.getBeforeHdGroupColCount(i, pos[i] - 1);
                    }
                    //переносим полностью
                    this.moveHdGroup(i, unLockingGrougIndex, pos[i] - 1);
                }
                else {

                    if (i == rows.length - 1) {
                        newColIndex = this.getBeforeHdGroupColCount(i, pos[i]);
                    }
                    //делим группу
                    var newgroup = {};

                    Ext.apply(newgroup, group);
                    newgroup.colspan = group.colspan - 1;
                    newgroup.locked = true;
                    group.colspan = 1;

                    this.moveHdGroup(i, unLockingGrougIndex, pos[i], newgroup);
                }
            }

            this.joinHdGroups();

            return newColIndex;
        },

        findHdGroupIndex: function (colIndex, rowIndex) {
            var row = this.rows[rowIndex],
                j = 0, colspan = 0;

            while (j < row.length && colspan - 1 < colIndex) {
                colspan += row[j].colspan;
                j++;
            }

            return j - 1;
        },

        getHdGroupsPositionsToMovie: function (colIndex, rowIndex, leftIndex, rightIndex, resultArrayOfIndexes, paddingLeft) {
            var currentGroupIndex = this.findHdGroupIndex(colIndex, rowIndex),
                group = this.rows[rowIndex][currentGroupIndex],
                newIndex;

            for (var i = leftIndex; i <= rightIndex; i++) {
                if (this.rows[rowIndex][i].id == group.id) {
                    //нашли группу с таким же идентификатором
                    if (paddingLeft) {
                        newIndex = i;
                    } else {
                        newIndex = i + 1;
                    }

                    resultArrayOfIndexes[resultArrayOfIndexes.length] = newIndex;

                    if (rowIndex + 1 < this.rows.length) {
                        var colCount = this.getBeforeHdGroupColCount(rowIndex, i),
                            leftIndex = this.findHdGroupIndex(colCount, rowIndex + 1),
                            rightIndex = this.findHdGroupIndex(colCount + this.rows[rowIndex][i].colspan - 1, rowIndex + 1);
                        this.getHdGroupsPositionsToMovie(colIndex, rowIndex + 1, leftIndex, rightIndex, resultArrayOfIndexes, paddingLeft);

                    }
                    return resultArrayOfIndexes;
                }
            }

            if (paddingLeft) {
                newIndex = leftIndex;
            } else {
                newIndex = rightIndex + 1;
            }

            resultArrayOfIndexes[resultArrayOfIndexes.length] = newIndex;

            if (rowIndex + 1 < this.rows.length) {
                var colCount = this.getBeforeHdGroupColCount(rowIndex, leftIndex),
                    colCount1 = this.getBeforeHdGroupColCount(rowIndex, rightIndex),
                    leftIndex = this.findHdGroupIndex(colCount, rowIndex + 1),
                    rightIndex = this.findHdGroupIndex(colCount1 + this.rows[rowIndex][rightIndex].colspan - 1, rowIndex + 1);
                this.getHdGroupsPositionsToMovie(colIndex, rowIndex + 1, leftIndex, rightIndex, resultArrayOfIndexes, paddingLeft);
            }

            return resultArrayOfIndexes;
        },

        getBeforeHdGroupColCount: function (rowIndex, groupIndex) {
            var colCount = 0;

            for (var i = 0; i < groupIndex; i++) {
                colCount += this.rows[rowIndex][i].colspan;
            }

            return colCount;
        },

        moveHdGroup: function (rowIndex, groupOldIndex, groupNewIndex, newGroup) {
            var row = this.rows[rowIndex],
                group = row[groupOldIndex];

            if (groupOldIndex > groupNewIndex) {
                var m = row.slice(0, groupNewIndex),
                    m1 = row.slice(groupNewIndex, groupOldIndex),
                    m2 = row.slice(groupOldIndex + 1, row.length);
                if (newGroup) {
                    this.rows[rowIndex] = m.concat([group]).concat(m1).concat([newGroup]).concat(m2);
                }
                else {
                    this.rows[rowIndex] = m.concat([group]).concat(m1).concat(m2);
                }
            }
            else if (groupOldIndex < groupNewIndex) {
                if (newGroup) {
                    var m = row.slice(0, groupOldIndex),
                        m1 = row.slice(groupOldIndex + 1, groupNewIndex),
                        m2 = row.slice(groupNewIndex, row.length);
                    this.rows[rowIndex] = m.concat([newGroup]).concat(m1).concat([group]).concat(m2);
                }
                else {
                    var m = row.slice(0, groupOldIndex),
                        m1 = row.slice(groupOldIndex + 1, groupNewIndex + 1),
                        m2 = row.slice(groupNewIndex + 1, row.length);
                    this.rows[rowIndex] = m.concat(m1).concat([group]).concat(m2);
                }
            }
            else if (newGroup) {
                var m = row.slice(0, groupOldIndex),
                    m1 = row.slice(groupOldIndex + 1, row.length);

                if (newGroup.locked) {
                    this.rows[rowIndex] = m.concat([newGroup]).concat([group]).concat(m1);
                } else {
                    this.rows[rowIndex] = m.concat([group]).concat([newGroup]).concat(m1);
                }

            }
        },

        prepareHdRows: function () {
            var columns = this.columns,
                rows = this.rows,
                lockedCount = this.lockedCount;

            if (lockedCount) {
                for (j = 0; j < lockedCount; j++) {
                    this.setLocked(j, true, true);
                }
            }

            for (var i = 0; i < rows.length; i++) {
                var row = rows[i],
                    colspan = 0,
                    j = 0;

                //устанавливаем идентификаторы групп для дальнейшего объединения групп по этим идентификаторам
                this.setHdGroupsId(i);

                while (j < row.length && colspan < lockedCount) {
                    var group = row[j];

                    group.colspan = group.colspan || 1;
                    colspan += group.colspan;

                    var diff = colspan - lockedCount;

                    if (diff > 0) {
                        //делить группу
                        var m = row.slice(0, j + 1),
                            m1 = row.slice(j + 1, row.length),
                            newgroup = {};
                        Ext.apply(newgroup, group);
                        newgroup.colspan = diff;
                        group.colspan = group.colspan - diff;
                        this.setLockedHdGroup(i, j, true);

                        rows[i] = m.concat([newgroup]).concat(m1);
                    }
                    else {
                        //блокировать полностью
                        this.setLockedHdGroup(i, j, true);
                    }

                    j++;
                }
            }
        },

        setHdGroupsId: function (rowIndex) {
            var row = this.rows[rowIndex];

            for (var i = 0; i < row.length; i++) {
                row[i].id = i;
            }
        },

        joinHdGroups: function () {
            var rows = this.rows;

            for (var indexRow = rows.length - 1; indexRow >= 0; indexRow--) {
                var row = rows[indexRow];

                for (var indexCol = 0; indexCol < row.length - 1; indexCol++) {//- 1 берем парами
                    var groupCurent = row[indexCol];
                    var groupNext = row[indexCol + 1];

                    if ((groupCurent.header == groupNext.header)
                        && (this.isLockedHdGroup(indexRow, indexCol) == this.isLockedHdGroup(indexRow, indexCol + 1))
                        && (groupCurent.id == groupNext.id)) {
                        //Объединение
                        groupCurent.colspan += groupNext.colspan;

                        row.splice(indexCol + 1, 1);
                    }
                }
            }
        }
    },

    columnModelConfig: {

        /**
         * lockedCount начальное количество блокированных столбцов
         */
        lockedCount: 0,

        /**
         * rows строки с объединениями для построения многоуровневой шапки
         */
        rows: [],

        hierarchicalColMenu: true
    },

    viewConfig: {

        //LockingView config****************************************************************

        lockText: 'Lock',
        unlockText: 'Unlock',
        rowBorderWidth: 1,
        lockedBorderWidth: 1,
        /*
         * This option ensures that height between the rows is synchronized
         * between the locked and unlocked sides. This option only needs to be used
         * when the row heights aren't predictable.
         */
        syncHeights: false,

        //GroupingView config*****************************************************************

        /**
         * @cfg {String} groupByText Text displayed in the grid header menu for grouping by a column
         * (defaults to 'Group By This Field').
         */
        groupByText: 'Group By This Field',
        /**
         * @cfg {String} showGroupsText Text displayed in the grid header for enabling/disabling grouping
         * (defaults to 'Show in Groups').
         */
        showGroupsText: 'Show in Groups',
        /**
         * @cfg {Boolean} hideGroupedColumn <tt>true</tt> to hide the column that is currently grouped (defaults to <tt>false</tt>)
         */
        hideGroupedColumn: false,
        /**
         * @cfg {Boolean} showGroupName If <tt>true</tt> will display a prefix plus a ': ' before the group field value
         * in the group header line.  The prefix will consist of the <tt><b>{@link Ext.grid.Column#groupName groupName}</b></tt>
         * (or the configured <tt><b>{@link Ext.grid.Column#header header}</b></tt> if not provided) configured in the
         * {@link Ext.grid.Column} for each set of grouped rows (defaults to <tt>true</tt>).
         */
        showGroupName: true,
        /**
         * @cfg {Boolean} startCollapsed <tt>true</tt> to start all groups collapsed (defaults to <tt>false</tt>)
         */
        startCollapsed: false,
        /**
         * @cfg {Boolean} enableGrouping <tt>false</tt> to disable grouping functionality (defaults to <tt>true</tt>)
         */
        enableGrouping: true,
        /**
         * @cfg {Boolean} enableGroupingMenu <tt>true</tt> to enable the grouping control in the column menu (defaults to <tt>true</tt>)
         */
        enableGroupingMenu: true,
        /**
         * @cfg {Boolean} enableNoGroups <tt>true</tt> to allow the user to turn off grouping (defaults to <tt>true</tt>)
         */
        enableNoGroups: true,
        /**
         * @cfg {String} emptyGroupText The text to display when there is an empty group value (defaults to <tt>'(None)'</tt>).
         * May also be specified per column, see {@link Ext.grid.Column}.{@link Ext.grid.Column#emptyGroupText emptyGroupText}.
         */
        emptyGroupText: '(None)',
        /**
         * @cfg {Boolean} ignoreAdd <tt>true</tt> to skip refreshing the view when new rows are added (defaults to <tt>false</tt>)
         */
        ignoreAdd: false,
        /**
         * @cfg {String} groupTextTpl The template used to render the group header (defaults to <tt>'{text}'</tt>).
         * This is used to format an object which contains the following properties:
         * <div class="mdetail-params"><ul>
         * <li><b>group</b> : String<p class="sub-desc">The <i>rendered</i> value of the group field.
         * By default this is the unchanged value of the group field. If a <tt><b>{@link Ext.grid.Column#groupRenderer groupRenderer}</b></tt>
         * is specified, it is the result of a call to that function.</p></li>
         * <li><b>gvalue</b> : Object<p class="sub-desc">The <i>raw</i> value of the group field.</p></li>
         * <li><b>text</b> : String<p class="sub-desc">The configured header (as described in <tt>{@link #showGroupName})</tt>
         * if <tt>{@link #showGroupName}</tt> is <tt>true</tt>) plus the <i>rendered</i> group field value.</p></li>
         * <li><b>groupId</b> : String<p class="sub-desc">A unique, generated ID which is applied to the
         * View Element which contains the group.</p></li>
         * <li><b>startRow</b> : Number<p class="sub-desc">The row index of the Record which caused group change.</p></li>
         * <li><b>rs</b> : Array<p class="sub-desc">Contains a single element: The Record providing the data
         * for the row which caused group change.</p></li>
         * <li><b>cls</b> : String<p class="sub-desc">The generated class name string to apply to the group header Element.</p></li>
         * <li><b>style</b> : String<p class="sub-desc">The inline style rules to apply to the group header Element.</p></li>
         * </ul></div></p>
         * See {@link Ext.XTemplate} for information on how to format data using a template. Possible usage:<pre><code>
         var grid = new Ext.grid.GridPanel({
         ...
         view: new Ext.grid.GroupingView({
         groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})'
         }),
         });
         * </code></pre>
         */
        groupTextTpl: '{text}',

        /**
         * @cfg {String} groupMode Indicates how to construct the group identifier. <tt>'value'</tt> constructs the id using
         * raw value, <tt>'display'</tt> constructs the id using the rendered value. Defaults to <tt>'value'</tt>.
         */
        groupMode: 'value',

        /**
         * @cfg {Function} groupRenderer This property must be configured in the {@link Ext.grid.Column} for
         * each column.
         */

        /**
         * @cfg {Boolean} cancelEditOnToggle True to cancel any editing when the group header is toggled. Defaults to <tt>true</tt>.
         */
        cancelEditOnToggle: true,

        /**
         * @cfg {Boolean} totalSummaryRowEnabled True to render total summary row. Defaults to <tt>true</tt>.
         */
        totalSummaryEnabled: true
    },

    viewFunctions: {

        initTemplates: function () {
            Ext.grid.GridView.prototype.initTemplates.apply(this, arguments);

            var ts = this.templates || {};

            if (!ts.masterTpl) {
                ts.masterTpl = new Ext.Template(
                    '<div class="x-grid3" hidefocus="true">',
                    '<div class="x-grid3-locked">',
                    '<div class="x-grid3-header"><div class="x-grid3-header-inner"><div class="x-grid3-header-offset" style="{lstyle}">{lockedHeader}</div></div><div class="x-clear"></div></div>',
                    '<div class="x-grid3-scroller"><div class="x-grid3-body" style="{lstyle}">{lockedBody}</div><div class="x-grid3-scroll-spacer"></div></div>',
                    '<div class="x-grid3-total-summary"><div class="x-grid3-total-summary-inner"><div class="x-grid3-total-summary-offset" style="{lstyle}">{lockedTotalSummary}</div></div><div class="x-clear"></div></div>',
                    '</div>',
                    '<div class="x-grid3-viewport x-grid3-unlocked">',
                    '<div class="x-grid3-header"><div class="x-grid3-header-inner"><div class="x-grid3-header-offset" style="{ostyle}">{header}</div></div><div class="x-clear"></div></div>',
                    '<div class="x-grid3-scroller"><div class="x-grid3-body" style="{bstyle}">{body}</div><a href="#" class="x-grid3-focus" tabIndex="-1"></a></div>',
                    '<div class="x-grid3-total-summary"><div class="x-grid3-total-summary-inner"><div class="x-grid3-total-summary-offset" style="{ostyle}">{totalSummary}</div></div><div class="x-clear"></div></div>',
                    '</div>',
                    '<div class="x-grid3-resize-marker">&#160;</div>',
                    '<div class="x-grid3-resize-proxy">&#160;</div>',
                    '</div>'
                );
            }

            if (!ts.gcell) {
                //ts.gcell = new Ext.XTemplate('<td class="x-grid3-hd x-grid3-gcell x-grid3-td-{id} ux-grid-hd-group-row-{row} {cls}" style="{style}">', '<div {tooltip} class="x-grid3-hd-inner x-grid3-hd-{id}" unselectable="on" style="{istyle}">', this.grid.enableHdMenu ? '<a class="x-grid3-hd-btn" href="#"></a>' : '', '{value}</div></td>');
                ts.gcell = new Ext.XTemplate('<td class="x-grid3-hd x-grid3-gcell x-grid3-td-{id} ux-grid-hd-group-row-{row} {cls}" style="{style}">', '<div {tooltip} class="x-grid3-hd-inner x-grid3-hd-{id}" unselectable="on" style="{istyle}">', this.grid.enableHdMenu ? '<a href="#"></a>' : '', '{value}</div></td>');
            }

            if (!ts.startGroup) {
                ts.startGroup = new Ext.XTemplate(
                    '<div id="{groupId}" class="x-grid-group {cls}">',
                    '<div id="{groupId}-hd" class="x-grid-group-hd" style="{style}"><div class="x-grid-group-title">', this.groupTextTpl, '</div></div>',
                    '<div id="{groupId}-bd" class="x-grid-group-body">'
                );
            }

            if (!ts.startLockedGroup) {
                ts.startLockedGroup = new Ext.XTemplate(
                    '<div id="{groupId}-l" class="x-grid-group {cls}">',
                    '<div id="{groupId}-lhd" class="x-grid-group-hd" style="{style}"><div class="x-grid-group-title">', this.groupTextTpl, '</div></div>',
                    '<div id="{groupId}-lbd" class="x-grid-group-body">'
                );
            }

            if (!ts.endGroup) {
                ts.endGroup = '</div></div>';
            }

            if (!ts.summaryRow) {
                ts.summaryRow = new Ext.Template(
                    '<div class="x-grid3-summary-row" style="{tstyle}">',
                    '<table class="x-grid3-summary-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
                    '<tbody><tr>{cells}</tr></tbody>',
                    '</table></div>'
                );
                ts.summaryRow.disableFormats = true;
            }

            if (!ts.totalSummary) {
                ts.totalSummary = new Ext.Template(
                    '<table border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
                    '<thead>',
                    '<tr class="x-grid3-total-summary-row x-grid3-hd-row">{cells}</tr>',
                    '</thead>',
                    '</table>'
                );
            }

            if (!ts.totalSummaryCell) {
                ts.totalSummaryCell = new Ext.XTemplate(
                    '<td class="x-grid3-hd x-grid3-total-td-{id} {css}" style="{style}">',
                    '<div {tooltip} class="x-grid3-cell-inner x-grid3-total-summary-cell-{id}" unselectable="on" style="{istyle}">',
                    '{value}</div></td>');
            }

            this.templates = ts;

            this.hrowRe = new RegExp("ux-grid-hd-group-row-(\\d+)", "");

            this.state = {};

            var sm = this.grid.getSelectionModel();
            sm.on(sm.selectRow ? 'beforerowselect' : 'beforecellselect',
                this.onBeforeRowSelect, this);
        },

        initElements: function () {
            var el = Ext.get(this.grid.getGridEl().dom.firstChild),
                lockedWrap = el.child('div.x-grid3-locked'),
                lockedHd = lockedWrap.child('div.x-grid3-header'),
                lockedScroller = lockedWrap.child('div.x-grid3-scroller'),
                lockedTotalSummary = lockedWrap.child('div.x-grid3-total-summary'),
                mainWrap = el.child('div.x-grid3-viewport'),
                mainHd = mainWrap.child('div.x-grid3-header'),
                scroller = mainWrap.child('div.x-grid3-scroller'),
                totalSummary = mainWrap.child('div.x-grid3-total-summary');

            if (this.grid.hideHeaders) {
                lockedHd.setDisplayed(false);
                mainHd.setDisplayed(false);
            }

            if (this.totalSummaryEnabled !== true) {
                lockedTotalSummary.setDisplayed(false);
                totalSummary.setDisplayed(false);
            }

            if (this.forceFit) {
                scroller.setStyle('overflow-x', 'hidden');
            }

            Ext.apply(this, {
                el: el,
                mainWrap: mainWrap,
                mainHd: mainHd,
                innerHd: mainHd.dom.firstChild,
                scroller: scroller,
                totalSummary: totalSummary,
                totalSummaryInner: totalSummary.dom.firstChild,
                mainBody: scroller.child('div.x-grid3-body'),
                focusEl: scroller.child('a'),
                resizeMarker: el.child('div.x-grid3-resize-marker'),
                resizeProxy: el.child('div.x-grid3-resize-proxy'),
                lockedWrap: lockedWrap,
                lockedHd: lockedHd,
                lockedScroller: lockedScroller,
                lockedBody: lockedScroller.child('div.x-grid3-body'),
                lockedInnerHd: lockedHd.child('div.x-grid3-header-inner', true),
                lockedTotalSummary: lockedTotalSummary,
                lockedTotalSummaryInner: lockedTotalSummary.dom.firstChild
            });

            this.focusEl.swallowEvent('click', true);
        },

        renderHeaders: function () {
            var cm = this.cm,
                rows = cm.rows,
                ts = this.templates,
                ct = ts.hcell,
                headers = [],
                lheaders = [],
                clen = cm.getColumnCount(),
                rlen = rows.length,
                tstyle = 'width:' + this.getTotalWidth() + ';',
                ltstyle = 'width:' + this.getLockedWidth() + ';';

            for (var row = 0; row < rlen; row++) {
                var r = rows[row], cells = [], lcells = [];
                for (var i = 0, gcol = 0; i < r.length; i++) {
                    var group = r[i],
                        colIndex = group.dataIndex ? cm.findColumnIndex(group.dataIndex) : gcol;
                    group.colspan = group.colspan || 1;

                    if (cm.getColumnAt(colIndex) !== undefined) {
                        var id = this.getColumnId(colIndex),
                            gs = this.getGroupStyle(group, gcol);

                        gcol += group.colspan;

                        var htmlStr = ts.gcell.apply({
                            cls: 'ux-grid-hd-group-cell',
                            id: id,
                            row: row,
                            style: 'width:' + gs.width + ';' + (gs.hidden ? 'display:none;' : '') + (group.align ? 'text-align:' + group.align + ';' : ''),
                            tooltip: group.tooltip ? (Ext.QuickTips.isEnabled() ? 'ext:qtip' : 'title') + '="' + group.tooltip + '"' : '',
                            istyle: group.align == 'right' ? 'padding-right:16px' : '',
                            btn: this.grid.enableHdMenu && group.header,
                            value: group.header || '&nbsp;'
                        });

                        if (cm.isLockedHdGroup(row, i)) {
                            lcells[lcells.length] = htmlStr;
                        }
                        else {
                            cells[cells.length] = htmlStr;
                        }
                    }
                }
                headers[row] = ts.header.apply({
                    tstyle: tstyle,
                    cells: cells.join('')
                });

                lheaders[row] = ts.header.apply({
                    tstyle: ltstyle,
                    cells: lcells.join('')
                });
            }

            var cb = [], lcb = [];

            for (var i = 0; i < clen; i++) {
                if (cm.getColumnAt(i) === undefined) {
                    continue;
                }

                var p = {};
                p.id = cm.getColumnId(i);
                p.value = cm.getColumnHeader(i) || '';
                p.style = this.getColumnStyle(i, true);
                p.tooltip = this.getColumnTooltip(i);
                p.css = (i === 0 ? 'x-grid3-cell-first ' : (i == clen - 1 ? 'x-grid3-cell-last ' : '')) +
                    (cm.config[i].headerCls ? ' ' + cm.config[i].headerCls : '');
                if (cm.config[i].align == 'right') {
                    p.istyle = 'padding-right:16px';
                } else {
                    delete p.istyle;
                }
                if (cm.isLocked(i)) {
                    lcb[lcb.length] = ct.apply(p);
                } else {
                    cb[cb.length] = ct.apply(p);
                }
            }

            headers[rlen] = ts.header.apply({
                tstyle: tstyle,
                cells: cb.join('')
            });

            lheaders[rlen] = ts.header.apply({
                tstyle: ltstyle,
                cells: lcb.join('')
            });

            return [headers.join(''), lheaders.join('')];
        },

        renderTotalSummary: function () {
            var columnModel = this.cm,
                templates = this.templates,
                cellTemplate = templates.totalSummaryCell,
                rowTemplate = templates.totalSummary,
                summaryCells = [],
                lockedSummaryCells = [],
                columnCount = columnModel.getColumnCount(),
                tstyle = 'width:' + this.getTotalWidth() + ';',
                ltstyle = 'width:' + this.getLockedWidth() + ';';

            var columnData = this.getColumnData(),
                dataSource = this.grid.store.allData ? this.grid.store.allData.items : this.grid.store.data.items,
                summaryData = this.calculate(dataSource, columnData);

            for (var i = 0; i < columnCount; i++) {

                var column = columnModel.getColumnAt(i);

                if (column === undefined) {
                    continue;
                }

                var p = {};
                p.id = column.id;
                p.style = this.getColumnStyle(i);
                p.tooltip = '';

                p.css = (i === 0 ? 'x-grid3-total-summary-cell-first ' : (i == columnCount - 1 ? 'x-grid3-total-summary-cell-last ' : '')) +
                    (column.headerCls ? ' ' + column.headerCls : '');

                if (column.align == 'right') {
                    p.istyle = 'padding-right:16px';
                }

                /*
                *   не применяем рендерер столбца
                *
                if (column.summaryType || column.summaryRenderer) {
                    p.value = (column.summaryRenderer || column.renderer)(summaryData[column.dataIndex], p, summaryData, undefined, i, this.ds);
                }
                */

                if (column.summaryRenderer) {
                    p.value = column.summaryRenderer(summaryData[column.dataIndex], p, summaryData, undefined, i, this.ds);
                } else {
                    p.value = summaryData[column.dataIndex];
                }

                if (p.value == undefined || p.value === "") p.value = "&#160;";

                if (columnModel.isLocked(i)) {
                    lockedSummaryCells[lockedSummaryCells.length] = cellTemplate.apply(p);
                } else {
                    summaryCells[summaryCells.length] = cellTemplate.apply(p);
                }
            }

            var summaryRow = rowTemplate.apply({
                tstyle: tstyle,
                cells: summaryCells.join('')
            });

            var lockedSummaryRow = rowTemplate.apply({
                tstyle: ltstyle,
                cells: lockedSummaryCells.join('')
            });

            return [summaryRow, lockedSummaryRow];
        },

        onColumnWidthUpdated: function () {
            Ext.grid.GridView.prototype.onColumnWidthUpdated.apply(this, arguments);
            this.updateHdGroupStyles();
            this.updateGroupWidths();
        },

        onAllColumnWidthsUpdated: function () {
            Ext.grid.GridView.prototype.onAllColumnWidthsUpdated.apply(this, arguments);
            this.updateHdGroupStyles();
            this.updateGroupWidths();
        },

        onColumnHiddenUpdated: function () {
            Ext.grid.GridView.prototype.onColumnHiddenUpdated.apply(this, arguments);
            this.updateHdGroupStyles();
            this.updateGroupWidths();
        },

        getHeaderCell: function (index) {
            var lockedLen = this.cm.getLockedCount();
            if (index < lockedLen) {
                var lockedElements = this.lockedHd.dom.getElementsByTagName('td');
                for (var i = 0, lcellIdx = 0; i < lockedElements.length; i++) {
                    if (lockedElements[i].className.indexOf('ux-grid-hd-group-cell') < 0) {
                        if (lcellIdx == index) {
                            return lockedElements[i];
                        }
                        lcellIdx++;
                    }
                }
            } else {
                var elements = this.mainHd.dom.getElementsByTagName('td');
                for (var j = 0, cellIdx = 0; j < elements.length; j++) {
                    if (elements[j].className.indexOf('ux-grid-hd-group-cell') < 0) {
                        if (cellIdx + lockedLen == index) {
                            return elements[j];
                        }
                        cellIdx++;
                    }
                }
            }
        },

        findHeaderCell: function (el) {
            return el ? this.fly(el).findParent('td.x-grid3-hd', this.cellSelectorDepth) : false;
        },

        findHeaderIndex: function (el) {
            var cell = this.findHeaderCell(el);
            return cell ? this.getCellIndex(cell) : false;
        },

        updateSortIcon: function (col, dir) {
            var sortClasses = this.sortClasses,
                lockedHeaders = this.lockedHd.select(this.cellSelector).removeClass(sortClasses),
                headers = this.mainHd.select(this.cellSelector).removeClass(sortClasses),
                lockedLen = this.cm.getLockedCount(),
                cls = sortClasses[dir == 'DESC' ? 1 : 0];

            if (col < lockedLen) {
                lockedHeaders.item(col).addClass(cls);
            } else {
                headers.item(col - lockedLen).addClass(cls);
            }
        },

        handleHdDown: function (e, t) {
            Ext.grid.GridView.prototype.handleHdDown.call(this, e, t);
            var el = Ext.get(t);
            if (el.hasClass('x-grid3-hd-btn')) {
                e.stopEvent();
                var hd = this.findHeaderCell(t);
                Ext.fly(hd).addClass('x-grid3-hd-menu-open');
                var index = this.getCellIndex(hd);
                this.hdCtxIndex = index;
                var ms = this.hmenu.items, cm = this.cm;
                ms.get('asc').setDisabled(!cm.isSortable(index));
                ms.get('desc').setDisabled(!cm.isSortable(index));
                ms.get('lock').setDisabled(cm.isLocked(index));
                ms.get('unlock').setDisabled(!cm.isLocked(index));
                this.hmenu.on('hide', function () {
                    Ext.fly(hd).removeClass('x-grid3-hd-menu-open');
                }, this, {
                    single: true
                });
                this.hmenu.show(t, 'tl-bl?');
            } else if (el.hasClass('ux-grid-hd-group-cell') || Ext.fly(t).up('.ux-grid-hd-group-cell')) {
                e.stopEvent();
            }
        },

        handleHdMenuClick: function (item) {
            var index = this.hdCtxIndex,
                cm = this.cm,
                ds = this.ds,
                id = item.getItemId(),
                llen = cm.getLockedCount();
            switch (id) {
                case 'asc':
                    ds.sort(cm.getDataIndex(index), 'ASC');
                    break;
                case 'desc':
                    ds.sort(cm.getDataIndex(index), 'DESC');
                    break;
                case 'lock':
                    if (cm.getColumnCount(true) <= llen + 1) {
                        this.onDenyColumnLock();
                        return undefined;
                    }
                    var newColIndex = cm.processLockingHdGroups(index);
                    if (!newColIndex) {
                        newColIndex = llen;
                    }
                    cm.setLocked(index, true, newColIndex != index);
                    if (newColIndex != index) {
                        cm.moveColumn(index, newColIndex);
                        this.grid.fireEvent('columnmove', index, newColIndex);
                    }
                    break;
                case 'unlock':
                    var newColIndex = cm.processUnLockingHdGroups(index);
                    if (!newColIndex) {
                        newColIndex = llen - 1;
                    }
                    if (newColIndex != index) {
                        cm.setLocked(index, false, true);
                        cm.moveColumn(index, newColIndex);
                        this.grid.fireEvent('columnmove', index, newColIndex);
                    } else {
                        cm.setLocked(index, false);
                    }
                    break;
                default:
                    return this.handleHdMenuClickDefault(item);
            }
            return true;
        },

        handleHdMenuClickDefault: function (item) {
            var cm = this.cm, id = item.getItemId();
            if (id.substr(0, 6) == 'group-') {
                var i = id.split('-'), row = parseInt(i[1], 10), col = parseInt(i[2], 10), r = this.cm.rows[row], group, gcol = 0;
                for (var i = 0, len = r.length; i < len; i++) {
                    group = r[i];
                    if (col >= gcol && col < gcol + group.colspan) {
                        break;
                    }
                    gcol += group.colspan;
                }
                if (item.checked) {
                    var max = cm.getColumnsBy(this.isHideableColumn, this).length;
                    for (var i = gcol, len = gcol + group.colspan; i < len; i++) {
                        if (!cm.isHidden(i)) {
                            max--;
                        }
                    }
                    if (max < 1) {
                        this.onDenyColumnHide();
                        return false;
                    }
                }
                for (var i = gcol, len = gcol + group.colspan; i < len; i++) {
                    if (cm.config[i].fixed !== true && cm.config[i].hideable !== false) {
                        cm.setHidden(i, item.checked);
                    }
                }
            } else if (id.substr(0, 4) == 'col-') {
                var index = cm.getIndexById(id.substr(4));
                if (index != -1) {
                    if (item.checked && cm.getColumnsBy(this.isHideableColumn, this).length <= 1) {
                        this.onDenyColumnHide();
                        return false;
                    }
                    cm.setHidden(index, item.checked);
                }
            }
            if (id.substr(0, 6) == 'group-' || id.substr(0, 4) == 'col-') {
                item.checked = !item.checked;
                if (item.menu) {
                    var updateChildren = function (menu) {
                        menu.items.each(function (childItem) {
                            if (!childItem.disabled) {
                                childItem.setChecked(item.checked, false);
                                if (childItem.menu) {
                                    updateChildren(childItem.menu);
                                }
                            }
                        });
                    };

                    updateChildren(item.menu);
                }
                var parentMenu = item, parentItem;
                while (parentMenu = parentMenu.parentMenu) {
                    if (!parentMenu.parentMenu || !(parentItem = parentMenu.parentMenu.items.get(parentMenu.getItemId())) || !parentItem.setChecked) {
                        break;
                    }
                    var checked = parentMenu.items.findIndexBy(function (m) {
                        return m.checked;
                    }) >= 0;
                    parentItem.setChecked(checked, true);
                }
                item.checked = !item.checked;
            }
        },

        handleHdMove: function (e, t) {
            var hd = this.findHeaderCell(this.activeHdRef);
            if (hd && !this.headersDisabled && !Ext.fly(hd).hasClass('ux-grid-hd-group-cell')) {
                var hw = this.splitHandleWidth || 5, r = this.activeHdRegion, x = e.getPageX(), ss = hd.style, cur = '';
                if (this.grid.enableColumnResize !== false) {
                    if (x - r.left <= hw && this.cm.isResizable(this.activeHdIndex - 1)) {
                        cur = Ext.isAir ? 'move' : Ext.isWebKit ? 'e-resize' : 'col-resize'; // col-resize
                        // not
                        // always
                        // supported
                    } else if (r.right - x <= (!this.activeHdBtn ? hw : 2) && this.cm.isResizable(this.activeHdIndex)) {
                        cur = Ext.isAir ? 'move' : Ext.isWebKit ? 'w-resize' : 'col-resize';
                    }
                }
                ss.cursor = cur;
            }
        },

        handleHdOver: function (e, t) {
            var hd = this.findHeaderCell(t);
            if (hd && !this.headersDisabled) {
                this.activeHdRef = t;
                this.activeHdIndex = this.getCellIndex(hd);
                var fly = this.fly(hd);
                this.activeHdRegion = fly.getRegion();
                if (!(this.cm.isMenuDisabled(this.activeHdIndex) || fly.hasClass('ux-grid-hd-group-cell'))) {
                    fly.addClass('x-grid3-hd-over');
                    this.activeHdBtn = fly.child('.x-grid3-hd-btn');
                    if (this.activeHdBtn) {
                        this.activeHdBtn.dom.style.height = (hd.firstChild.offsetHeight - 1) + 'px';
                    }
                }
            }
        },

        handleHdOut: function (e, t) {
            var hd = this.findHeaderCell(t);
            if (hd && (!Ext.isIE || !e.within(hd, true))) {
                this.activeHdRef = null;
                this.fly(hd).removeClass('x-grid3-hd-over');
                hd.style.cursor = '';
            }
        },

        beforeColMenuShow: function () {
            var cm = this.cm, rows = this.cm.rows;
            this.colMenu.removeAll();
            for (var col = 0, clen = cm.getColumnCount(); col < clen; col++) {
                var menu = this.colMenu, title = cm.getColumnHeader(col), text = [];
                if (cm.config[col].fixed !== true && cm.config[col].hideable !== false) {
                    for (var row = 0, rlen = rows.length; row < rlen; row++) {
                        var r = rows[row], group, gcol = 0;
                        for (var i = 0, len = r.length; i < len; i++) {
                            group = r[i];
                            if (col >= gcol && col < gcol + group.colspan) {
                                break;
                            }
                            gcol += group.colspan;
                        }
                        if (group && group.header) {
                            if (cm.hierarchicalColMenu) {
                                var gid = 'group-' + row + '-' + gcol,
                                    item = menu.items ? menu.getComponent(gid) : null,
                                    submenu = item ? item.menu : null;
                                if (!submenu) {
                                    submenu = new Ext.menu.Menu({
                                        itemId: gid
                                    });
                                    submenu.on("itemclick", this.handleHdMenuClick, this);
                                    var checked = false, disabled = true;
                                    for (var c = gcol, lc = gcol + group.colspan; c < lc; c++) {
                                        if (!cm.isHidden(c)) {
                                            checked = true;
                                        }
                                        if (cm.config[c].hideable !== false) {
                                            disabled = false;
                                        }
                                    }
                                    menu.add({
                                        itemId: gid,
                                        text: group.header,
                                        menu: submenu,
                                        hideOnClick: false,
                                        checked: checked,
                                        disabled: disabled
                                    });
                                }
                                menu = submenu;
                            } else {
                                text.push(group.header);
                            }
                        }
                    }
                    text.push(title);
                    menu.add(new Ext.menu.CheckItem({
                        itemId: "col-" + cm.getColumnId(col),
                        text: text.join(' '),
                        checked: !cm.isHidden(col),
                        hideOnClick: false,
                        disabled: cm.config[col].hideable === false
                    }));
                }
            }
        },

        getEditorParent: function (ed) {
            return this.el.dom;
        },

        getLockedRows: function () {

            if (!this.canGroup()) {
                return this.hasRows() ? this.lockedBody.dom.childNodes : [];
            }

            var r = [],
                gs = this.getGroups(true),
                g,
                i = 0,
                len = gs.length,
                j,
                jlen;
            for (; i < len; ++i) {
                g = gs[i].childNodes[1];
                if (g) {
                    g = g.childNodes;
                    for (j = 0, jlen = g.length; j < jlen; ++j) {
                        r[r.length] = g[j];
                    }
                }
            }
            return r;
        },

        getLockedRow: function (row) {
            return this.getLockedRows()[row];
        },

        getTotalSummaryRow: function(locked){
            if (locked === true){
                return this.lockedTotalSummaryInner.firstChild.firstChild.firstChild.firstChild;
            } else {
                return  this.totalSummaryInner.firstChild.firstChild.firstChild.firstChild;
            }
        },

        getCell: function (row, col) {
            var lockedLen = this.cm.getLockedCount();
            if (col < lockedLen) {
                return Ext.fly(this.getLockedRow(row)).query(this.cellSelector)[col];
            }
            return Ext.grid.GridView.prototype.getCell.call(this, row, col - lockedLen);
        },

        addRowClass: function (row, cls) {
            var lockedRow = this.getLockedRow(row);
            if (lockedRow) {
                this.fly(lockedRow).addClass(cls);
            }
            Ext.grid.GridView.prototype.addRowClass.call(this, row, cls);
        },

        removeRowClass: function (row, cls) {
            var lockedRow = this.getLockedRow(row);
            if (lockedRow) {
                this.fly(lockedRow).removeClass(cls);
            }
            Ext.grid.GridView.prototype.removeRowClass.call(this, row, cls);
        },

        removeRow: function (row) {
            Ext.removeNode(this.getLockedRow(row));
            Ext.grid.GridView.prototype.removeRow.call(this, row);
        },

        removeRows: function (firstRow, lastRow) {
            var lockedBody = this.lockedBody.dom,
                rowIndex = firstRow;
            for (; rowIndex <= lastRow; rowIndex++) {
                Ext.removeNode(lockedBody.childNodes[firstRow]);
            }
            Ext.grid.GridView.prototype.removeRows.call(this, firstRow, lastRow);
        },

        syncScroll: function (e) {
            this.lockedScroller.dom.scrollTop = this.scroller.dom.scrollTop;

            this.totalSummaryInner.scrollLeft = this.scroller.dom.scrollLeft;
            this.totalSummaryInner.scrollLeft = this.scroller.dom.scrollLeft;  // second time for IE (1/2 time first fails, other browsers ignore)

            Ext.grid.GridView.prototype.syncScroll.call(this, e);
        },

        updateAllColumnWidths: function () {
            var tw = this.getTotalWidth(),
                clen = this.cm.getColumnCount(),
                lw = this.getLockedWidth(),
                llen = this.cm.getLockedCount(),
                ws = [], len, i;
            this.updateLockedWidth();
            for (i = 0; i < clen; i++) {
                ws[i] = this.getColumnWidth(i);
                var hd = this.getHeaderCell(i);
                hd.style.width = ws[i];
            }
            var lns = this.getLockedRows(), ns = this.getRows(), row, trow, j;
            for (i = 0, len = ns.length; i < len; i++) {
                row = lns[i];
                row.style.width = lw;
                if (row.firstChild) {
                    row.firstChild.style.width = lw;
                    trow = row.firstChild.rows[0];
                    for (j = 0; j < llen; j++) {
                        trow.childNodes[j].style.width = ws[j];
                    }
                }
                row = ns[i];
                row.style.width = tw;
                if (row.firstChild) {
                    row.firstChild.style.width = tw;
                    trow = row.firstChild.rows[0];
                    for (j = llen; j < clen; j++) {
                        trow.childNodes[j - llen].style.width = ws[j];
                    }
                }
            }
            this.onAllColumnWidthsUpdated(ws, tw);
            this.syncHeaderHeight();
        },

        updateColumnWidth: function (col, width) {
            var w = this.getColumnWidth(col),
                llen = this.cm.getLockedCount(),
                totalSummaryRow,
                ns, rw, c, row;
            this.updateLockedWidth();
            if (col < llen) {
                ns = this.getLockedRows();
                rw = this.getLockedWidth();
                totalSummaryRow = this.getTotalSummaryRow(true);
                c = col;
            } else {
                ns = this.getRows();
                rw = this.getTotalWidth();
                c = col - llen;
                totalSummaryRow = this.getTotalSummaryRow(false);
            }
            var hd = this.getHeaderCell(col);
            hd.style.width = w;
            for (var i = 0, len = ns.length; i < len; i++) {
                row = ns[i];
                row.style.width = rw;
                if (row.firstChild) {
                    row.firstChild.style.width = rw;
                    row.firstChild.rows[0].childNodes[c].style.width = w;
                }
            }

            totalSummaryRow.childNodes[c].style.width = w;

            this.onColumnWidthUpdated(col, w, this.getTotalWidth());
            this.syncHeaderHeight();
        },

        updateColumnHidden: function (col, hidden) {
            var llen = this.cm.getLockedCount(),
                ns, rw, c, row,
                totalSummaryRow,
                display = hidden ? 'none' : '';
            this.updateLockedWidth();
            if (col < llen) {
                ns = this.getLockedRows();
                rw = this.getLockedWidth();
                totalSummaryRow = this.getTotalSummaryRow(true);
                c = col;
            } else {
                ns = this.getRows();
                rw = this.getTotalWidth();
                totalSummaryRow = this.getTotalSummaryRow(false);
                c = col - llen;
            }
            var hd = this.getHeaderCell(col);
            hd.style.display = display;
            for (var i = 0, len = ns.length; i < len; i++) {
                row = ns[i];
                row.style.width = rw;
                if (row.firstChild) {
                    row.firstChild.style.width = rw;
                    row.firstChild.rows[0].childNodes[c].style.display = display;
                }
            }

            totalSummaryRow.childNodes[c].style.display = display;

            this.onColumnHiddenUpdated(col, hidden, this.getTotalWidth());
            delete this.lastViewWidth;
            this.layout();
        },

        doRender: function (cs, rs, ds, startRow, colCount, stripe) {
            if (rs.length < 1) {
                return '';
            }

            if (!this.canGroup() || this.isUpdating) {
                return this.doRenderRows(cs, rs, ds, startRow, colCount, stripe);
            }

            var groupField = this.getGroupField(),
                colIndex = this.cm.findColumnIndex(groupField),
                g,
                gstyle = 'width:' + this.getTotalWidth() + ';',
                lgstyle = 'width:' + this.getLockedWidth() + ';',
                cfg = this.cm.config[colIndex],
                groupRenderer = cfg.groupRenderer || cfg.renderer,
                prefix = this.showGroupName ? (cfg.groupName || cfg.header) + ': ' : '',
                groups = [],
                curGroup, i, len, gid;

            for (i = 0, len = rs.length; i < len; i++) {
                var rowIndex = startRow + i,
                    r = rs[i],
                    gvalue = r.data[groupField];

                g = this.getGroup(gvalue, r, groupRenderer, rowIndex, colIndex, ds);
                if (!curGroup || curGroup.group != g) {
                    gid = this.constructId(gvalue, groupField, colIndex);
                    // if state is defined use it, however state is in terms of expanded
                    // so negate it, otherwise use the default.
                    this.state[gid] = !(Ext.isDefined(this.state[gid]) ? !this.state[gid] : this.startCollapsed);
                    curGroup = {
                        group: g,
                        gvalue: gvalue,
                        text: prefix + g,
                        groupId: gid,
                        startRow: rowIndex,
                        rs: [r],
                        cls: this.state[gid] ? '' : 'x-grid-group-collapsed'
                    };
                    groups.push(curGroup);
                } else {
                    curGroup.rs.push(r);
                }
                r._groupId = gid;
            }

            var buf = [], lbuf = [];
            for (i = 0, len = groups.length; i < len; i++) {
                g = groups[i];
                g.style = gstyle;
                this.doGroupStart(buf, g, cs, ds, colCount, false);
                g.style = lgstyle;
                this.doGroupStart(lbuf, g, cs, ds, colCount, true);

                var rowBuf = this.doRenderRows(cs, g.rs, ds, g.startRow, colCount, stripe);

                buf[buf.length] = rowBuf[0];
                lbuf[lbuf.length] = rowBuf[1];

                this.doGroupEnd(buf, g, cs, ds, colCount, false);
                this.doGroupEnd(lbuf, g, cs, ds, colCount, true);
            }
            return [buf.join(''), lbuf.join('')];
        },

        doRenderRows: function (cs, rs, ds, startRow, colCount, stripe) {
            var ts = this.templates, ct = ts.cell, rt = ts.row, last = colCount - 1,
                tstyle = 'width:' + this.getTotalWidth() + ';',
                lstyle = 'width:' + this.getLockedWidth() + ';',
                buf = [], lbuf = [], cb, lcb, c, p = {}, rp = {}, r;
            for (var j = 0, len = rs.length; j < len; j++) {
                r = rs[j];
                cb = [];
                lcb = [];
                var rowIndex = (j + startRow);
                for (var i = 0; i < colCount; i++) {
                    c = cs[i];
                    p.id = c.id;
                    p.css = (i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '')) +
                        (this.cm.config[i].cellCls ? ' ' + this.cm.config[i].cellCls : '');
                    p.attr = p.cellAttr = '';
                    p.value = c.renderer.call(c.scope, r.data[c.name], p, r, rowIndex, i, ds);
                    p.style = c.style;
                    if (Ext.isEmpty(p.value)) {
                        p.value = '&#160;';
                    }
                    if (this.markDirty && r.dirty && Ext.isDefined(r.modified[c.name])) {
                        p.css += ' x-grid3-dirty-cell';
                    }

                    if (!Ext.isEmpty(r.error) && Ext.isDefined(r.data[c.name])) {

                        var matchedCols = r.error.filter(function (item) {
                            return item.errorText && item.column == c.name;
                        });

                        if (!Ext.isEmpty(matchedCols)) {
                            p.css += ' x-grid3-row-invalid';
                            p.css += ' x-form-invalid';
                        }
                    }

                    if (c.locked) {
                        lcb[lcb.length] = ct.apply(p);
                    } else {
                        cb[cb.length] = ct.apply(p);
                    }
                }
                var alt = [];
                if (stripe && ((rowIndex + 1) % 2 === 0)) {
                    alt[0] = 'x-grid3-row-alt';
                }
                if (r.dirty) {
                    alt[1] = ' x-grid3-dirty-row';
                }
                rp.cols = colCount;
                if (this.getRowClass) {
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

        processRows: function (startRow, skipStripe) {
            if (!this.ds || this.ds.getCount() < 1) {
                return;
            }
            var rows = this.getRows(),
                lrows = this.getLockedRows(),
                row, lrow;
            skipStripe = skipStripe || !this.grid.stripeRows;
            startRow = startRow || 0;
            for (var i = 0, len = rows.length; i < len; ++i) {
                row = rows[i];
                lrow = lrows[i];
                row.rowIndex = i;
                lrow.rowIndex = i;
                if (!skipStripe) {
                    row.className = row.className.replace(this.rowClsRe, ' ');
                    lrow.className = lrow.className.replace(this.rowClsRe, ' ');
                    if ((i + 1) % 2 === 0) {
                        row.className += ' x-grid3-row-alt';
                        lrow.className += ' x-grid3-row-alt';
                    }
                }
                this.syncRowHeights(row, lrow);
            }
            if (startRow === 0) {
                Ext.fly(rows[0]).addClass(this.firstRowCls);
                Ext.fly(lrows[0]).addClass(this.firstRowCls);
            }
            Ext.fly(rows[rows.length - 1]).addClass(this.lastRowCls);
            Ext.fly(lrows[lrows.length - 1]).addClass(this.lastRowCls);
        },

        syncRowHeights: function (row1, row2) {
            if (this.syncHeights) {
                var el1 = Ext.get(row1),
                    el2 = Ext.get(row2);

                // сбрасываем текущие высоты строк
                el1.dom.style.height = '';
                el2.dom.style.height = '';

                var h1 = el1.getHeight(),
                    h2 = el2.getHeight();

                if (h1 > h2) {
                    el2.setHeight(h1);
                } else if (h2 > h1) {
                    el1.setHeight(h2);
                }
            }
        },

        afterRender: function () {
            if (!this.ds || !this.cm) {
                return;
            }
            var bd = this.renderRows() || ['&#160;', '&#160;'];
            this.mainBody.dom.innerHTML = bd[0];
            this.lockedBody.dom.innerHTML = bd[1];
            this.processRows(0, true);
            if (this.deferEmptyText !== true) {
                this.applyEmptyText();
            }
            this.grid.fireEvent('viewready', this.grid);

            if (this.grid.deferRowRender) {
                this.updateGroupWidths();
            }
        },

        layout: function () {
            if (!this.mainBody) {
                return;
            }
            var g = this.grid;
            var c = g.getGridEl();
            var csize = c.getSize(true);
            var vw = csize.width;
            if (!g.hideHeaders && (vw < 20 || csize.height < 20)) {
                return;
            }
            this.syncHeaderHeight();
            if (g.autoHeight) {
                this.scroller.dom.style.overflow = 'visible';
                this.lockedScroller.dom.style.overflow = 'visible';
                if (Ext.isWebKit) {
                    this.scroller.dom.style.position = 'static';
                    this.lockedScroller.dom.style.position = 'static';
                }
            } else {
                this.el.setSize(csize.width, csize.height);
                var hdHeight = this.mainHd.getHeight();
                var totalSummaryHeight = this.totalSummary.getHeight();
                var vh = csize.height - (hdHeight) - (totalSummaryHeight);
            }
            this.updateLockedWidth();

            if (this.forceFit) {
                if (this.lastViewWidth != vw) {
                    this.fitColumns(false, false);
                    this.lastViewWidth = vw;
                }
            } else {
                this.autoExpand();
                this.syncHeaderScroll();
            }
            this.onLayout(vw, vh);
        },

        getOffsetWidth: function () {
            return (this.cm.getTotalWidth() - this.cm.getTotalLockedWidth() + this.getScrollOffset()) + 'px';
        },

        updateHeaders: function () {
            var hd = this.renderHeaders();
            this.innerHd.firstChild.innerHTML = hd[0];
            this.innerHd.firstChild.style.width = this.getOffsetWidth();
            this.innerHd.firstChild.firstChild.style.width = this.getTotalWidth();
            this.lockedInnerHd.firstChild.innerHTML = hd[1];
            var lw = this.getLockedWidth();
            this.lockedInnerHd.firstChild.style.width = lw;
            this.lockedInnerHd.firstChild.firstChild.style.width = lw;
        },

        updateTotalSummary: function () {
            var totalsummary = this.renderTotalSummary();

            this.totalSummaryInner.firstChild.innerHTML = totalsummary[0];
            this.totalSummaryInner.firstChild.style.width = this.getOffsetWidth();
            this.totalSummaryInner.firstChild.firstChild.style.width = this.getTotalWidth();

            this.lockedTotalSummaryInner.firstChild.innerHTML = totalsummary[1];
            var lw = this.getLockedWidth();
            this.lockedTotalSummaryInner.firstChild.style.width = lw;
            this.lockedTotalSummaryInner.firstChild.firstChild.style.width = lw;
        },

        getResolvedXY: function (resolved) {
            if (!resolved) {
                return null;
            }
            var c = resolved.cell, r = resolved.row;
            return c ? Ext.fly(c).getXY() : [this.scroller.getX(), Ext.fly(r).getY()];
        },

        syncFocusEl: function (row, col, hscroll) {
            Ext.grid.GridView.prototype.syncFocusEl.call(this, row, col, col < this.cm.getLockedCount() ? false : hscroll);
        },

        ensureVisible: function (row, col, hscroll) {
            return Ext.grid.GridView.prototype.ensureVisible.call(this, row, col, col < this.cm.getLockedCount() ? false : hscroll);
        },

        insertRows: function (dm, firstRow, lastRow, isUpdate) {
            var last = dm.getCount() - 1;
            if (!isUpdate && firstRow === 0 && lastRow >= last) {
                this.refresh();
            } else {
                if (!isUpdate) {
                    this.fireEvent('beforerowsinserted', this, firstRow, lastRow);
                }
                var html = this.renderRows(firstRow, lastRow),
                    before = this.getRow(firstRow);
                if (before) {
                    if (firstRow === 0) {
                        this.removeRowClass(0, this.firstRowCls);
                    }
                    Ext.DomHelper.insertHtml('beforeBegin', before, html[0]);
                    before = this.getLockedRow(firstRow);
                    Ext.DomHelper.insertHtml('beforeBegin', before, html[1]);
                } else {
                    this.removeRowClass(last - 1, this.lastRowCls);
                    Ext.DomHelper.insertHtml('beforeEnd', this.mainBody.dom, html[0]);
                    Ext.DomHelper.insertHtml('beforeEnd', this.lockedBody.dom, html[1]);
                }
                if (!isUpdate) {
                    this.fireEvent('rowsinserted', this, firstRow, lastRow);
                    this.processRows(firstRow);
                } else if (firstRow === 0 || firstRow >= last) {
                    this.addRowClass(firstRow, firstRow === 0 ? this.firstRowCls : this.lastRowCls);
                }
            }
            this.syncFocusEl(firstRow);
        },

        getColumnStyle: function (col, isHeader) {
            var style = !isHeader ? this.cm.config[col].cellStyle || this.cm.config[col].css || '' : this.cm.config[col].headerStyle || '';
            style += 'width:' + this.getColumnWidth(col) + ';';
            if (this.cm.isHidden(col)) {
                style += 'display:none;';
            }
            var align = this.cm.config[col].align;
            if (align) {
                style += 'text-align:' + align + ';';
            }
            return style;
        },

        getColumnWidth: function (column) {
            var columnWidth = this.cm.getColumnWidth(column),
                borderWidth = this.borderWidth;

            if (Ext.isNumber(columnWidth)) {
                if (Ext.isBorderBox || (Ext.isWebKit && !Ext.isSafari2 && !Ext.isChrome)) {
                    return columnWidth + "px";
                } else {
                    return Math.max(columnWidth - borderWidth, 0) + "px";
                }
            } else {
                return columnWidth;
            }
        },

        getLockedWidth: function () {
            return this.cm.getTotalLockedWidth() + 'px';
        },

        getTotalWidth: function () {
            return (this.cm.getTotalWidth() - this.cm.getTotalLockedWidth()) + 'px';
        },

        getColumnData: function () {
            var cs = [], cm = this.cm, colCount = cm.getColumnCount();
            for (var i = 0; i < colCount; i++) {
                var name = cm.getDataIndex(i);
                cs[i] = {
                    name: (!Ext.isDefined(name) ? this.ds.fields.get(i).name : name),
                    renderer: cm.getRenderer(i),
                    scope: cm.getRendererScope(i),
                    id: cm.getColumnId(i),
                    style: this.getColumnStyle(i),
                    locked: cm.isLocked(i)
                };
            }
            return cs;
        },

        renderBody: function () {
            var markup = this.renderRows() || ['&#160;', '&#160;'];
            return [this.templates.body.apply({rows: markup[0]}), this.templates.body.apply({rows: markup[1]})];
        },

        refreshRow: function (record) {
            var store = this.ds,
                colCount = this.cm.getColumnCount(),
                columns = this.getColumnData(),
                last = colCount - 1,
                cls = ['x-grid3-row'],
                rowParams = {
                    tstyle: String.format("width: {0};", this.getTotalWidth())
                },
                lockedRowParams = {
                    tstyle: String.format("width: {0};", this.getLockedWidth())
                },
                colBuffer = [],
                lockedColBuffer = [],
                cellTpl = this.templates.cell,
                rowIndex,
                row,
                lockedRow,
                column,
                meta,
                css,
                i;

            this.isUpdating = true;

            if (Ext.isNumber(record)) {
                rowIndex = record;
                record = store.getAt(rowIndex);
            } else {
                rowIndex = store.indexOf(record);
            }

            if (!record || rowIndex < 0) {
                return;
            }

            for (i = 0; i < colCount; i++) {
                column = columns[i];

                if (i == 0) {
                    css = 'x-grid3-cell-first';
                } else {
                    css = (i == last) ? 'x-grid3-cell-last ' : '';
                }

                meta = {
                    id: column.id,
                    style: column.style,
                    css: css,
                    attr: "",
                    cellAttr: ""
                };

                meta.value = column.renderer.call(column.scope, record.data[column.name], meta, record, rowIndex, i, store);

                if (Ext.isEmpty(meta.value)) {
                    meta.value = '&#160;';
                }

                if (this.markDirty && record.dirty && Ext.isDefined(record.modified[column.name])) {
                    meta.css += ' x-grid3-dirty-cell';
                }

                if (!Ext.isEmpty(record.error) && Ext.isDefined(record.data[column.name])) {

                    var matchedCols = record.error.filter(function (item) {
                        return item.errorText && item.column == column.name;
                    });

                    if (!Ext.isEmpty(matchedCols)) {
                        meta.css += ' x-grid3-row-invalid';
                        meta.css += ' x-form-invalid';
                    }
                }

                if (column.locked) {
                    lockedColBuffer[i] = cellTpl.apply(meta);
                } else {
                    colBuffer[i] = cellTpl.apply(meta);
                }
            }

            row = this.getRow(rowIndex);
            row.className = '';
            lockedRow = this.getLockedRow(rowIndex);
            lockedRow.className = '';

            if (this.grid.stripeRows && ((rowIndex + 1) % 2 === 0)) {
                cls.push('x-grid3-row-alt');
            }

            if (this.getRowClass) {
                rowParams.cols = colCount;
                cls.push(this.getRowClass(record, rowIndex, rowParams, store));
            }

            // Unlocked rows
            this.fly(row).addClass(cls).setStyle(rowParams.tstyle);
            rowParams.cells = colBuffer.join("");
            row.innerHTML = this.templates.rowInner.apply(rowParams);

            // Locked rows
            this.fly(lockedRow).addClass(cls).setStyle(lockedRowParams.tstyle);
            lockedRowParams.cells = lockedColBuffer.join("");
            lockedRow.innerHTML = this.templates.rowInner.apply(lockedRowParams);
            lockedRow.rowIndex = rowIndex;
            this.syncRowHeights(row, lockedRow);
            this.fireEvent('rowupdated', this, rowIndex, record);

            this.isUpdating = false;
        },

        refresh: function (headersToo) {
            this.fireEvent('beforerefresh', this);
            this.grid.stopEditing(true);
            var result = this.renderBody();
            this.mainBody.update(result[0]).setWidth(this.getTotalWidth());
            this.lockedBody.update(result[1]).setWidth(this.getLockedWidth());
            if (headersToo === true) {
                this.updateHeaders();
                this.updateHeaderSortState();
            }

            this.processRows(0, true);
            this.updateTotalSummary();
            this.layout();
            this.applyEmptyText();
            this.fireEvent('refresh', this);
        },

        onDenyColumnLock: function () {

        },

        initData: function (ds, cm) {
            if (this.cm) {
                this.cm.un('columnlockchange', this.onColumnLock, this);
            }
            Ext.grid.GridView.prototype.initData.call(this, ds, cm);
            if (this.cm) {
                this.cm.on('columnlockchange', this.onColumnLock, this);
            }
        },

        onColumnLock: function () {
            this.refresh(true);
        },

        syncHeaderHeight: function () {
            var hrows = this.mainHd.dom.getElementsByTagName('tr'),
                lhrows = this.lockedHd.dom.getElementsByTagName('tr');

            if (lhrows.length != hrows.length) {
                return;
            }

            for (var i = 0; i < hrows.length; i++) {
                var hrow = hrows[i],
                    lhrow = lhrows[i];

                hrow.style.height = 'auto';
                lhrow.style.height = 'auto';
                var hd = hrow.offsetHeight,
                    lhd = lhrow.offsetHeight,
                    height = Math.max(lhd, hd) + 'px';

                hrow.style.height = height;
                lhrow.style.height = height;
            }
        },

        updateLockedWidth: function () {
            var lw = this.cm.getTotalLockedWidth(),
                tw = this.cm.getTotalWidth() - lw,
                csize = this.grid.getGridEl().getSize(true),
                lp = Ext.isBorderBox ? 0 : this.lockedBorderWidth,
                rp = Ext.isBorderBox ? 0 : this.rowBorderWidth,
                vw = Math.max(csize.width - lw - lp - rp, 0) + 'px',
                so = this.getScrollOffset();
            if (!this.grid.autoHeight) {
                var vh = Math.max(csize.height - this.mainHd.getHeight() - this.totalSummary.getHeight(), 0) + 'px';
                this.lockedScroller.dom.style.height = vh;
                this.scroller.dom.style.height = vh;
            }
            this.lockedWrap.dom.style.width = (lw + rp) + 'px';
            this.scroller.dom.style.width = vw;
            this.mainWrap.dom.style.left = (lw + lp + rp) + 'px';

            if (this.lockedInnerHd)    {
                this.lockedInnerHd.firstChild.style.width = lw + 'px';
                this.lockedInnerHd.firstChild.firstChild.style.width = lw + 'px';
            }

            if (this.innerHd) {
                this.innerHd.style.width = vw;
                this.innerHd.firstChild.style.width = (tw + rp + so) + 'px';
                this.innerHd.firstChild.firstChild.style.width = tw + 'px';
            }

            if (this.lockedBody)   {
                this.lockedBody.dom.style.width = (lw + rp) + 'px';
            }

            if (this.mainBody) {
                this.mainBody.dom.style.width = (tw + rp) + 'px';
            }

            if (this.totalSummaryInner){
                this.totalSummaryInner.style.width = vw;
                this.totalSummaryInner.firstChild.style.width = (tw + rp + so) + 'px';
                this.totalSummaryInner.firstChild.firstChild.style.width = tw + 'px';
            }

            if (this.lockedTotalSummaryInner)    {
                this.lockedTotalSummaryInner.firstChild.style.width = lw + 'px';
                this.lockedTotalSummaryInner.firstChild.firstChild.style.width = lw + 'px';
            }
        },

        getGroupStyle: function (group, gcol) {
            var width = 0, hidden = true;
            for (var i = gcol, len = gcol + group.colspan; i < len; i++) {
                if (this.cm.getColumnAt(i) !== undefined && !this.cm.isHidden(i)) {
                    var cw = this.cm.getColumnWidth(i);
                    if (typeof cw == 'number') {
                        width += cw;
                    }
                    hidden = false;
                }
            }
            return {
                width: (Ext.isBorderBox || (Ext.isWebKit && !Ext.isSafari2 && !Ext.isChrome) ? width : Math.max(width - this.borderWidth, 0)) + 'px',
                hidden: hidden
            };
        },

        updateHdGroupStyles: function (col) {
            var tables = this.mainHd.query('.x-grid3-header-offset > table'),
                ltables = this.lockedHd.query('.x-grid3-header-offset > table'),
                ltw = this.getLockedWidth(),
                tw = this.getTotalWidth(),
                rows = this.cm.rows,
                lockedColumnCount = this.cm.getLockedCount();

            for (var row = 0; row < tables.length; row++) {
                tables[row].style.width = tw;
                if (row < rows.length) {
                    var lockedGroupCount = this.cm.getLockedHdGroupCount(row);
                    var cells = tables[row].firstChild.firstChild.childNodes;
                    for (var i = 0, gcol = lockedColumnCount; i < cells.length; i++) {
                        var group = rows[row][i + lockedGroupCount];
                        if ((typeof col != 'number') || (col >= gcol && col < gcol + group.colspan)) {
                            var gs = this.getGroupStyle(group, gcol);
                            cells[i].style.width = gs.width;
                            cells[i].style.display = gs.hidden ? 'none' : '';
                        }
                        gcol += group.colspan;
                    }
                }
            }

            for (var row = 0; row < ltables.length; row++) {
                ltables[row].style.width = ltw;
                if (row < rows.length) {
                    var cells = ltables[row].firstChild.firstChild.childNodes;
                    for (var i = 0, gcol = 0; i < cells.length; i++) {
                        var group = rows[row][i];
                        if ((typeof col != 'number') || (col >= gcol && col < gcol + group.colspan)) {
                            var gs = this.getGroupStyle(group, gcol);
                            cells[i].style.width = gs.width;
                            cells[i].style.display = gs.hidden ? 'none' : '';
                        }
                        gcol += group.colspan;
                    }
                }
            }

        },

        renderUI: function () {
            var templates = this.templates,
                header = this.renderHeaders(),
                body = templates.body.apply({rows: '&#160;'}),
                totalSummary = this.renderTotalSummary();

            return templates.masterTpl.apply({
                body: body,
                header: header[0],
                totalSummary: totalSummary[0],
                ostyle: 'width:' + this.getOffsetWidth() + ';',
                bstyle: 'width:' + this.getTotalWidth() + ';',
                lockedBody: body,
                lockedHeader: header[1],
                lockedTotalSummary: totalSummary[1],
                lstyle: 'width:' + this.getLockedWidth() + ';'
            });
        },

        afterRenderUI: function () {
            var g = this.grid;
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
            this.scroller.on('scroll', this.syncScroll, this);
            if (g.enableColumnResize !== false) {
                this.splitZone = new Ext.grid.GridView.SplitDragZone(g, this.mainHd.dom);
                this.splitZone.setOuterHandleElId(Ext.id(this.lockedHd.dom));
                this.splitZone.setOuterHandleElId(Ext.id(this.mainHd.dom));
                Ext.apply(this.splitZone, Ext.ux.grid.LockingGridColumnWithHeaderGroup.prototype.splitZoneConfig);
            }
            if (g.enableColumnMove) {
                this.columnDrag = new Ext.grid.GridView.ColumnDragZone(g, this.innerHd);
                this.columnDrag.setOuterHandleElId(Ext.id(this.lockedInnerHd));
                this.columnDrag.setOuterHandleElId(Ext.id(this.innerHd));
                this.columnDrop = new Ext.grid.HeaderDropZone(g, this.mainHd.dom);
                Ext.apply(this.columnDrop, Ext.ux.grid.LockingGridColumnWithHeaderGroup.prototype.columnDropConfig);
            }
            if (g.enableHdMenu !== false) {
                this.hmenu = new Ext.menu.Menu({id: g.id + '-hctx'});
                this.hmenu.add(
                    {itemId: 'asc', text: this.sortAscText, cls: 'xg-hmenu-sort-asc'},
                    {itemId: 'desc', text: this.sortDescText, cls: 'xg-hmenu-sort-desc'}
                );
                if (g.enableColLock !== false) {
                    this.hmenu.add('-',
                        {itemId: 'lock', text: this.lockText, cls: 'xg-hmenu-lock'},
                        {itemId: 'unlock', text: this.unlockText, cls: 'xg-hmenu-unlock'}
                    );
                }
                if (g.enableColumnHide !== false) {
                    this.colMenu = new Ext.menu.Menu({id: g.id + '-hcols-menu'});
                    this.colMenu.on({
                        scope: this,
                        beforeshow: this.beforeColMenuShow,
                        itemclick: this.handleHdMenuClick
                    });
                    this.hmenu.add('-', {
                        itemId: 'columns',
                        hideOnClick: false,
                        text: this.columnsText,
                        menu: this.colMenu,
                        iconCls: 'x-cols-icon'
                    });
                }
                if (this.enableGroupingMenu) {
                    this.hmenu.add('-', {
                        itemId: 'groupBy',
                        text: this.groupByText,
                        handler: this.onGroupByClick,
                        scope: this,
                        iconCls: 'x-group-by-icon'
                    });

                    if (this.enableNoGroups) {
                        this.hmenu.add({
                            itemId: 'showGroups',
                            text: this.showGroupsText,
                            checked: true,
                            checkHandler: this.onShowGroupsClick,
                            scope: this
                        });
                    }

                    this.hmenu.on('beforeshow', this.beforeMenuShow, this);
                }
                this.hmenu.on('itemclick', this.handleHdMenuClick, this);
            }
            if (g.trackMouseOver) {
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
            if (g.enableDragDrop || g.enableDrag) {
                this.dragZone = new Ext.grid.GridDragZone(g, {
                    ddGroup: g.ddGroup || 'GridDD'
                });
            }
            this.updateHeaderSortState();
        },

        //GroupingView methods **************************************

        syncGroupHeaderHeights: function () {
            if (!this.canGroup() || !this.hasRows()) {
                return;
            }

            var gs = this.getGroups(false),
                lgs = this.getGroups(true);

            if (gs.length != lgs.length) {
                return;
            }

            for (var i = 0, len = gs.length; i < len; i++) {
                var el1 = gs[i].childNodes[0],
                    el2 = lgs[i].childNodes[0];

                el1.style.height = 'auto';
                el2.style.height = 'auto';

                var h1 = el1.offsetHeight,
                    h2 = el2.offsetHeight,
                    height = Math.max(h1, h2) + 'px';

                el1.style.height = height;
                el2.style.height = height;
            }
        },

        findGroup: function (el) {
            return Ext.fly(el).up('.x-grid-group', this.mainBody.dom);
        },

        getGroups: function (lockedArea) {
            if (!this.hasRows()) {
                return [];
            }

            if (lockedArea) {
                return this.lockedBody.dom.childNodes;
            } else {
                return this.mainBody.dom.childNodes;
            }
        },

        onAdd: function (ds, records, index) {
            if (this.canGroup() && !this.ignoreAdd) {
                var ss = this.getScrollState();
                this.fireEvent('beforerowsinserted', ds, index, index + (records.length - 1));
                this.refresh();
                this.restoreScroll(ss);
                this.fireEvent('rowsinserted', ds, index, index + (records.length - 1));
            } else if (!this.canGroup()) {
                Ext.grid.GridView.prototype.onAdd.apply(this, arguments);
            }
        },

        onRemove: function (ds, record, index, isUpdate) {
            Ext.grid.GridView.prototype.onRemove.apply(this, arguments);

            var grNodes = this.findGroupNodes(record._groupId),
                gel = grNodes[0],
                lgel = grNodes[1],
                toUpdateSummary = false;

            if (gel && gel.childNodes[1].childNodes.length < 1) {
                Ext.removeNode(gel);
            } else {
                toUpdateSummary = true;
            }

            if (lgel && lgel.childNodes[1].childNodes.length < 1) {
                Ext.removeNode(lgel);
            } else {
                toUpdateSummary = true;
            }

            if ((!isUpdate) && toUpdateSummary) {
                this.refreshSummaryById(record._groupId);
                this.updateTotalSummary();
            }

            this.applyEmptyText();
        },

        beforeMenuShow: function () {
            var item, items = this.hmenu.items, disabled = this.cm.config[this.hdCtxIndex].groupable === false;
            if ((item = items.get('groupBy'))) {
                item.setDisabled(disabled);
            }
            if ((item = items.get('showGroups'))) {
                item.setDisabled(disabled);
                item.setChecked(this.canGroup(), true);
            }
        },

        processEvent: function (name, e) {
            Ext.grid.GridView.prototype.processEvent.call(this, name, e);
            var hd = e.getTarget('.x-grid-group-hd', this.mainBody);
            if (hd) {
                // group value is at the end of the string
                var field = this.getGroupField(),
                    prefix = this.getPrefix(field),
                    groupValue = hd.id.substring(prefix.length),
                    emptyRe = new RegExp('gp-' + Ext.escapeRe(field) + '--hd');

                // remove trailing '-hd'
                groupValue = groupValue.substr(0, groupValue.length - 3);

                // also need to check for empty groups
                if (groupValue || emptyRe.test(hd.id)) {
                    this.grid.fireEvent('group' + name, this.grid, field, groupValue, e);
                }
                if (name == 'mousedown' && e.button == 0) {
                    this.toggleGroup(hd.parentNode);
                }
            }
        },

        onGroupByClick: function () {
            var grid = this.grid;
            this.enableGrouping = true;
            grid.store.groupBy(this.cm.getDataIndex(this.hdCtxIndex));
            grid.fireEvent('groupchange', grid, grid.store.getGroupState());
            this.beforeMenuShow(); // Make sure the checkboxes get properly set when changing groups
            this.refresh();
        },

        onShowGroupsClick: function (mi, checked) {
            this.enableGrouping = checked;
            if (checked) {
                this.onGroupByClick();
            } else {
                this.grid.store.clearGrouping();
                this.grid.fireEvent('groupchange', this, null);
            }
        },

        /**
         * Toggle the group that contains the specific row.
         * @param {Number} rowIndex The row inside the group
         * @param {Boolean} expanded (optional)
         */
        toggleRowIndex: function (rowIndex, expanded) {
            if (!this.canGroup()) {
                return;
            }
            var row = this.getRow(rowIndex);
            if (row) {
                this.toggleGroup(this.findGroup(row), expanded);
            }
        },

        findGroupNodes: function (groupNodeId) {
            var gel, lgel;

            var els = this.mainBody.dom.childNodes,
                lels = this.lockedBody.dom.childNodes;

            var isSameGroup = function (g1, g2) {
                // Приводим к одному виду xxxx-l
                if (g1 && g1.substr(g1.length - 2) !== '-l') {
                    g1 += '-l';
                }
                if (g2 && g2.substr(g1.length - 2) !== '-l') {
                    g2 += '-l';
                }

                return g1 === g2;
            };

            if (els && lels) {
                for (var i = 0; i < els.length; i++) {
                    if (isSameGroup(els[i].id, groupNodeId)) {
                        gel = els[i];
                        break;
                    }
                }

                for (var j = 0; j < lels.length; j++) {
                    if (isSameGroup(lels[j].id, groupNodeId)) {
                        lgel = lels[j];
                        break;
                    }
                }
            }

            return [gel , lgel];
        },

        /**
         * Toggles the specified group if no value is passed, otherwise sets the expanded state of the group to the value passed.
         * @param {String} groupId The groupId assigned to the group (see getGroupId)
         * @param {Boolean} expanded (optional)
         */
        toggleGroup: function (group, expanded) {
            var grNodes = this.findGroupNodes(group.id),
                gel = grNodes[0],
                lgel = grNodes[1];

            if ((!gel) || (!lgel)) {
                return;
            }

            expanded = Ext.isDefined(expanded) ? expanded : group.className.indexOf('x-grid-group-collapsed') > -1;

            if (this.state[group.id] !== expanded) {
                if (this.cancelEditOnToggle !== false) {
                    this.grid.stopEditing(true);
                }
                this.state[group.id] = expanded;
                if (expanded) {
                    var idx = gel.className.indexOf('x-grid-group-collapsed');
                    if (idx > -1) {
                        gel.className = gel.className.replace('x-grid-group-collapsed', '');
                    }
                    var lidx = lgel.className.indexOf('x-grid-group-collapsed');
                    if (lidx > -1) {
                        lgel.className = lgel.className.replace('x-grid-group-collapsed', '');
                    }
                } else {
                    var idx = gel.className.indexOf('x-grid-group-collapsed');
                    if (idx < 0) {
                        gel.className = gel.className.concat(' x-grid-group-collapsed');
                    }
                    var lidx = lgel.className.indexOf('x-grid-group-collapsed');
                    if (lidx < 0) {
                        lgel.className = lgel.className.concat(' x-grid-group-collapsed');
                    }
                }
            }
        },

        /**
         * Toggles all groups if no value is passed, otherwise sets the expanded state of all groups to the value passed.
         * @param {Boolean} expanded (optional)
         */
        toggleAllGroups: function (expanded) {
            var groups = this.getGroups();
            for (var i = 0, len = groups.length; i < len; i++) {
                this.toggleGroup(groups[i], expanded);
            }
        },

        /**
         * Expands all grouped rows.
         */
        expandAllGroups: function () {
            this.toggleAllGroups(true);
        },

        /**
         * Collapses all grouped rows.
         */
        collapseAllGroups: function () {
            this.toggleAllGroups(false);
        },

        getGroup: function (v, r, groupRenderer, rowIndex, colIndex, ds) {
            var column = this.cm.config[colIndex],
                g = groupRenderer ? groupRenderer.call(column.scope, v, {}, r, rowIndex, colIndex, ds) : String(v);
            if (g === '' || g === '&#160;') {
                g = column.emptyGroupText || this.emptyGroupText;
            }
            return g;
        },

        getGroupField: function () {
            return this.grid.store.getGroupState();
        },

        renderRows: function () {
            var groupField = this.getGroupField();
            var eg = !!groupField;
            // if they turned off grouping and the last grouped field is hidden
            if (this.hideGroupedColumn) {
                var colIndex = this.cm.findColumnIndex(groupField),
                    hasLastGroupField = Ext.isDefined(this.lastGroupField);
                if (!eg && hasLastGroupField) {
                    this.mainBody.update('');
                    this.lockedBody.update('');
                    this.cm.setHidden(this.cm.findColumnIndex(this.lastGroupField), false);
                    delete this.lastGroupField;
                } else if (eg && !hasLastGroupField) {
                    this.lastGroupField = groupField;
                    this.cm.setHidden(colIndex, true);
                } else if (eg && hasLastGroupField && groupField !== this.lastGroupField) {
                    this.mainBody.update('');
                    this.lockedBody.update('');
                    var oldIndex = this.cm.findColumnIndex(this.lastGroupField);
                    this.cm.setHidden(oldIndex, false);
                    this.lastGroupField = groupField;
                    this.cm.setHidden(colIndex, true);
                }
            }
            return Ext.grid.GridView.prototype.renderRows.apply(
                this, arguments);
        },

        /**
         * Dynamically tries to determine the groupId of a specific value
         * @param {String} value
         * @return {String} The group id
         */
        getGroupId: function (value) {
            var field = this.getGroupField();
            return this.constructId(value, field, this.cm.findColumnIndex(field));
        },

        constructId: function (value, field, idx) {
            var cfg = this.cm.config[idx],
                groupRenderer = cfg.groupRenderer || cfg.renderer,
                val = (this.groupMode == 'value') ? value : this.getGroup(value, {data: {}}, groupRenderer, 0, idx, this.ds);

            return this.getPrefix(field) + Ext.util.Format.htmlEncode(val);
        },

        canGroup: function () {
            return this.enableGrouping && !!this.getGroupField();
        },

        getPrefix: function (field) {
            return this.grid.getGridEl().id + '-gp-' + field + '-';
        },

        doGroupStart: function (buf, g, cs, ds, colCount, locked) {
            if (locked) {
                buf[buf.length] = this.templates.startGroup.apply(g);
            } else {
                buf[buf.length] = this.templates.startLockedGroup.apply(g);
            }
        },

        doGroupEnd: function (buf, g, cs, ds, colCount, lockedArea) {
            var data = this.calculate(g.rs, cs);
            buf.push('</div>', this.renderSummary({data: data}, cs, lockedArea), '</div>');
        },

        getRows: function () {
            if (!this.canGroup()) {
                return Ext.grid.GridView.prototype.getRows.call(this);
            }
            var r = [],
                gs = this.getGroups(),
                g,
                i = 0,
                len = gs.length,
                j,
                jlen;
            for (; i < len; ++i) {
                g = gs[i].childNodes[1];
                if (g) {
                    g = g.childNodes;
                    for (j = 0, jlen = g.length; j < jlen; ++j) {
                        r[r.length] = g[j];
                    }
                }
            }
            return r;
        },

        updateGroupWidths: function () {
            if (!this.canGroup() || !this.hasRows()) {
                return;
            }
            var tw = this.getTotalWidth(),
                ltw = this.getLockedWidth(),
                gs = this.getGroups(false),
                lgs = this.getGroups(true),
                lcount = this.cm.getLockedCount();

            for (var i = 0, len = gs.length; i < len; i++) {
                gs[i].firstChild.style.width = tw;

                var s = gs[i].childNodes[2];

                if (s) {
                    s.style.width = tw;
                    s.firstChild.style.width = tw;

                    var cells = s.firstChild.rows[0].childNodes;
                    for (var j = 0; j < cells.length; j++) {
                        cells[j].style.width = this.getColumnWidth(j + lcount);
                        cells[j].style.display = this.cm.isHidden(j + lcount) ? 'none' : '';
                    }
                }
            }

            for (var k = 0, len = lgs.length; k < len; k++) {
                lgs[k].firstChild.style.width = ltw;

                var s = lgs[k].childNodes[2];

                if (s) {
                    s.style.width = ltw;
                    s.firstChild.style.width = ltw;

                    var cells = s.firstChild.rows[0].childNodes;
                    for (var j = 0; j < cells.length; j++) {
                        cells[j].style.width = this.getColumnWidth(j);
                        cells[j].style.display = this.cm.isHidden(j) ? 'none' : '';
                    }
                }
            }

            this.syncGroupHeaderHeights();
        },

        onLayout: function () {
            this.updateGroupWidths();
        },

        onBeforeRowSelect: function (sm, rowIndex) {
            this.toggleRowIndex(rowIndex, true);
        },

        //GroupSummary methods

        calculate: function (rs, cs) {
            var data = {}, r, c, cfg = this.cm.config, cf;
            for (var j = 0, jlen = rs.length; j < jlen; j++) {
                r = rs[j];
                for (var i = 0, len = cs.length; i < len; i++) {
                    c = cs[i];
                    cf = cfg[i];
                    if (cf.summaryType) {
                        data[c.name] = Ext.ux.grid.GroupSummary.Calculations[cf.summaryType](data[c.name] || 0, r, c.name, data);
                    }
                }
            }
            return data;
        },

        renderSummary: function (o, cs, lockedArea) {
            cs = cs || this.getColumnData();
            var cfg = this.cm.config,
                buf = [],
                first = lockedArea ? 0 : this.cm.getLockedCount(),
                last = lockedArea ? this.cm.getLockedCount() - 1 : cs.length - 1;

            for (var i = first; i <= last; i++) {
                var c = cs[i],
                cf = cfg[i],
                p = {};

                p.id = c.id;
                p.style = c.style;
                p.css = i == 0 ? 'x-grid3-cell-first ' : (i == cs.length - 1 ? 'x-grid3-cell-last ' : '');

                /*
                *  не применяем рендерер столбца
                *
                if (cf.summaryType || cf.summaryRenderer) {
                    p.value = (cf.summaryRenderer || c.renderer)(o.data[c.name], p, o, undefined, i, this.ds);
                }     */

                if (cf.summaryRenderer) {
                    p.value = cf.summaryRenderer(o.data[c.name], p, o, undefined, i, this.ds);
                } else {
                    p.value = o.data[c.name];
                }

                if (p.value == undefined || p.value === "") p.value = "&#160;";
                buf[buf.length] = this.templates.cell.apply(p);
            }

            return this.templates.summaryRow.apply({
                tstyle: 'width:' + (lockedArea ? this.getLockedWidth() : this.getTotalWidth()) + ';',
                cells: buf.join('')
            });
        },

        refreshSummaryById: function (gid) {
            var groupNodes = this.findGroupNodes(gid),
                lockedGrNode = groupNodes[1],
                unlockedGrNode = groupNodes[0],
                rs = [];

            if ((!lockedGrNode) || (!unlockedGrNode)) {
                return false;
            }

            this.grid.getStore().each(function (r) {
                if (r._groupId == gid) {
                    rs[rs.length] = r;
                }
            });

            var cs = this.getColumnData(),
                data = this.calculate(rs, cs),
                markup = this.renderSummary({data: data}, cs, false),
                lmarkup = this.renderSummary({data: data}, cs, true),
                existing = unlockedGrNode.childNodes[2],
                lexisting = lockedGrNode.childNodes[2];

            if (existing) {
                unlockedGrNode.removeChild(existing);
            }
            Ext.DomHelper.append(unlockedGrNode, markup);

            if (lexisting) {
                lockedGrNode.removeChild(lexisting);
            }
            Ext.DomHelper.append(lockedGrNode, lmarkup);

            return true;
        },

        onUpdate: function (ds, record) {
            Ext.grid.GridView.prototype.onUpdate.apply(this, arguments);
            this.refreshSummaryById(record._groupId);
            this.updateTotalSummary();
        }
    },

    splitZoneConfig: {
        allowHeaderDrag: function (e) {
            return !e.getTarget(null, null, true).hasClass('ux-grid-hd-group-cell');
        }
    },

    columnDropConfig: {
        getTargetFromEvent: function (e) {
            var t = Ext.lib.Event.getTarget(e);
            return this.view.findHeaderCell(t);
        },

        positionIndicator: function (h, n, e) {
            var data = Ext.ux.grid.LockingGridColumnWithHeaderGroup.prototype.getDragDropData.call(this, h, n, e);
            if (data === false) {
                return false;
            }
            var px = data.px + this.proxyOffsets[0];
            this.proxyTop.setLeftTop(px, data.r.top + this.proxyOffsets[1]);
            this.proxyTop.show();
            this.proxyBottom.setLeftTop(px, data.r.bottom);
            this.proxyBottom.show();
            return data.pt;
        },

        onNodeDrop: function (n, dd, e, data) {
            var h = data.header;
            if (h != n) {
                var d = Ext.ux.grid.LockingGridColumnWithHeaderGroup.prototype.getDragDropData.call(this, h, n, e);
                if (d === false) {
                    return false;
                }
                var cm = this.grid.colModel, right = d.oldIndex < d.newIndex, rows = cm.rows;
                for (var row = d.row, rlen = rows.length; row < rlen; row++) {
                    var r = rows[row], len = r.length, fromIx = 0, span = 1, toIx = len;
                    for (var i = 0, gcol = 0; i < len; i++) {
                        var group = r[i];
                        if (d.oldIndex >= gcol && d.oldIndex < gcol + group.colspan) {
                            fromIx = i;
                        }
                        if (d.oldIndex + d.colspan - 1 >= gcol && d.oldIndex + d.colspan - 1 < gcol + group.colspan) {
                            span = i - fromIx + 1;
                        }
                        if (d.newIndex >= gcol && d.newIndex < gcol + group.colspan) {
                            toIx = i;
                        }
                        gcol += group.colspan;
                    }
                    var groups = r.splice(fromIx, span);
                    rows[row] = r.splice(0, toIx - (right ? span : 0)).concat(groups).concat(r);
                }
                for (var c = 0; c < d.colspan; c++) {
                    var oldIx = d.oldIndex + (right ? 0 : c), newIx = d.newIndex + (right ? -1 : c);
                    cm.moveColumn(oldIx, newIx);
                    this.grid.fireEvent("columnmove", oldIx, newIx);
                }
                return true;
            }
            return false;
        }
    },

    getGroupRowIndex: function (el) {
        if (el) {
            var m = el.className.match(this.hrowRe);
            if (m && m[1]) {
                return parseInt(m[1], 10);
            }
        }
        return this.cm.rows.length;
    },

    getGroupSpan: function (row, col) {
        if (row < 0) {
            return {
                col: 0,
                colspan: this.cm.getColumnCount()
            };
        }
        var r = this.cm.rows[row];
        if (r) {
            for (var i = 0, gcol = 0, len = r.length; i < len; i++) {
                var group = r[i];
                if (col >= gcol && col < gcol + group.colspan) {
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

    getDragDropData: function (h, n, e) {
        if (h.parentNode != n.parentNode) {
            return false;
        }
        var cm = this.grid.colModel, x = Ext.lib.Event.getPageX(e), r = Ext.lib.Dom.getRegion(n.firstChild), px, pt;
        if ((r.right - x) <= (r.right - r.left) / 2) {
            px = r.right + this.view.borderWidth;
            pt = "after";
        } else {
            px = r.left;
            pt = "before";
        }
        var oldIndex = this.view.getCellIndex(h), newIndex = this.view.getCellIndex(n);
        if (cm.isFixed(newIndex)) {
            return false;
        }
        var row = Ext.ux.grid.LockingGridColumnWithHeaderGroup.prototype.getGroupRowIndex.call(this.view, h),
            oldGroup = Ext.ux.grid.LockingGridColumnWithHeaderGroup.prototype.getGroupSpan.call(this.view, row, oldIndex),
            newGroup = Ext.ux.grid.LockingGridColumnWithHeaderGroup.prototype.getGroupSpan.call(this.view, row, newIndex),
            oldIndex = oldGroup.col;
        newIndex = newGroup.col + (pt == "after" ? newGroup.colspan : 0);
        if (newIndex >= oldGroup.col && newIndex <= oldGroup.col + oldGroup.colspan) {
            return false;
        }
        var parentGroup = Ext.ux.grid.ColumnHeaderGroup.prototype.getGroupSpan.call(this.view, row - 1, oldIndex);
        if (newIndex < parentGroup.col || newIndex > parentGroup.col + parentGroup.colspan) {
            return false;
        }
        return {
            r: r,
            px: px,
            pt: pt,
            row: row,
            oldIndex: oldIndex,
            newIndex: newIndex,
            colspan: oldGroup.colspan
        };
    }
});
