function(){
	var baseConf = { {{ component.t_render_base_config|safe }} };
	var params = { {{ component.t_render_params|safe }} };
	
	var objTree = createObjectTree(baseConf, params);

	function contextMenuNewRoot(){ objTree.onNewRecord(); }
	function contextMenuNewChild(){ objTree.onNewRecordChild(); }
	function contextMenuEdit(){ objTree.onEditRecord(); }
	function contextMenuDelete(){ objTree.onDeleteRecord(); }
	function contextMenuRefresh(){ objTree.refreshStore(); }
	
	function topBarNewRoot(){ objTree.onNewRecord();}
	function topBarNewChild(){ objTree.onNewRecordChild();}
	function topBarEdit(){ objTree.onEditRecord();}
	function topBarDelete(){ objTree.onDeleteRecord();}
	function topBarRefresh(){ objTree.refreshStore(); }
	function onEditRecord(){ objTree.onEditRecord(); }
	
	return objTree;
}()
