(function(){
    return new Ext.menu.Menu({
    	{% include 'base-ext-ui.js'%}
    	,items: {{ component.t_render_items|safe }}
    	{# Прописываются имеющиеся обработчики #}
    	{% if component.t_render_listeners %}
    		{# Прописываются имеющиеся обработчики #}
    		,listeners:{
    			{% for k, v in component.t_render_listeners.items %}
    				{# Здесь рендерится контекстное меню #}
    				{% ifequal k "beforeshow" %}
    					beforeshow: {{ v|safe }}
    				{% endifequal %} 
    				{% if not forloop.last %},{% endif %}
    		{% endfor%}
    		}
    	{% endif %}
    });
})()
