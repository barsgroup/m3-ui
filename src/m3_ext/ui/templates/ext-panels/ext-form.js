
(function(){
    var form_panel = new Ext.FormPanel({
    	{% include 'base-ext-ui.js'%}
		{% if component.label_width  %} ,labelWidth: {{ component.label_width }} {% endif %}
		{% if component.label_align  %} ,labelAlign: '{{ component.label_align }}' {% endif %}
		{% if component.label_pad  %} ,labelPad: {{ component.label_pad }} {% endif %}
		{% if component.padding  %} ,padding: '{{ component.padding|safe }}' {% endif %}
    	{% if component.url %} ,url: '{{ component.url }}' {% endif %}
    	{% if component.auto_scroll %} ,autoScroll: true {% endif %}
    	{% if component.layout %} ,layout: '{{ component.layout }}' {% endif %}
    	{% if component.layout_config %} ,layoutConfig: {{ component.t_render_layout_config|safe }} {% endif %}
    	{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
    	{% if component.title %} 
    		,title: '{{ component.title }}' 
    		,header: true
    	{% else %}
    		,header: false
    	{% endif %}
		, fileUpload: {% if component.file_upload %} true {% else %} false {% endif %}
    	{% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
        
        {% if component.collapsible %} ,collapsible: true {% endif %}
        {% if component.collapsed %} ,collapsed: true {% endif %}
        {% if component.collapse_mode %} ,collapseMode: '{{ component.collapse_mode }}' {% endif %}
        
        {% if component.split %} ,split: true {% endif %}
        
    	{% if component.buttom_bar %} ,bbar: {{ component.t_render_buttom_bar|safe }} {% endif %}
    	{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
     	{% if component.base_cls %} ,baseCls: '{{ component.base_cls }}' {% else %} ,baseCls:'x-plain' {% endif %}
        
        ,items: {{ component.t_render_items|safe }}
    });
    {% if component.focused_field %}
	  form_panel.on('afterrender', function(){
		    Ext.getCmp('{{ component.focused_field.client_id}}').focus(false, 100);
	  });
	  {% endif %}
    return form_panel;
})()