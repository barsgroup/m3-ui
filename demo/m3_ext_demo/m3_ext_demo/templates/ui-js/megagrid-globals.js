/*
 * Здесь должна быть ваша реклама :)
 */
var TaskNameFormatter = function(row, cell, value, columnDef, dataContext) {
			//console.log(grid, row, cell, value, columnDef, dataContext);
		    var spacer = "<span style='display:inline-block;height:1px;width:" + (15 * dataContext["indent"]) + "px'></span>";
		    var nextRow = grid.grid.getDataItem(dataContext.id+1);
		    if (nextRow && nextRow.indent > dataContext.indent) {
		    	//console.log(dataContext._collapsed);
				if (dataContext._collapsed)
					return spacer + " <span class='toggle expand'></span>&nbsp;" + value;
				else
					return spacer + " <span class='toggle collapse'></span>&nbsp;" + value;
			}
			else
				return spacer + " <span class='toggle'></span>&nbsp;" + value;
		};

var columns = [
           			{id:"id", name:"id", field:"id", formatter:TaskNameFormatter, width:200},
           			{id:"index", name:"index", field:"index"},
           			{id:"fname", name:"fname", field:"fname"}
           			
           		];
var data = [];
var grid = new Ext.ux.SlickGridPanel({columns: columns, data: data, url: '/ui/mega-grid-data'});
win.items.add(grid);
