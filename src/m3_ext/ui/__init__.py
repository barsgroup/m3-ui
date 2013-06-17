#coding:utf-8

from uuid import uuid4

from django.template import Context
from django.template.loader import get_template
    
def render_component(component):
    context = Context({'component': component, 'self': component})
    template = get_template(component.template)
    return template.render(context)

def render_template(template_name, variables={}):
    context = Context(variables)
    template = get_template(template_name)
    return template.render(context)
    
