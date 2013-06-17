(function(){
	var baseConf = { {{ component.render_base_config|safe }} };
	var params = { {{ component.render_params|safe }} };
	
	baseConf = Ext.applyIf({
		store: {{ component.t_render_store|safe }}
	},baseConf);
	
	var grid = createGridPanel(baseConf, params);
	return grid;
})()