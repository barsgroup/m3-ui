/**
 * GroupingJson на базе JsonReader'a, который принимает параметры Stor'a
 */

Ext.define('Ext.m3.GroupingJsonStore', {
    extend: 'Ext.data.GroupingStore',
    xtype: 'm3-grouping-json-store',

    constructor: function (config) {
        Ext.m3.GroupingJsonStore.superclass.constructor.call(this, Ext.apply(config, {
            reader: new Ext.data.JsonReader(config)
        }));
    }
});