id: '{{ component.client_id }}'
{% if component.disabled %} ,disabled: true {% endif %}
{% if component.hidden %} ,hidden: true {% endif %}
{% if component.width %} ,width: {{ component.width }} {% endif %}
{% if component.height %} ,height: {{ component.height }} {% endif %}
{% if component.html  %} ,html: '{{ component.html|safe }}' {% endif %}
{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
{% if component.x %} ,x: {{ component.x }} {% endif %}
{% if component.y %} ,y: {{ component.y }} {% endif %}
{% if component.region %} ,region: '{{ component.region }}' {% endif %}
{% if component.max_height %} ,boxMaxHeight: {{ component.max_height }} {% endif %}
{% if component.min_height %} ,boxMinHeight: {{ component.min_height }} {% endif %}
{% if component.max_width %} ,boxMaxWidth: {{ component.max_width }} {% endif %}
{% if component.min_width %} ,boxMinWidth: {{ component.min_width }} {% endif %}
{% if component.anchor %} ,anchor: '{{ component.anchor|safe }}' {% endif %}
{% if component.flex %} ,flex: {{ component.flex }} {% endif %}
{% if component.cls %} ,cls: '{{ component.cls }}' {% endif %}