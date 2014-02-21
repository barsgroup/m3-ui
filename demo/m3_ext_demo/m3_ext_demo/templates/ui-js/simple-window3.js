{% extends 'ext-windows/ext-window.js' %}

{% block usercode %}
function mazafaka_button_press()
{
    alert('hello world from button handler');
}
{% endblock %}