function cellDblclick(grid, rowIndex, columnIndex, e){
	var column = grid.getColumnModel().getDataIndex(columnIndex);
	if (column == 'click_me') {
		grid.plugins[2].tip.show();
	}
}

(function (){
	var grid = Ext.getCmp('{{window.form.client_id}}');
	grid.on('celldblclick', cellDblclick);
})();