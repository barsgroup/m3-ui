new Ext.TabPanel({
	{% include 'base-ext-ui.js'%}
	
	{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	{% if component.title %} ,title: '{{ component.title }}' {% endif %}
    {% if component.deferred_render != None %},deferredRender: {{ component.deferred_render|lower }} {% endif %}
    {% if component.layout_on_tab_change != None %},layoutOnTabChange: {{ component.layout_on_tab_change|lower }} {% endif %}
    ,activeTab: {% if component.active_tab %}{{ component.active_tab }}{% else %}0{% endif %}
	{% if component.auto_width %} ,autoWidth: true {% endif %}
	,tabPosition: '{{ component.tab_position }}'
    {% if component.enable_tab_scroll %}
    ,enableTabScroll: true
    {% else %}
    ,enableTabScroll: false
    {% endif %}
    , border: {{component.border|lower}}
    {% if component.plain %} ,plain: true {% endif %}
    , bodyBorder: {{component.body_border|lower}}
	,items: [{{ component.t_render_items|safe }}]
})
