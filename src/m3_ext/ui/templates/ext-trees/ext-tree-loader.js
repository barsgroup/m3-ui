new Ext.tree.TreeLoader({
	'id': '{{ component.client_id }}'
	,xtype:'treeloader'
	,baseParams: Ext.applyIf({
		{% for key,value in component.base_params.items %}
    			'{{ key }}': '{{ value}}'{% if not forloop.last %},{% endif %}
    		{% endfor %}
	},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
	{% if component.url %},dataUrl: '{{ component.url|safe }}'{% endif %}
	{% if component.t_render_listeners %}
    {# Прописываются имеющиеся обработчики #}
    ,listeners:{
        {% for k, v in component.t_render_listeners.items %}
            '{{k}}': {{v|safe}}
            {% if not forloop.last %},{% endif %}
        {% endfor%}
    }
    {% endif %}
    {% if component.ui_providers %}
    ,uiProviders:{
        {% for k, v in component.ui_providers.items %}
            {{k}}:{{v|safe}}
            {% if not forloop.last %},{% endif %}
        {% endfor %}
    }
    {% endif %}
})
