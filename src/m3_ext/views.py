# -*- coding: utf-8 -*-
# Create your views here.rtn.core.views
from django.shortcuts import render_to_response
from django import template as django_template

from context_processors import desktop_processor

def workspace(template='m3_workspace.html', context_processors=None):
    u"""
    Возвращает view для тображения Рабочего Стола
    на основе указанного шаблона
    :param template str: имя файла шаблона
    """
    def make_context(request):
        """
        Формирует контекст, прогоняя request через цепочку процессоров
        """
        return reduce(
            lambda x, f: x.update(f(request)) or x,
            [desktop_processor] + list(context_processors or []),
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
