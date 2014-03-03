#coding: utf-8
import json

from django.utils.html import escape, escapejs

from m3_ext.ui.app_ui import (
    DesktopModel, DesktopLoader, BaseDesktopElement, MenuSeparator
)
from m3.actions import ControllerCache


def _dump_element(obj):
    """
    Возвращает UI-элемент в сериализованном виде
    """
    if isinstance(obj, MenuSeparator):
        result = '-'
    elif isinstance(obj, BaseDesktopElement):
        result = {
            'text': obj.name,
            'icon': obj.icon,
        }
        if obj.has_subitems:
            result['items'] = list(obj)
        else:
            result['url'] = obj.url
    else:
        raise TypeError("%r is not JSON-able!" % obj)
    return result


def desktop_processor(request):
    """
    Добавляет в контекст элнмннты Рабочего Стола
    """
    desktop_model = DesktopModel(request)
    ControllerCache.populate()
    DesktopLoader._success = False
    DesktopLoader.populate_desktop(desktop=desktop_model)
    desktop_items = list(desktop_model.desktop)
    return {
        'desktop': json.dumps(
            {
                'menuItems': list(desktop_model.start_menu),
                'desktopItems': list(desktop_model.desktop)
            },
            indent=2, default=_dump_element, ensure_ascii=False
        ),
        # TODO: переделать на JS!
        'desktop_icons': [
            (idx, i.name, i.icon)
            for (idx, i) in enumerate(desktop_items, 1)
        ]
    }
