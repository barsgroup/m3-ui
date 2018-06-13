(function(){
    var observable = new Ext.util.Observable();
    observable.addEvents(
        /**
         * @event beforerequest
         * Перед отправкой запроса по нажатию кнопки YES
         * @param {options} Ext.Ajax.request options
         */
        'beforerequest',
        /**
         * @event afterrequest
         * Сразу после того как пришел ответ на Ajax запрос
         * @param {res} responce
         * @param {opt} options
         */
        'afterrequest'
    );

    var mask = new Ext.LoadMask(
        Ext.getBody(), {msg: "Подождите...", removeMask: true});
    Ext.Msg.confirm(
        'Внимание!',
        {% if prevent_escape %} '{{ text|safe }}'  {% else %} '{{ text }}'{% endif %}
        ,
        function (btn){
            if (btn === 'yes'){
                mask.show();
                var options = {
                    url: '{{ url }}',
                    method: 'POST',
                    params: Ext.apply(Ext.decode('{{ params|safe|addslashes }}'), {confirm: true}),
                    success: function(res, opt) {
                        if (observable.fireEvent('afterrequest', res, opt)) {
                            mask.hide();
                            var result = Ext.util.JSON.decode(res.responseText);
                            if (result.success && '{{m3_window_id}}'){
                                var parent_win = Ext.getCmp('{{m3_window_id}}');
                                parent_win.close(true);
                            }
                            smart_eval(res.responseText);
                        }
                    },
                    failure: function(res, opt) {
                        if (observable.fireEvent('afterrequest', res, opt)){
                            mask.hide();
                            uiAjaxFailMessage(res, opt);
                        }
                    }
                };
                if(observable.fireEvent('beforerequest', options)){
                    Ext.Ajax.request(options);
                }
            }
        }
    );
    observable.win_mask = mask;
    return observable;
})()