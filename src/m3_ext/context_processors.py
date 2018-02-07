# coding: utf-8
from __future__ import absolute_import

import json

from m3.actions import ActionPack
from m3.actions import ControllerCache

from m3_ext.ui.app_ui import BaseDesktopElement
from m3_ext.ui.app_ui import DesktopLoader
from m3_ext.ui.app_ui import DesktopModel
from m3_ext.ui.app_ui import MenuSeparator


class DesktopProcessor(object):

    @classmethod
    def filter_factory(cls, request, place):
        u"""
        Возвращает функцию фильтрации элементов рабочего стола:
        f(DesktopShortcut) -> bool.
        """

        def filter_by_permissions(elem):
            """
            Возвращает True, если у ползователя есть права на пак элемента.
            Работет только с DesktopShortcut'ами - у них есть атрибут pack,
            остальные же элементы - отображаются всегда
            :param elem: элемент рабочего стола
            :type elem: DesktopShortcut
            :return: has_perm - наличие права доступа к элементу
            :rtype: bool
            """
            pack = getattr(elem, 'pack', None)
            if pack is None or isinstance(pack, ActionPack):
                return True
            else:
                return pack.has_perm(request)
        return filter_by_permissions

    @classmethod
    def _dump_element(cls, obj):
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

    @classmethod
    def _get_desktop(cls, request):
        """
        Формирует элементы Рабочего Стола
        :param request: request
        :type request: Request
        """
        desktop_model = DesktopModel(request, cls.filter_factory)
        ControllerCache.populate()
        DesktopLoader._success = False
        if hasattr(request, 'user'):
            DesktopLoader.populate(request.user, desktop=desktop_model)
        else:
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
                desktop, indent=2, default=cls._dump_element,
                ensure_ascii=False),
            # TODO: переделать на JS!
            'desktop_icons': [
                (idx, i.name, i.icon)
                for (idx, i) in enumerate(desktop['desktopItems'], 1)
            ]
        }
