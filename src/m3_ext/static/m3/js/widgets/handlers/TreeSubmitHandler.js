
Ext.m3.TreeSubmitHandler = Ext.extend(Ext.m3.BaseSubmitHandler, {
    handlerAlias: 'tree_submit',
    onSubmit: function(submit_params) {
        console.log('submit tree');
    }
});

Ext.m3.actionManager.registerType('tree_submit', Ext.m3.TreeSubmitHandler);
Ext.m3.actionManager.register([Ext.m3.ObjectTree, "submit", "tree_submit"]);
