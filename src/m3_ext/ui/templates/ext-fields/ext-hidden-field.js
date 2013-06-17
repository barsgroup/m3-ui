new Ext.form.Hidden({
	id: '{{ component.client_id }}'
	{% if component.name %} ,name: '{{ component.name }}' {% endif %}
	{% if component.value %} ,value: '{{ component.value }}' {% endif %}
})