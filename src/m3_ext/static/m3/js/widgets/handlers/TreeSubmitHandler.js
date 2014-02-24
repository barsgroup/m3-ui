
var tree_submit_handler, tree_class;

if (Ext.m3.ExtJS_version == "3.4") {
    //так как в ExtJS 4 серьезно переписали дерево то код непереносим
    //между 3 и 4 версией
    tree_class = Ext.m3.ObjectTree;
    tree_submit_handler = Ext.m3.TreeSubmitHandler = Ext.extend(Ext.m3.BaseSubmitHandler, {
        handlerAlias: 'tree_submit',
        onSubmit: function(tree, submit_params) {
            var loader = tree.getLoader(),
                root = tree.getRootNode();

            var getNodeParams = function(node, attrib_container) {
                Ext.each(node.childNodes, function(child_node) {
                    var node_params = {
                        node: Ext.apply({}, child_node.attributes),
                        children: []
                    };
                    attrib_container.push(node_params);
                    if (child_node.childNodes.length > 0) {
                        getNodeParams(child_node.childNodes, node_params);
                    }
                });
            };

            var treeParams = {
                node: Ext.apply({}, root.attributes),
                children: []
            };

            getNodeParams(root, treeParams['children']);
            console.log('submit tree');
        }
    });


} else if (Ext.m3.ExtJS_version == "4.2")  {
    //TODO - код хендлера на ExtJS 4
}

Ext.m3.actionManager.registerType('tree_submit', tree_submit_handler);
Ext.m3.actionManager.register([tree_class, "submit", "tree_submit"]);