#coding:utf-8
'''
Классы для работы первично отображаемого интерфейса MIS.
Включают список модулей в меню "Пуск" и список модулей на "Рабочем столе"

Created on Nov 18, 2010

@author: prefer
'''
import threading
import copy
import inspect
from uuid import uuid4

try:
    from m3_users import GENERIC_USER, SUPER_ADMIN
    from m3_users.helpers import get_assigned_metaroles_query
    from m3_users.metaroles import UserMetarole, get_metarole
except ImportError:
    # если не установлен пакет m3_users
    # Всё должно работать без метаролей
    GENERIC_USER = SUPER_ADMIN = 'none'

    class UserMetarole(object):
        """
        Заглушка для класса метаролей
        """
        code = GENERIC_USER

        def get_owner_metaroles(self):
            return []

    def get_assigned_metaroles_query(*args):
        return []

    def get_metarole(code):
        return UserMetarole()

from django.conf import settings
from django.utils.importlib import import_module
from django.contrib.auth.models import User, AnonymousUser

from m3.helpers.datastructures import TypedList
from m3.helpers import logger

from m3.ui.actions import ControllerCache, Action, ActionPack
from m3.core.json import M3JSONEncoder


# Константы: "Разделитель", "Блок с текущим временем", "Заполняющий блок"
SEPARATOR = '-'
TIMEBLOCK = 'TIMEBLOCK'
FILLBLOCK = 'FILLBLOCK'


class DesktopException(Exception):
    """
    Возникает при ошибках сборки рабочего стола, ярлыков, пунктов меню и т.п.
    """
    pass


class DesktopModel(object):
    """
    Класс, агрегирующий в себе список модулей
    (start_menu и toolbox) в меню пуск
    и список модулей на Рабочем Столе (desktop)
    """

    def __init__(self):
        """
        @param start_menu: список основных модулей для меню Пуск
        @param toolbox: список настроечных модулей для меню Пуск
        @param desktop: список модулей на Рабочем столе
        @param toptoolbar: список модулей на верхней панели
        """
        self.start_menu = TypedList(BaseDesktopElement)
        self.toolbox = TypedList(BaseDesktopElement)
        self.desktop = TypedList(DesktopLauncher)
        self.toptoolbar = TypedList(BaseDesktopElement)


class BaseDesktopElement(object):
    '''
    Базовый класс для объекта модулей и объекта подменю
    '''
    def __init__(self, *args, **kwargs):
        '''
        @param name: Название модуля или подменю
        @param icon: Класс CSS, отвечающий за отрисовку иконки
        '''
        self.name = ''
        self.icon = ''
        self.index = 0
        self.id = str(uuid4())[0:8]

    def _init_component(self, *args, **kwargs):
        '''Заполняет атрибуты экземпляра значениями из kwargs'''
        for k, v in kwargs.items():
            assert k in self.__dict__, (
                'Instance attribute "%s" should be defined in class "%s"!' %
                (k, self.__class__.__name__)
            )
            self.__setattr__(k, v)

    def render(self):
        '''
        Должен быть переопределен в классе-наследнике
        '''
        raise NotImplementedError()

    def __cmp__(self, obj):
        res = isinstance(obj, BaseDesktopElement) and (self.id == obj.id)
        return not res


class DesktopLaunchGroup(BaseDesktopElement):
    '''
    Класс для работы подменю по нажатию на кнопку Пуск
    '''
    def __init__(self, *args, **kwargs):
        '''
        subitem: Хранит список модулей и список подменю
        '''
        super(DesktopLaunchGroup, self).__init__(*args, **kwargs)
        self.subitems = TypedList(BaseDesktopElement)
        self.index = 10
        self.icon = 'default-launch-group'
        self._init_component(*args, **kwargs)

    def t_is_subitems(self):
        '''
        Для удобства понимания что рендерить. Используется в шаблонах.
        '''
        return True

    def render(self):
        '''
        Рендерит имеющийся объект. Вызывается из функции render.
        '''
        if self.subitems:
            return '{%s}' % ','.join([
                'text: "%s"' % self.name.replace('"', "&quot;"),
                'iconCls: "%s"' % self.icon,
                'handler: function(){return false;}',
                'menu: %s' % self.render_items(),
            ])
        else:
            return None

    def __deepcopy__(self, memo):
        clone = DesktopLaunchGroup()
        clone.name = self.name
        clone.icon = self.icon
        clone.index = self.index
        clone.id = self.id
        for subitem in self.subitems:
            clone.subitems.append(
                copy.deepcopy(subitem)
            )
        return clone

    def render_items(self):
        '''
        Рендерит имеющийся список объектов. Вызывается из шаблона.
        '''
        res = []
        for item in self.subitems:
            rendered = item.render()
            if rendered:
                res.append(rendered)
        return '{items: [%s]}' % ','.join(res)

    def ___str__(self):
        return u'Группа: "%s" at %s' % (self.name, id(self))


