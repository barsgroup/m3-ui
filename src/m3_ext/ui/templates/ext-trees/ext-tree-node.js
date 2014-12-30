{# new Ext.tree.AsyncTreeNode -- нельзя использовать, так как работает некорректно с вложеной иерархией #}
{
	expanded: {{ component.expanded|lower }}
	,id: '{{ component.client_id }}'
	{% if component.can_check %}
		,checked: {{ component.checked|lower }}
	{% endif %}
	{% for k, v in component.items.items %}
		,{{ k }}:'{{ v }}'
	{%endfor%}

	{% if component.has_children %}
	,'leaf': false
	{% else %}
	,'leaf': true
	{% endif %}

	{% if component.has_children %}
	,'children': {{ component.t_render_children|safe }}
	{% endif %}

    {% if component.icon_cls %}
	,'iconCls': '{{ component.icon_cls|safe }}'
	{% endif %}
}
