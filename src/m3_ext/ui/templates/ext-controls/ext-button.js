{%if component.menu and component.handler %}
new Ext.SplitButton({
{%else%}
new Ext.Button({
{%endif%}
	{% include 'base-ext-ui.js'%}
	{% if component.text %} ,text: '{{ component.text }}' {% endif %}
	{% if component.icon %} ,icon: '{{ component.icon }}' {% endif %}
	{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	{% if component.region %} ,region: '{{ component.region }}' {% endif %}
	{% if component.flex %} ,flex: {{ component.flex }} {% endif %}
	{% if component.tooltip_text %} ,tooltip: {{ component.t_render_tooltip|safe }} {% endif %}
	{% if component.tab_index %} ,tabIndex: {{ component.tab_index }} {% endif %}
	
	{% if component.handler %} ,handler: {{ component.t_render_handler|safe}}{% endif%}
	{% if component.menu %} ,menu: {{ component.menu.render|safe}} {% endif%}
	,enableToggle: {{ component.enable_toggle|lower }}
    ,allowDepress: {{ component.allow_depress|lower }}
	{% if component.toggle_group %}, toggleGroup: '{{ component.toggle_group }}'{% endif %}
	, pressed: {{ component.pressed|lower }}
    {% if component.margins %} ,margins: '{{ component.margins }}' {% endif %}
})


