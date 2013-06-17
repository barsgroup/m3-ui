{
	id: '{{ component.client_id }}'
	,xtype: 'booleancolumn'
	{%if component.width%} ,width: {{component.width}} {%endif%}
	
	{%if component.header %} ,header: '{{ component.header}}' {%endif%}
	,sortable: {{ component.sortable|lower }}
	{%if component.data_index %} ,dataIndex: '{{ component.data_index }}' {%endif%}
	{%if component.align %} ,align: '{{ component.align }}' {%endif%}
	{%if component.editor %} ,editor: {{ component.render_editor }} {%endif%}
	
	{%if component.text_false %} ,falseText: '{{ component.text_false }}' {%endif%}
	{%if component.text_true %} ,trueText: '{{ component.text_true }}' {%endif%}
	{%if component.text_undefined %} ,undefinedText: '{{ component.text_undefined }}' {%endif%}
	,fixed: {{ component.fixed|lower }}
    ,hidden: {{ component.hidden|lower }}
	{%if component.column_renderer %} ,renderer: {{ component.column_renderer }}{%endif%}
}