# -*- coding: utf-8 -*-
# Create your views here.rtn.core.views
from django.shortcuts import render_to_response
from django import template as django_template


def workspace(template='m3_workspace.html'):
    u"""
    Возвращает view для тображения Рабочего Стола
    на основе указанного шаблона
    :param template str: имя файла шаблона
    """
    def workspace_view(request):
        u"""
        view для отображения Рабочего Стола
        """
        context = django_template.RequestContext(request, {})
        return render_to_response(template, context)
    return workspace_view
