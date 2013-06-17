new Ext.form.Checkbox({
	{% include 'base-ext-ui.js'%}
	{% include 'base-ext-field-ui.js'%}
	{% if component.checked %} ,checked: true {% endif %}
	{% if component.box_label %} ,boxLabel: '{{ component.box_label }}' {% endif %}
	
	{% if component.t_render_listeners %}
		{# Прописываются имеющиеся обработчики #}
		,listeners:{
			{% for k, v in component.t_render_listeners.items %}
				'{{k}}': {{v|safe}}
				{% if not forloop.last %},{% endif %}
			{% endfor%}
		}
	{% endif %}
	
})