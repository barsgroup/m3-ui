(function (){
    var win = {{ window.render|safe }};

    function submitForm(btn, e, baseParams) { win.submitForm(btn, e, baseParams); }
    function cancelForm(){ win.close(); }

    {{ window.render_globals }}

    win.show();
    win.on('beforesubmit', function(submit) {
        debugger;
        var items = win.items.items,
            form = win.getForm(),
            fields = form.items.items;
        //вызов метода менеджера событий для обработки сабмита формы
        debugger;
        Ext.m3.actionManager.dispatch('submit', items, submit);
    });
    return win;
})()

