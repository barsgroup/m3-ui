(function(){
	var dataRecord = Ext.data.Record.create([
		{{ component.t_render_fields|safe }}
	]);
	
	var dataReader = new Ext.data.ArrayReader({
	    idIndex: 0
	}, dataRecord);
	
	var data_store = new Ext.data.Store({
		reader: dataReader
		,data: [{{ component.t_render_data|safe }}]
	});
	
	return data_store;
})()