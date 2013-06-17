(function(){
	var baseConf = { {{ component.render_base_config|safe }} };
	var params = { {{ component.render_params|safe }} };	
	var addrField = new Ext.m3.AddrField(baseConf, params);
	return addrField;
})()
