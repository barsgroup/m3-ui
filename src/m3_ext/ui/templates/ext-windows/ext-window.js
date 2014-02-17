(function(){
    var win = new Ext.Window({
        {% include 'base-ext-ui.js'%}
	    
	    {% if component.title %} ,title: '{{ component.title }}' {% endif %}
		{% if component.modal %}, modal: true {% endif %}
		{% if component.maximized %}, maximized: true {% endif %}
		{% if component.minimized %}, minimized: true {% endif %}
		
		{% ifnotequal component.t_get_minimizable "None" %}
		,minimizable: {{component.t_get_minimizable|lower }}
		{% endifnotequal %}
		{% ifnotequal component.t_get_maximizable "None" %}
		,maximizable: {{component.t_get_maximizable|lower }}
		{% endifnotequal %}
		{% ifnotequal component.t_get_closable "None" %}
		,closable: {{component.t_get_closable|lower }}
		{% endifnotequal %}	
	
    ,draggable: {{component.draggable|lower }}
    ,resizable: {{component.resizable|lower }}
    ,border: {{component.border|lower }}
  
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
		{% if component.body_style %}, bodyStyle : '{{ component.body_style }}' {% endif %}
		{% if component.layout %} ,layout: '{{ component.layout}}' {% endif %}
		{% if component.layout_config %} ,layoutConfig: {{ component.t_render_layout_config|safe }} {% endif %}
		
		{% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
		{% if component.buttom_bar %} ,bbar: {{ component.t_render_buttom_bar|safe }} {% endif %}
		{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
	    ,items:{{ component.t_render_items|safe }}
	    {% if component.buttons %} ,buttons: {{ component.t_render_buttons|safe }}{% endif %}
		{% if component.parent_window_id %} ,parentWindowID: '{{ component.parent_window_id }}' {% endif %}
		{% if component.keys %} ,keys: [{{ component.t_render_keys|safe }}] {% endif %}
		{% if component.auto_load %} ,autoLoad: {{ component.auto_load|safe}} {% endif %}
	    {% block window_extenders %}{# здесь помещяется код, расширяющий описание экземпляра окна #}{% endblock %}
		
	});
	{% block usercode %}{% endblock %}
	return win;
})()
