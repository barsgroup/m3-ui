(function (){
    var component = {{ component.render|safe }};

    {{ component.render_globals }}

    return component;
})()
