new Ext.Toolbar({
	{% include 'base-ext-ui.js'%}
	
    ,items:  {{ component.t_render_items|safe }} 
})