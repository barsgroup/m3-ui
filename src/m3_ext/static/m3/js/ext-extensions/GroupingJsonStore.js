Ext.ns('Ext.m3');

/**
 * GroupingJson на базе JsonReader'a, который принимает параметры Stor'a
 * @type {*|void}
 */
Ext.m3.GroupingJsonStore = Ext.extend(Ext.data.GroupingStore, {

    constructor: function (config) {
        Ext.m3.GroupingJsonStore.superclass.constructor.call(this, Ext.apply(config, {
            reader: new Ext.data.JsonReader(config)
        }));
    }
});

Ext.reg('m3-grouping-json-store', Ext.m3.GroupingJsonStore);