function button_pressed_handler(menu){
	Ext.Msg.alert('','Хелоу ворд!')
}

function get_name(grid){ 
	Ext.Msg.alert("Проверка",grid.getSelectionModel().getSelected().get("fname")); 
}

function get_node_name(tree){
	Ext.Msg.alert("", tree.selModel.getSelectedNode().attributes.fname);
}

function activate_window(win){
	Ext.History.add(win.id);
}