{
	id: '{{ component.client_id }}'
	{%if component.width%} ,width: {{component.width}} {%endif%}
	
	{%if component.header %} ,header: '{{ component.header }}' {%endif%}
	,sortable: {{ component.sortable|lower }}
	{%if component.data_index %} ,dataIndex: '{{ component.data_index }}' {%endif%}
	{%if component.align %} ,align: '{{ component.align }}' {%endif%}
	{%if component.editor %} ,editor: {{ component.render_editor|safe }} {%endif%}
	{%if component.hidden %} ,hidden: true {%endif%}
	{%if component.column_renderer %} ,renderer: {{ component.column_renderer|safe }}{%endif%}
	{%if component.tooltip %} ,tooltip: '{{ component.tooltip|safe}}'{%endif%}
	,fixed: {{ component.fixed|lower }}
	{%if component.extra %} ,{{component.t_render_extra|safe}} {%endif%}
	{%if component.colspan %} ,colspan: {{ component.colspan }} {%endif%}
}