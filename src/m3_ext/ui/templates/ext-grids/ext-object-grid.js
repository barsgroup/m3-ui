(function(){
	var baseConf = { {{ component.t_render_base_config|safe }} };
	var params = { {{ component.t_render_params|safe }} };
	
	var objGrid = createObjectGrid(baseConf, params);

	function contextMenuNew(){ objGrid.onNewRecord(); }
	function contextMenuEdit(){ objGrid.onEditRecord(); }
	function contextMenuDelete(){ objGrid.onDeleteRecord(); }
	function contextMenuRefresh(){ objGrid.refreshStore(); }
	function topBarNew(){ objGrid.onNewRecord();}
	function topBarEdit(){ objGrid.onEditRecord();}
	function topBarDelete(){ objGrid.onDeleteRecord();}
	function topBarRefresh(){ objGrid.refreshStore(); }
	function onEditRecord(){ objGrid.onEditRecord(); }
	{{ component.render_globals }}
	return objGrid;
})()
