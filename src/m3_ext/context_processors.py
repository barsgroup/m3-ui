#coding: utf-8

from m3_ext.ui.app_ui import DesktopModel, DesktopLoader
from m3.actions import ControllerCache


def desktop_processor(request):
    """
    Добавляет в контекст элементы Рабочего Стола
    :param request: request
    :type request: Request
    """
    desktop_model = DesktopModel(request)
    ControllerCache.populate()
    DesktopLoader._success = False
    if hasattr(request, 'user'):
        DesktopLoader.populate(request.user, desktop=desktop_model)
    else:
        DesktopLoader.populate_desktop(desktop=desktop_model)
    desktop_items = list(desktop_model.desktop.subitems)
    return {
        'desktop': {
            'menuItems': list(desktop_model.start_menu.subitems),
            'topToolbarItems': list(desktop_model.toptoolbar.subitems),
            'toolboxItems': list(desktop_model.toolbox.subitems),
            'desktopItems': desktop_items,
        },
        'desktopIcons': [
            {'id': idx, 'name': i.name, 'icon': i.icon}
            for (idx, i) in enumerate(desktop_items, 1)
        ]
    }
