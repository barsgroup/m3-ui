var baseTree = {
	configureTree: function() {
		var params = this.params || {};
		this.useArrows = true;
		this.autoScroll = false;
		this.animate = true;
		this.containerScroll = true;
		this.border = false;
		this.split = true;

		// если выставлен флаг read_only, выключаем drag&drop
		if (params.readOnly) {
			this.enableDD = false;
			this.enableDrag = false;
			this.enableDrop = false;
		};

		// если не указан корневой элемент, содаем тут
		if (!this.root) {
			var cfg = {
				id: '-1'
				,expanded: true
				,allowDrag: false
			};
			if (params.rootText) {
				cfg.text = params.rootText;
			};
			if (params.Nodes) {
				cfg.children = params.Nodes;
			}
			this.root = new Ext.tree.AsyncTreeNode(cfg);
        };
        // контекстные меню
        if (params.contextMenu) {
        	var menu = Ext.create(params.contextMenu);
        	this.listeners = this.listeners || {};
        	this.listeners.contextmenu = function(node, e) {
        		node.select();
        		menu.contextNode = node;
        		menu.showAt(e.getXY());
        	};
        };
        if (params.containerContextMenu) {
        	var menu = Ext.create(params.containerContextMenu);
        	this.listeners = this.listeners || {};
        	this.listeners.containercontextmenu = function(node, e) {
        		e.stopEvent();
        		menu.showAt(e.getXY());
        	};
        };
	},

	initTree: function() {
		var params = this.params || {};

		// // url для загрузки данных
		// if (params.url && this.loader != undefined && !this.loader.url) {
		// 	this.loader.url = params.url;
		// };

		// загрузка единым запросом
		if (params.customLoad) {
			assert(params.url !== undefined, "Url must be specified!")
			var ajax = Ext.Ajax;
			this.on('expandnode', function (node){
				var nodeList = new Array();
				if (node.hasChildNodes()){
					for (var i=0; i < node.childNodes.length; i++){
						if (!node.childNodes[i].isLoaded()) {
							nodeList.push(node.childNodes[i].id);
						}
					}
				}
				if (nodeList.length > 0)
					ajax.request({
						url: params.url
						, params: {
							'list_nodes': nodeList.join(',')
						}
						, success: function(response, opts){
							var res = Ext.util.JSON.decode(response.responseText);

							if (res) {
								for (var i=0; i < res.length; i++){
									var curr_node = node.childNodes[i];
									for (var j=0; j < res[i].children.length; j++){
										var newNode = new Ext.tree.AsyncTreeNode(res[i].children[j]);
										curr_node.appendChild(newNode);
										curr_node.loaded = true;
									}
								}
							}
						}
						,failure: function(response, opts){
						   Ext.Msg.alert('','failed');
						}
					});
			});
		};
	}
};

Ext.m3.Tree = Ext.extend(Ext.ux.tree.TreeGrid,
    Ext.applyIf(baseTree, {
        initComponent: function(){
            this.configureTree();
            Ext.m3.Tree.superclass.initComponent.call(this);
            this.initTree();
        }
    })
);

Ext.reg('m3-tree', Ext.m3.Tree);
// hack, позволяющий в TreeGrid использовать колонки с родным xtype=gridcolumn
Ext.reg('tggridcolumn', Ext.tree.Column);
