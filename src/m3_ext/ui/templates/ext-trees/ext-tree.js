function(){
	{% for k, v in component.t_render_listeners.items %}
		{# Здесь рендерится контекстное меню #}
		{% ifequal k "contextmenu" %}
			var contmenu = {{ v.render }};
		{% endifequal %}
		{% ifequal k "containercontextmenu" %}
			var container_contmenu = {{ v.render }};
		{% endifequal %}
	{% endfor%}
	
	var tree = new Ext.ux.tree.TreeGrid({
		{% include 'base-ext-ui.js'%}
		
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
		{% if component.title %} ,title: '{{ component.title }}' {% endif %}
		{% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
		{% if component.buttom_bar %} ,bbar: {{ component.t_render_buttom_bar|safe }} {% endif %}
		{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
        {% if component.dd_group %} ,ddGroup: '{{ component.dd_group }}' {% endif %}
		
	    ,useArrows: true
	    ,autoScroll: false
	    ,animate: true
	    
	    ,collapsible: {{ component.collapsible|lower }}
	    {% if component.collapse_mode %} ,collapseMode: '{{ component.collapse_mode }}' {% endif %}

        {% if component.plugins %}
        ,plugins: {{ component.plugins|safe }}
        {% endif %}
	    
		{% if component.drag_drop and not component.read_only%} 
			,enableDD: true
			,dropConfig: {
				allowContainerDrop: {{ component.allow_container_drop|lower }},
				allowParentInsert: {{ component.allow_parent_insert|lower }}
			}
		{% else %}
			,enableDrop: {{ component.enable_drop|lower }} 
			,enableDrag: {{ component.enable_drag|lower }} 	   		
		{% endif %}
	    ,containerScroll: true
	    ,border: false
		,split: true
		,columns:{{ component.t_render_columns|safe }}
		,loader: {{ component.t_render_tree_loader|safe }}	
		
		,root: new Ext.tree.AsyncTreeNode({
			id: '-1'
			,expanded: true
			,allowDrag: false
			{%if component.root_text %} ,text:'{{ component.root_text }}' {%endif%}
			{%if component.nodes %},children: [ {{ component.t_render_nodes|safe }} ] {%endif%}
        })
        {% if component.t_render_listeners %}
			{# Прописываются имеющиеся обработчики #}
			,listeners:{
				{% for k, v in component.t_render_listeners.items %}
					{% if not forloop.first%},{%endif%}
				
					{# Здесь рендерится контекстное меню #}
					{% ifequal k "contextmenu" %}
						contextmenu:
		                    function(node, e){
								node.select();
					            contmenu.contextNode = node;
					            contmenu.showAt(e.getXY());
		                    }
					{%else%}
						{% ifequal k "containercontextmenu" %}
							containercontextmenu:
			                    function(tree, e){
									e.stopEvent();
						            container_contmenu.showAt(e.getXY());
			                    }
						{%else%}
							'{{k}}': {{v|safe}}
						{% endifequal %}  
					{% endifequal %}  
			{% endfor%}
		}
		{% endif %}
	});
	
	{% if component.custom_load %}

		var ajax = Ext.Ajax;
		tree.on('expandnode',function (node){
			var nodeList = new Array();
			if (node.hasChildNodes()){
				for (var i=0; i < node.childNodes.length; i++){
					if(!node.childNodes[i].isLoaded()) {
						nodeList.push(node.childNodes[i].id);
					}	
				}
			}
			if (nodeList.length > 0)
				ajax.request({
					url: "{{ component.url }}"
					,params: {
						'list_nodes': nodeList.join(',')
					}
					,success: function(response, opts){
						var res = Ext.util.JSON.decode(response.responseText);
	
						if (res) {
							for (var i=0; i < res.length; i++){
								var curr_node = node.childNodes[i];
								for (var j=0; j < res[i].children.length; j++){
									var newNode = new Ext.tree.AsyncTreeNode(res[i].children[j]);
									curr_node.appendChild(newNode);
									curr_node.loaded = true;
								}
							}
						} 
					}
					,failure: function(response, opts){
					   Ext.Msg.alert('','failed');
					}
				});
			
		})
	{%endif%}
	{% block code_extenders %}{% endblock %}
	return tree;
}()

