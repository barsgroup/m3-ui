new Ext.data.Connection().request({
	id: "{{ component.client_id }}"
	,url: "{{ component.url }}"
	{% if component.method%} ,method: "{{ component.method }}" {% endif %}
	{% if component.parameters%} ,params: {{ component.parameters|safe }} {% endif %}
	
	{% if component.function_success %}
	,success: {{ component.function_success }}
	{% else %}
	,success: function(response, opts){
	   smart_eval(response.responseText);
	}
	{% endif %}
	{% if component.function_failure %}
	,failure: {{ component.function_failure }}
	{% else %}
	,failure: function(response, opts){
	   Ext.Msg.alert('','failed');
	}
	{% endif %}
})
