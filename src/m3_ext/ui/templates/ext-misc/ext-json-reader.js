new Ext.data.JsonReader({
	idProperty: '{{ component.id_property }}'
	{% if component.root %} ,root: '{{ component.root }}' {% endif %}
	{% if component.total_property %} ,totalProperty: '{{ component.total_property }}' {% endif %}
	,fields: [{{ component.t_render_fields|safe }}]
})

