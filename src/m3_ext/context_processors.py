#coding: utf-8
import json

from m3_ext.ui.app_ui import (
    DesktopModel, DesktopLoader, BaseDesktopElement, MenuSeparator
)
from m3.actions import ControllerCache


def _dump_element(obj):
    """
    Возвращает UI-элемент в сериализованном виде
    :param obj: элемент рабочего стола
    :type obj: MenuSeparator / BaseDesktopElement
    """
    if isinstance(obj, MenuSeparator):
        result = '-'
    elif isinstance(obj, BaseDesktopElement):
        result = {
            'text': obj.name,
            'icon': obj.icon,
            'extra': {}
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
    else:
        raise TypeError("%r is not JSON-able!" % obj)
    return result


class DesktopProcessor(object):

    @classmethod
    def get_filter_function(cls):
        u"""
        Получить функцию фильтрации элементов рабочего стола:
        f(DesktopShortcut) -> bool.
        """
        return None

    @classmethod
    def get_dump_function(cls):
        u"""
        Получить функцию упаковки элементов рабочего стола:
        f(DesktopShortcut) -> dict.
        """
        return _dump_element

    @classmethod
    def _get_desktop(cls, request):
        """
        Формирует элементы Рабочего Стола
        :param request: request
        :type request: Request
        """
        desktop_model = DesktopModel(request, cls.get_filter_function())
        ControllerCache.populate()
        DesktopLoader._success = False
        DesktopLoader.populate_desktop(desktop=desktop_model)

        return {
            'desktopItems': list(desktop_model.desktop.subitems),
            'menuItems': list(desktop_model.start_menu.subitems),
            'topToolbarItems': list(desktop_model.toptoolbar.subitems),
            'toolboxItems': list(desktop_model.toolbox.subitems),
        }

    @classmethod
    def process(cls, request):
        """
        Добавляет в контекст элементы Рабочего Стола
        :param request: request
        :type request: Request
        """
        desktop = cls._get_desktop(request)
        return {
            'desktop': json.dumps(
                desktop, indent=2, default=cls.get_dump_function(),
                ensure_ascii=False),
            # TODO: переделать на JS!
            'desktop_icons': [
                (idx, i.name, i.icon)
                for (idx, i) in enumerate(desktop['desktopItems'], 1)
            ]
        }


def desktop_processor(request):
    return DesktopProcessor.process(request)
