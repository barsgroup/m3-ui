new Ext.data.JsonStore({
	url: '{{ component.url }}'
	,storeId: '{{ component.client_id }}'
	,baseParams: Ext.applyIf({
		{% for key,value in component.base_params.items %}
			'{{ key }}': '{{ value}}'{% if not forloop.last %},{% endif %}			
		{% endfor %} 		
	},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
	,idProperty: '{{ component.id_property }}'
	{% if component.root %} ,root: '{{ component.root }}' {% endif %}
	{% if component.total_property %} ,totalProperty: '{{ component.total_property }}' {% endif %}
	{% if component.auto_load %} ,autoLoad: true {% endif %}
	,fields: [{{ component.t_render_fields|safe }}]
	{% if component.writer %} ,writer: {{ component.writer.render }} {% endif %}
	{% if component.remote_sort %} ,remoteSort: true {% endif %}
	{% if not component.auto_save %} ,autoSave: false {% endif %}
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