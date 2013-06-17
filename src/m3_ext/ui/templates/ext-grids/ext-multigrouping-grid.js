(function(){
	var baseConf = { {{ component.t_render_base_config|safe }} };
	var params = { {{ component.t_render_params|safe }} };
	var multiGroupingGrid = new Ext.m3.MultiGroupingGridPanel(baseConf, params);
	function topBarNew(){ multiGroupingGrid.onNewRecord();}
	function topBarEdit(){ multiGroupingGrid.onEditRecord();}
	function topBarDelete(){ multiGroupingGrid.onDeleteRecord();}
	function onEditRecord(){ multiGroupingGrid.onEditRecord(); }
	function exportData(exportType){ multiGroupingGrid.exportData(exportType);}
	return multiGroupingGrid;
})()
