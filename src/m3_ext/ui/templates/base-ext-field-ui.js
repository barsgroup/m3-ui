{% if component.label %} ,fieldLabel: '{{ component.label }}' {% endif %}
{% if component.name %} ,name: '{{ component.name }}' {% endif %}
,value: '{{ component.value|safe }}'
{% if component.label_style %} ,labelStyle: "{{ component.t_render_label_style|safe }}" {% endif %}
{% if component.read_only %} ,readOnly: true {% endif %}
{% if component.tab_index %} ,tabIndex: {{ component.tab_index }} {% endif %}