# -*- coding: utf-8 -*-
# Create your views here.rtn.core.views
import json
from django.core.urlresolvers import reverse

from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import render_to_response
from django.template.context import RequestContext

from m3_ext.ui.app_ui import BaseDesktopElement, MenuSeparator

from context_processors import desktop_processor


def workspace(template='m3_workspace.html', context_processors=None):
    u"""
    Возвращает view для отображения Рабочего Стола
    на основе указанного шаблона
    :param template: имя файла шаблона
    :type template: str
    """
    def make_context(request, ctx):
        """
        Формирует контекст, прогоняя request через цепочку процессоров
        """
        return reduce(
            lambda x, f: x.update(f(request)) or x,
            context_processors or [],
            ctx
        )

    def workspace_view(request):
        u"""
        view для отображения Рабочего Стола
        """
        context = RequestContext(
            request,
            make_context(
                request,
                {'desktop_url': reverse(desktop_items)}))
        return render_to_response(template, context)

    return workspace_view


def desktop_items(request):
    u"""
    Возвращает конфигурацию элементов Рабочего Стола
    """

    def default(obj):
        """
        Возвращает UI-элемент в сериализованном виде
        :param obj: элемент рабочего стола
        :type obj: MenuSeparator / BaseDesktopElement
        """
        if isinstance(obj, MenuSeparator):
            return '-'
        elif isinstance(obj, BaseDesktopElement):
            result = {
                'text': obj.name,
                'icon': obj.icon,
            }
            if obj.has_subitems:
                result['items'] = list(obj.subitems)
            else:
                result['url'] = obj.url
                result['context'] = getattr(obj, 'context', {}) or {}

            return result

        raise TypeError("%r is not JSON-able!" % obj)

    if settings.DEBUG:
        opts = {
            'indent': 4,
            'separators': (', ', ': '),
        }
    else:
        opts = {'separators': (',', ':')}

    return HttpResponse(
        json.dumps(desktop_processor(request), default=default, **opts),
        mimetype='text/json'
    )
