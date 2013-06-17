new Ext.PagingToolbar({
    {% include 'base-ext-ui.js'%}
    
    {% if component.page_size %} ,pageSize: {{ component.page_size }} {%endif%}
    ,displayInfo: true
    ,displayMsg: 'Показано записей {0} - {1} из {2}'
    ,emptyMsg: "Нет записей"
})