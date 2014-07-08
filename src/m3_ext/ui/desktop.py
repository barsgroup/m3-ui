#coding:utf-8
"""
"""
from m3 import actions
from m3_ext.ui import app_ui


#==============================================================================
# uificate_the_controller
#==============================================================================
def uificate_the_controller(
        controller, metarole=app_ui.GENERIC_USER, icon_collection=None,
        menu_root=None, top_menu_root=None):
    """
    Интеграция в интерфейс рабочего стола паков контроллера

    :param controller: Контроллер
    :type controller: m3.actions.ActionController
    :param metarole: Метароль
    :type metarole: str
    :param icon_collection:
    :type icon_collection:
    :param menu_root:
    :type menu_root:
    :param top_menu_root:
    :type top_menu_root:
    """
    for pack in controller.top_level_packs:
        Desktop.from_pack(
            pack, for_metarole=metarole, icons=icon_collection)
        MainMenu.from_pack(
            pack, for_metarole=metarole, icons=icon_collection,
            menu_root=menu_root)
        TopMenu.from_pack(
            pack, for_metarole=metarole, icons=icon_collection,
            menu_root=top_menu_root)


#==============================================================================
def _add_to(metarole, to_, items):
    #if _users.metaroles.get_metarole(metarole)
    for item in items:
        app_ui.DesktopLoader.add(metarole, to_, item)


def _add_to_desktop(metarole, *items):
    """
    Добавление элементов на Рабочий Стол
    """
    _add_to(metarole, app_ui.DesktopLoader.DESKTOP, items)


def _add_to_toolbox(metarole, *items):
    """
    Добавление элементов в меню инструментов (справа в главном меню)
    """
    _add_to(metarole, app_ui.DesktopLoader.TOOLBOX, items)


def _add_to_menu(metarole, *items):
    """
    Добавление элементов в главное меню
    """
    _add_to(metarole, app_ui.DesktopLoader.START_MENU, items)


def _add_to_top_menu(metarole, *items):
    """
    Добавление элементов в верхнее меню
    """
    _add_to(metarole, app_ui.DesktopLoader.TOPTOOLBAR, items)


#==============================================================================
# DesktopItem
#==============================================================================
class _DesktopItem(app_ui.DesktopShortcut):
    """
    Элемент UI с запоминанием кода права
    """
    def __init__(self, pack, *args, **kwargs):
        is_pack = isinstance(pack, actions.ActionPack)
        is_action = isinstance(pack, actions.Action)
        if not (is_pack or is_action):
            raise TypeError(u'pack must be instance of Action/ActionPack!')

        need = lambda obj: getattr(obj, 'need_check_permission', False)
        if is_action:
            if need(pack) and need(pack.parent):
                code = pack.get_permission_code()
            else:
                code = None
        else:
            try:
                action = pack.get_default_action()
                if not isinstance(action, actions.Action):
                    raise AttributeError()
                if need(action) and need(action.parent):
                    code = action.get_permission_code()
                else:
                    code = None
                pack = action
            except AttributeError:
                raise AttributeError(
                    u'Pack must provide "get_default_action" method,'
                    u' returning action instance!'
                )
        self.permission_code = code
        super(_DesktopItem, self).__init__(pack, *args, **kwargs)


#==============================================================================
# _UIFabric
#==============================================================================
class _UIFabric(object):
    """
    Прототип построителя UI
    """
    pack_method = ''  # для метода для расширения UI
    pack_flag = ''  # флаг расширения UI простым путём (напр.для справочников)
    # метод расширения UI (_add_to_XXX, обернутый в staticmethod, если нужно)
    ui_extend_method = lambda *args: None

    icons = None

    class Item(object):
        """
        Элемент меню для пака/экшна
        """
        def __init__(self, name, pack, **kwargs):
            self._args = kwargs
            self._args['name'] = name
            self._args['pack'] = pack

        def _populate(self):
            return _DesktopItem(**self._args)

    @staticmethod
    def _wrap(data):
        """
        Делаем данные всегда итерируемыми
        """
        try:
            data = list(data)
        except TypeError:
            data = [data]
        return data

    def _populate(self, metarole, data):
        return self.ui_extend_method(
            metarole,
            *map(lambda o: o._populate(), filter(None, self._wrap(data)))
        )

    @classmethod
    def from_pack(cls, pack, for_metarole, icons=None, **kwargs):
        """
        Расширение UI из пака
        """
        ui_fabric = cls(**kwargs)
        ui_fabric.icons = icons
        method = getattr(pack, cls.pack_method, None)
        if callable(method):
            data = method(ui_fabric)
        else:
            data = ui_fabric._from_dict_pack(pack)
        if data:
            ui_fabric._populate(for_metarole, data)

    def _from_dict_pack(self, pack):
        """
        Расширение UI из пака справочника
        """
        try:
            assert pack.title
            if getattr(pack, self.pack_flag, False):
                return self.Item(name=pack.title, pack=pack)
            else:
                return None
        except (AttributeError, AssertionError):
            return None


