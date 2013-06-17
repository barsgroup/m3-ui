new Ext.Container({
	{% include 'base-ext-ui.js'%}
	
	{% if component.layout %} ,layout: '{{ component.layout }}' {% endif %}
	{% if component.layout_config %} ,layoutConfig: {{ component.t_render_layout_config|safe }} {% endif %}
	,items: {{ component.t_render_items|safe }}
})