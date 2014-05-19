Ext.define('Ext.m3.Button', {
    extend: 'Ext.Button',
    xtype: 'm3-button',

    /*
     *
     */
    getParentHandler: function(parent, name){

        if (parent.ownerCt){
            return this.getParentHandler(parent.ownerCt, name);
        }if (parent[name]){
            return parent[name].createDelegate(parent);
        } else {
            return Ext.emptyFn;
        }
    },

    initComponent: function(){
        this.callParent();

        if (typeof this.handler === 'string'){
            // Поиск хендлера во вложенных родительских контейнерах
            this.handler = this.getParentHandler(this.ownerCt, this.handler);
        }
    }
});