class DesktopLauncher(BaseDesktopElement):
    '''
    Класс для работы модулей.
    Модули могут находится в меню Пуск, на рабочем столе.
    Данные модули могут включать в себя класс
    DesktopLaunchGroup в атрибут subitems
    '''
    def __init__(self, *args, **kwargs):
        '''
        @param url: url-адрес, запрос по которому возвратит форму
        '''
        super(DesktopLauncher, self).__init__(*args, **kwargs)
        self.url = ''
        self.icon = 'default-launcher'
        self.index = 100
        self.context = {}  # словарь контекста
        self._init_component(*args, **kwargs)
        self._set_default_handler()

    def _set_default_handler(self):
        self.handler = (
            'function(){return sendRequest("%s", '
            'AppDesktop.getDesktop(), %s);}'
        ) % (
            self.url,
            self.t_render_context()
        )

    def t_is_subitems(self):
        '''
        Для удобства понимания что рендерить. Используется в шаблонах.
        '''
        return False

    def t_render_context(self):
        return M3JSONEncoder().encode(self.context)

    def render(self):
        '''
        Рендерит текущий объект.
        Вызывается из метода render_items класса DesktopLaunchGroup
        '''
        return '{%s}' % ','.join([
            'text:"%s"' % self.name.replace('"', "&quot;"),
            'iconCls:"%s"' % self.icon,
            (
                'handler: function(){return sendRequest("%s",'
                ' AppDesktop.getDesktop(), %s);}'
            ) % (
                self.url,
                self.t_render_context()
            ),
            'scope: this',
        ])

    def ___str__(self):
        return u'Ярлык: "%s" at %s' % (self.name, id(self))


class DesktopShortcut(DesktopLauncher):
    """
    Отличается от DesktopLauncher тем,
    что автоматически подцепляет адрес из пака, в зависимости от его типа.
    """
    def __init__(self, pack, *args, **kwargs):
        """
        Конструктор
        @param pack: Имя или класс пака
        """
        super(DesktopShortcut, self).__init__(*args, **kwargs)
        # Если это экшен, то получаем его адрес
        if isinstance(pack, Action):
            self.url = pack.get_absolute_url()
            if not getattr(pack, 'title', None):
                pack.title = getattr(pack.parent, 'title', '???')
        else:
            if inspect.isclass(pack) and issubclass(pack, Action):
                self.url = pack.absolute_url()
                if not getattr(pack, 'title', None):
                    pack.title = pack.__name__
            else:
                if not isinstance(pack, ActionPack):
                    # Пробуем найти как пак
                    pack = ControllerCache.find_pack(pack)
                    if not pack:
                        raise DesktopException(
                            'Pack %s not found in ControllerCache' % pack)

                self.url = pack.get_list_url()
                # Если не задано имя ярлыка, то название берем из справочника
                if not kwargs.get('name', None):
                    self.name = pack.title

        self._set_default_handler()


class MenuSeparator(BaseDesktopElement):
    """
    Специальный разделитель для меню
    """
    def __init__(self, *args, **kwargs):
        super(MenuSeparator, self).__init__(*args, **kwargs)
        self._init_component(*args, **kwargs)

    def render(self):
        return '"-"'


# Ключ сортировки элементов меню по умолчанию:
SORTING = lambda x: x.index


