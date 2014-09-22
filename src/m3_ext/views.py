# -*- coding: utf-8 -*-
import json

from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import render_to_response
from django import template as django_template

from m3_ext.ui.app_ui import BaseDesktopElement, MenuSeparator

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
        json.dumps(DesktopProcessor.process(request), default=default, **opts),
        mimetype='application/json'
    )
