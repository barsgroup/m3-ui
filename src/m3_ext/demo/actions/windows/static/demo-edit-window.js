Ext.ns('Ext.demo');

Ext.demo.EditWindow = Ext.extend(Ext.m3.EditWindow, {
    initComponent: function () {
        Ext.demo.EditWindow.superclass.initComponent.call(this);

        var form = this.find('itemId', 'form')[0],
            field = this.find('itemId', 'edit-field-id')[0];
        this.form = form;

        this.buttons[0].on('click', function (b, e) {
            Ext.Msg.alert("", field.getValue());
        }, this);

        this.buttons[1].on('click', function (b, e) {
            this.close();
        }, this);
    },
    bind: function(data) {
        this.form.getForm().loadRecord({data: data.model});
    },
});

Ext.reg('demo-edit-window', Ext.demo.EditWindow);