class DesktopLoader(object):
    '''
    Загрузчик значков и меню для веб-десктопа
    '''
    _lock = threading.RLock()
    _cache = None
    # Флаг того, что кэш загружен.
    # Из-за ошибок при сборке он может недозаполниться, а поскольку
    # это операция разовая, больше ошибки не будет.
    # Флаг будет повторять ошибку для облегчения ее обнаружения.
    _success = False

    #Константы определяющие куда добавить элемент
    DESKTOP = 0
    START_MENU = 1
    TOOLBOX = 2
    TOPTOOLBAR = 3

    @classmethod
    def _load_desktop_from_apps(cls):
        cls._lock.acquire()
        try:
            if not cls._success:
                cls._cache = {}
                # Из инитов всех приложения
                # пытаемся выполнить register_desktop_menu
                for app_name in settings.INSTALLED_APPS:
                    try:
                        module = import_module('.app_meta', app_name)
                    except ImportError, err:
                        if err.args[0].find('No module named') == -1 or (
                                err.args[0].find('app_meta') == -1):
                            logger.exception(
                                u'При сборке интерфейса не удалось '
                                u'подключить %s' % app_name
                            )
                            raise
                        continue
                    proc = getattr(module, 'register_desktop_menu', None)
                    if callable(proc):
                        proc()
            cls._success = True
        finally:
            cls._lock.release()

    @classmethod
    def add_el_to_desktop(cls, desktop, metarole_code):
        '''
        Добавляет элементы к интерфейсу в зависимости от метароли
        '''
        def join_list(existing_list, in_list):
            '''
            Складывает два списка с объектами
            DesktopLaunchGroup и DesktopLauncher
            произвольного уровня вложенности.
            Критерием равенства является имя элемента!
            '''
            names_dict = {}
            for existing_el in existing_list:
                assert isinstance(existing_el, BaseDesktopElement)
                names_dict[existing_el.name] = existing_el

            for in_el in in_list:
                assert isinstance(in_el, BaseDesktopElement)
                # Группа ярлыков, которая уже есть в списке
                if isinstance(in_el, DesktopLaunchGroup) and (
                        in_el.name in names_dict):
                    # Запускаем рекурсивное слияние
                    ex_el = names_dict[in_el.name]
                    join_list(ex_el.subitems, in_el.subitems)

                # Если ярлык уже в списке, то добавлять повторно не нужно
                elif in_el.name in names_dict:
                    continue

                else:
                    existing_list.append(in_el)

        # Загрузка кеша
        if not cls._success:
            cls._load_desktop_from_apps()

        items_for_role = cls._cache.get(metarole_code, {})
        for place, items in items_for_role.items():
            if place == cls.DESKTOP:
                join_list(desktop.desktop, items)
            elif place == cls.START_MENU:
                join_list(desktop.start_menu, items)
            elif place == cls.TOOLBOX:
                join_list(desktop.toolbox, items)
            elif place == cls.TOPTOOLBAR:
                join_list(desktop.toptoolbar, items)

    @classmethod
    def sort_desktop(cls, desktop_list, sorting=SORTING):
        '''
        Сортирует все контейнеры десктопа в зависимости от индекса (index)
        '''

        desktop_list.sort(key=sorting)
        for item in desktop_list:
            if isinstance(item, DesktopLaunchGroup):
                cls.sort_desktop(item.subitems)

    @classmethod
    def populate(cls, user, desktop, sorting=SORTING):
        '''
        Метод, который выполняет всю работу по настройке десктопа во вьюшке
        @user - пользователь или None
        @desktop - экземпляр DesktopModel
        '''
        assert isinstance(user, (User, AnonymousUser))

        roles = []
        if not isinstance(user, AnonymousUser):
            roles.extend(get_assigned_metaroles_query(user))
            if user.is_superuser:
                roles.append(SUPER_ADMIN)

        cls.populate_desktop(desktop, roles, sorting)

    @classmethod
    def populate_desktop(cls, desktop, roles=None, sorting=SORTING):
        """
        Построение Раб.Стола по элементам @desktop(экземпляр DesktopModel),
        относительно набора ролей @roles.
        Этот метод НЕ ТРЕБУЕТ django.contrib.auth
        и экземпляра User в частности.
        """
        assert isinstance(desktop, DesktopModel)

        assign_roles = set([GENERIC_USER] + (roles or []))
        for role in assign_roles:
            cls.add_el_to_desktop(desktop, role)

        cls.sort_desktop(desktop.desktop, sorting=sorting)
        cls.sort_desktop(desktop.start_menu, sorting=sorting)
        cls.sort_desktop(desktop.toolbox, sorting=sorting)
        cls.sort_desktop(desktop.toptoolbar, sorting=sorting)

    @classmethod
    def add(cls, metarole, place, element):
        '''
        Добавление элемента дектопа в кэш заданной метароли
        '''
        def find_by_name(existed_list, name):
            '''
            Поиск внутри списка группы с заданным именем name
            '''
            for item in existed_list:
                if isinstance(item, DesktopLaunchGroup):
                    assert isinstance(item.name, unicode), (
                        'The attribute "name" must be written in Unicode')
                    if item.name == name:
                        return item

        def insert_item(existed_list, item):
            # Если добавляемый элемент группа,
            # то нужно проверить есть ли у нас уже такая группа.
            # Если нет - добавляем, иначе нужно зайти в нее
            # и продолжить проверку вниз по дереву

            if isinstance(item, DesktopLaunchGroup):

                collision_item = find_by_name(existed_list, item.name)

                if collision_item is None:
                    # Раз нет переcений по имени, то можно добавлять

                    existed_list.append(item)
                else:
                    for it in item.subitems:
                        insert_item(collision_item.subitems, it)
            else:
                if item not in existed_list:
                    existed_list.append(item)

        def insert_for_role(metarole, el, processed_metaroles=[]):
            if metarole in processed_metaroles:
                return
            processed_metaroles.append(metarole)
            element = copy.deepcopy(el)

            # Кэш состоит из 3х уровней: словарь с метаролями,
            # словарь с местами и список конечных элементов
            items_for_role = cls._cache.get(metarole.code, {})
            items_for_place = items_for_role.get(place, [])
            insert_item(items_for_place, element)
            items_for_role[place] = items_for_place
            cls._cache[metarole.code] = items_for_role

            # Недостаточно добавить элементы только в одну метароль,
            # т.к. она может входить внутрь другой метароли.
            # Так что нужно пробежаться по ролям,
            # которые включают в себя нашу роль.

            for role in metarole.get_owner_metaroles():
                insert_for_role(role, element, processed_metaroles)

        #===============================================
        assert place in (
            cls.DESKTOP,
            cls.START_MENU,
            cls.TOOLBOX,
            cls.TOPTOOLBAR
        )
        if isinstance(metarole, basestring):
            metarole = get_metarole(metarole)
        assert isinstance(metarole, UserMetarole)

        insert_for_role(metarole, element)


