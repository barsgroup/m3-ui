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
