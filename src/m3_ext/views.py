# -*- coding: utf-8 -*-
# Create your views here.rtn.core.views
import json
from django.core.urlresolvers import reverse

from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template.context import RequestContext

from m3_ext.ui.app_ui import BaseDesktopElement, MenuSeparator

from context_processors import desktop_processor


def workspace(template='m3_workspace.html'):
    u"""
    Возвращает view для отображения Рабочего Стола
    на основе указанного шаблона
    :param template: имя файла шаблона
    :type template: str
    """

    def workspace_view(request):
        u"""
        view для отображения Рабочего Стола
        """
        context = RequestContext(request, {
            'desktop_url': reverse(desktop_items)
        })
        return render_to_response(template,  context)
    return workspace_view


def desktop_items(request, context_processors=None):
    u"""
    Возвращает view для отображения Рабочего Стола
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
            [desktop_processor] + list(context_processors or []),
            {}
        )

    class Encoder(json.JSONEncoder):
        """
        JSONEncoder, совместимый с клиентским рендерингом
        """

        def default(self, obj):


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
                    context = getattr(obj, 'context', {})
                    if context:
                        result['context'] = context
                    else:
                        result['context'] = {}

                return result

            return super(Encoder, self).default(obj)

    # def wrapper(request):
    return HttpResponse(Encoder().encode(make_context(request)),
                        mimetype='text/json')

    # return wrapper