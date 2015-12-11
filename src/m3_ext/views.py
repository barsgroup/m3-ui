# -*- coding: utf-8 -*-
# Create your views here.rtn.core.views
from django.shortcuts import render_to_response
from django import template as django_template

from m3_ext.context_processors import DesktopProcessor


DEFAULT_PROCESSORS = (DesktopProcessor.process,)


def workspace(
    template='m3_workspace.html',
    context_processors=DEFAULT_PROCESSORS
):
    u"""
    Возвращает view для отображения Рабочего Стола
    на основе указанного шаблона
    :param template: имя файла шаблона
    :type template: str
    """
    from django.conf import settings
    def workspace_view(request):
        u"""
        view для отображения Рабочего Стола
        """
        context = django_template.RequestContext(
            request, {'DEBUG': settings.DEBUG},
            processors=context_processors)
        return render_to_response(template, context)
    return workspace_view