#==============================================================================
# Разные полезные шорткаты
#==============================================================================

def add_desktop_launcher(
        name='', url='', icon='', path=None, metaroles=None, places=None):
    '''
    Шорткат для добавления ланчеров в элементы рабочего стола.

    @param name: подпись ланчера на рабочем столе/в меню
    @param url: url, по которому происходит обращение к ланчеру
    @param icon: класс, на основе которого рисуется иконка ланчера
    @param path: список кортежей, которые задают путь к ланчеру в случае, если
                 этот ланчер спрятан в подменю.
                 Каждый элемент пути задается либо в одном из форматов:
                     "(название,)",
                     "(название, иконка,)",
                     "(название, иконка, индекс)"
    @param metaroles: список метаролей (либо одиночная метароль)
    '''
    if not metaroles or not places:
        return

    launcher = DesktopLauncher(url=url, name=name, icon=icon)
    # "чистый" список метаролей, для которых выполняется регистрация метаролей

    cleaned_metaroles = []
    cleaned_places = []

    cleaned_metaroles.extend(
        metaroles if isinstance(metaroles, list) else [metaroles])
    cleaned_places.extend(
        places if isinstance(places, list) else [places])

    root = None
    parent_group = None
    for slug in (path or []):
        group = DesktopLaunchGroup(name=slug[0])
        if len(slug) > 1 and slug[1]:
            group.icon = slug[1]
        elif len(slug) > 2 and isinstance(slug[2], int):
            group.index = slug[2]
        if not root:
            root = group
        if parent_group:
            parent_group.subitems.append(group)

        parent_group = group

    if root:
        root.subitems.append(launcher)
        launcher = root  # мы в ланчеры, значится, будем добавлять самого рута.

    for metarole in cleaned_metaroles:
        mt = (
            get_metarole(metarole)
            if isinstance(metarole, basestring)
            else metarole
        )
        if mt:
            for place in cleaned_places:
                DesktopLoader.add(mt, place, launcher)
