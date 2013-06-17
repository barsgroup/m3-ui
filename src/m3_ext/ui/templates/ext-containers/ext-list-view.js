new Ext.list.ListView({
	{% include 'base-ext-ui.js'%}
	
	{%if component.multi_select %} ,multiSelect: true {%endif%}
	{%if component.empty_text %} ,emptyText:'{{component.empty_text}}' {%endif%}
	,columns: {{ component.t_render_columns|safe }}
	,store: {{ component.t_render_store|safe }}
	//,reserveScrollOffset: true
	
})