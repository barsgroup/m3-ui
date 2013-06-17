new Ext.ButtonGroup({
	id: '{{ component.client_id }}'
	{% if component.columns_number %} ,columns: {{ component.columns_number }} {% endif %}
	,items: {{ component.t_render_buttons|safe }}
})