new Ext.form.Label({
	{% include 'base-ext-ui.js'%}
	
	{% if component.text %},text:'{{ component.text}}'  {% endif %}   
})