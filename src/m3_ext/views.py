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
    Возвращает view для тображения Рабочего Стола
    на основе указанного шаблона
    :param template: имя файла шаблона
    :type template: str
    """
    def make_context(request):
        """
        Формирует контекст, прогоняя request через цепочку процессоров
        """
        return reduce(
            lambda x, f: x.update(f(request)) or x,
            context_processors,
            {}
        )

    def workspace_view(request):
        u"""
        view для отображения Рабочего Стола
        """
        context = django_template.RequestContext(
            request, make_context(request))

        return render_to_response(template, context)

    return workspace_view
