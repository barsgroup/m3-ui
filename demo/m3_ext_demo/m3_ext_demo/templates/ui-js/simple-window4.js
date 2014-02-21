var data_store = new Ext.data.JsonStore({
	url:'/ui/test-json-store',
    fields:[
		{% for item in window.form.items %}
	    	{name: '{{ item.name }}'}
			{% if not forloop.last %},{% endif %}
		{% endfor %}
	],
	autoLoad: true
});

data_store.on('load', function(){
	{% for item in window.form.items %}
		Ext.getCmp('{{ item.client_id }}').setValue(data_store.getAt(0).data.{{item.name}});
	{% endfor %}	
});