#==============================================================================
# BaseMenu
#==============================================================================
class _BaseMenu(_UIFabric):
    """
    Класс для работы с главным меню
    """

    class SubMenu(object):
        """
        Подменю
        """
        def __init__(self, name, *items, **kwargs):
            self._args = a = {}
            a.update(kwargs)
            a['name'] = name

            self._items = items or []

        def _populate(self):
            items = map(lambda o: o._populate(), filter(None, self._items))
            if items:
                grp = app_ui.DesktopLaunchGroup(**self._args)
                grp.subitems.extend(items)
                return grp
            return None

    class separator(object):
        """
        Разделитель (в инстанциировании не нуждается)
        """
        @staticmethod
        def _populate():
            return app_ui.MenuSeparator()

    def __init__(self, menu_root=None):
        # упаковщик элементов ("корень" меню)
        self._menu_root = menu_root
        # заготовки подменю (константа:упаковщик)
        self._submenu_presets = {
            None: self._root
        }

    @staticmethod
    def _root(*items):
        """
        Упаковщик по умолчанию. Помещает элементы в корень
        """
        return items

    def _populate(self, metarole, data):
        data = self._wrap(data)

        def pack_to(sub_menu):
            def extend(*items):
                sub_menu._items = items
                return sub_menu
            return extend

        data = self._submenu_presets.get(
            self._menu_root,
            pack_to(self._menu_root)
        )(*data)
        return super(_BaseMenu, self)._populate(metarole, data)


#==============================================================================
# MainMenu
#==============================================================================
class MainMenu(_BaseMenu):
    """
    Класс для работы с главным меню
    """
    pack_method = 'extend_menu'
    pack_flag = 'add_to_menu'
    ui_extend_method = staticmethod(_add_to_menu)

    TO_ROOT = None
    TO_DICTS = 1
    TO_REGISTRIES = 2
    TO_ADMINISTRY = 3

    def __init__(self, *args, **kwargs):

        super(MainMenu, self).__init__(*args, **kwargs)
        self._submenu_presets.update({
            self.TO_DICTS: self.dicts,
            self.TO_REGISTRIES: self.registries,
            self.TO_ADMINISTRY: self.administry
        })

        self._registries_menu = self.SubMenu(
            u'Реестры', icon='menu-dicts-16', index=1)
        self._dicts_menu = self.SubMenu(
            u'Справочники', icon='menu-dicts-16', index=2)
        self._administry_menu = self.SubMenu(
            u'Администрирование', icon='menu-dicts-16', index=101)

    def dicts(self, *items):
        """
        Добавление элементов в меню "Справочники"
        """
        self._dicts_menu._items.extend(items)
        return self._dicts_menu

    def registries(self, *items):
        """
        Добавление элементов в меню "Реестры"
        """
        self._registries_menu._items.extend(items)
        return self._registries_menu

    def administry(self, *items):
        """
        Элементы для меню "администрирование"
        """
        self._administry_menu._items.extend(items)
        return self._administry_menu


#==============================================================================
# TopMenu
#==============================================================================
class TopMenu(MainMenu):
    """
    Класс для работы с верхним меню
    """
    pack_method = 'extend_top_menu'
    pack_flag = 'add_to_top_menu'
    ui_extend_method = staticmethod(_add_to_top_menu)


#==============================================================================
# Desktop
#==============================================================================
class Desktop(_UIFabric):
    """
    Класс для работы с Рабочим Столом
    """
    pack_method = 'extend_desktop'
    pack_flag = 'add_to_desktop'
    ui_extend_method = staticmethod(_add_to_desktop)
