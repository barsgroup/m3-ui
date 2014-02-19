#coding:utf-8
"""
Классы для работы первично отображаемого интерфейса MIS.
Включают список модулей в меню "Пуск" и список модулей на "Рабочем столе"

Created on Nov 18, 2010

@author: prefer
"""
import threading
import inspect
from uuid import uuid4

from django.conf import settings
from django.utils.importlib import import_module
from django.contrib.auth.models import User, AnonymousUser
from django.utils.log import logger

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

from m3.actions import ControllerCache, Action, ActionPack
from m3 import M3JSONEncoder


# Константы: "Разделитель", "Блок с текущим временем", "Заполняющий блок"
SEPARATOR = '-'
TIMEBLOCK = 'TIMEBLOCK'
FILLBLOCK = 'FILLBLOCK'


class DesktopException(Exception):
    """
    Возникает при ошибках сборки рабочего стола, ярлыков, пунктов меню и т.п.
    """
    pass


class DesktopElementCollection(object):
    """
    Колекция эл-тов Рабочего Стола, определяющая их видимость
    """
    sorting_key = lambda x: (x.index, x.name)
    desktop_model = None

    def __init__(self, name):
        self._name = name # ключ в файле конфигурации

    def __get__(self, inst, owner):
        fork = self.__class__(self._name)
        fork.desktop_model = inst
        fork.sorting_key = self.sorting_key
        return fork

    def __iter__(self):
        return iter(self._storage)

    def append(self, elem):
        """
        Добавление эл-та в коллекцию
        """
        self._storage.append(elem)

    @property
    def _storage(self):
        """
        Accessor для хранилища элементов в экземпляре DesktopModel
        """
        if self.desktop_model is None:
            raise ValueError(
                u'Storage can be accessed only from DesktopModel instance!')
        return self.desktop_model.__dict__.setdefault(
            '_%s_items' % self._name, [])


class DesktopModel(object):
    """
    Класс, агрегирующий в себе список модулей
    (start_menu и toolbox) в меню пуск
    и список модулей на Рабочем Столе (desktop)
    """
    start_menu = DesktopElementCollection('start_menu')
    toolbox = DesktopElementCollection('toolbox')
    desktop = DesktopElementCollection('desktop')
    toptoolbar = DesktopElementCollection('toptoolbar')


class BaseDesktopElement(object):
    """
    Базовый класс для объекта модулей и объекта подменю
    """
    # атрибуты, копируемые в при "колнировании" экземпляра
    # потомки должны добавлять новые атрибуты (конкатенацией)
    clonable_attrs = ('name', 'icon', 'index', 'id')

    def __init__(self, *args, **kwargs):
        """
        @param name: Название модуля или подменю
        @param icon: Класс CSS, отвечающий за отрисовку иконки
        """
        self.name = ''
        self.icon = ''
        self.index = 0
        self.id = str(uuid4())[0:8]

    def _init_component(self, *args, **kwargs):
        """Заполняет атрибуты экземпляра значениями из kwargs"""
        for k, val in kwargs.items():
            assert k in self.__dict__, (
                'Instance attribute "%s" should be defined in class "%s"!' %
                (k, self.__class__.__name__)
            )
            self.__setattr__(k, val)

    def render(self):
        """
        Должен быть переопределен в классе-наследнике
        """
        raise NotImplementedError()

    def __eq__(self, other):
        return isinstance(other, BaseDesktopElement) and self.id == other.id

    def __cmp__(self, other):
        assert isinstance(other, BaseDesktopElement)
        return cmp(self.index, other.index) or cmp(self.name, other.name)

    def clone(self, *args, **kwargs):
        """
        Возвращает "клон" себя
        """
        clone = self.__class__(*args, **kwargs)
        for k in self.clonable_attrs:
            setattr(clone, k, getattr(self, k))
        return clone


class DesktopLaunchGroup(BaseDesktopElement):
    """
    Класс для работы подменю по нажатию на кнопку Пуск
    """
    def __init__(self, *args, **kwargs):
        """
        subitem: Хранит список модулей и список подменю
        """
        super(DesktopLaunchGroup, self).__init__(*args, **kwargs)
        self.subitems = []
        self.index = 10
        self.icon = 'default-launch-group'
        self._init_component(*args, **kwargs)

    @staticmethod
    def t_is_subitems():
        """
        Для удобства понимания что рендерить. Используется в шаблонах.
        """
        return True

    def render(self):
        """
        Рендерит имеющийся объект. Вызывается из функции render.
        """
        if self.subitems:
            return '{%s}' % ','.join([
                'text: "%s"' % self.name.replace('"', "&quot;"),
                'iconCls: "%s"' % self.icon,
                'handler: function(){return false;}',
                'menu: %s' % self.render_items(),
            ])
        else:
            return None

    def clone(self, *args, **kwargs):
        """
        Возвращает "клон" себя
        """
        clone = super(DesktopLaunchGroup, self).clone(*args, **kwargs)
        for subitem in self.subitems:
            clone.subitems.append(subitem.clone())
        return clone

    def render_items(self):
        """
        Рендерит имеющийся список объектов. Вызывается из шаблона.
        """
        res = []
        for item in self.subitems:
            rendered = item.render()
            if rendered:
                res.append(rendered)
        return '{items: [%s]}' % ','.join(res)


class DesktopLauncher(BaseDesktopElement):
    """
    Класс для работы модулей.
    Модули могут находится в меню Пуск, на рабочем столе.
    Данные модули могут включать в себя класс
    DesktopLaunchGroup в атрибут subitems
    """
    clonable_attrs = BaseDesktopElement.clonable_attrs + (
        'handler', 'url',
    )

    def __init__(self, *args, **kwargs):
        """
        @param url: url-адрес, запрос по которому возвратит форму
        """
        super(DesktopLauncher, self).__init__(*args, **kwargs)
        self.handler = None
        self.url = ''
        self.icon = 'default-launcher'
        self.index = 100
        self.context = {}  # словарь контекста
        self._init_component(*args, **kwargs)
        self._set_default_handler()

    def _set_default_handler(self):
        """
        Формирование кода стандартного обработчика click'ов по элементу
        """
        self.handler = (
            'function(){return sendRequest("%s", '
            'AppDesktop.getDesktop(), %s);}'
        ) % (
            self.url,
            self.t_render_context()
        )

    @staticmethod
    def t_is_subitems():
        """
        Для удобства понимания что рендерить. Используется в шаблонах.
        """
        return False

    def t_render_context(self):
        """
        Рендеринг контекста для будущих AJAX-запросов
        """
        return M3JSONEncoder().encode(self.context)

    def render(self):
        """
        Рендерит текущий объект.
        Вызывается из метода render_items класса DesktopLaunchGroup
        """
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

    def clone(self, *args, **kwargs):
        """
        Возвращает "клон" себя
        """
        clone = super(DesktopLauncher, self).clone(*args, **kwargs)
        clone.context = self.context.copy()
        return clone


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
        self.pack = pack
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

    def clone(self):
        return super(DesktopShortcut, self).clone(self.pack)


class MenuSeparator(BaseDesktopElement):
    """
    Специальный разделитель для меню
    """
    def __init__(self, *args, **kwargs):
        super(MenuSeparator, self).__init__(*args, **kwargs)
        self._init_component(*args, **kwargs)

    def render(self):
        return '"-"'

    def clone(self):
        return self


# Ключ сортировки элементов меню по умолчанию:
DEFAULT_SORTING = lambda x: (x.index, x.name)


class DesktopLoader(object):
    """
    Загрузчик значков и меню для веб-десктопа
    """
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
        """
        Загрузка элементов Раб.Стола, декларированных в приложениях проекта
        """
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
                                u'подключить %s', app_name
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
        """
        Добавляет элементы к интерфейсу в зависимости от метароли
        """
        def join_list(existing_list, in_list):
            """
            Складывает два списка с объектами
            DesktopLaunchGroup и DesktopLauncher
            произвольного уровня вложенности.
            Критерием равенства является имя элемента!
            """
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
    def sort_desktop(cls, desktop_list, sorting=DEFAULT_SORTING):
        """
        Сортирует все контейнеры десктопа в зависимости от индекса (index)
        """
        desktop_list.sorting_key = sorting

    @classmethod
    def populate(cls, user, desktop, sorting=DEFAULT_SORTING):
        """
        Метод, который выполняет всю работу по настройке десктопа во вьюшке
        @user - пользователь или None
        @desktop - экземпляр DesktopModel
        """
        assert isinstance(user, (User, AnonymousUser))

        roles = []
        if not isinstance(user, AnonymousUser):
            roles.extend(get_assigned_metaroles_query(user))
            if user.is_superuser:
                roles.append(SUPER_ADMIN)

        cls.populate_desktop(desktop, roles, sorting)

    @classmethod
    def populate_desktop(cls, desktop, roles=None, sorting=DEFAULT_SORTING):
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
        """
        Добавление элемента дектопа в кэш заданной метароли
        """
        def find_by_name(existed_list, name):
            """
            Поиск внутри списка группы с заданным именем name
            """
            for item in existed_list:
                if isinstance(item, DesktopLaunchGroup) and item.name == name:
                    return item

        def insert_item(existed_list, item):
            """
            Если добавляемый элемент группа,
            то нужно проверить есть ли у нас уже такая группа.
            Если нет - добавляем, иначе нужно зайти в нее
            и продолжить проверку вниз по дереву
            """
            if isinstance(item, DesktopLaunchGroup):
                collision_item = find_by_name(existed_list, item.name)
                if collision_item is None:
                    # Раз нет переcений по имени, то можно добавлять
                    existed_list.append(item)
                else:
                    for i in item.subitems:
                        insert_item(collision_item.subitems, i)
            elif item not in existed_list:
                existed_list.append(item)

        def insert_for_role(metarole, elem, processed_metaroles):
            """
            Добавление элемента для метароли
            """
            if metarole not in processed_metaroles:
                processed_metaroles.append(metarole)
                element = elem.clone()

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

        insert_for_role(metarole, element, processed_metaroles=[])


#==============================================================================
# Разные полезные шорткаты
#==============================================================================

def add_desktop_launcher(
    name='', url='', icon='', path=None, metaroles=None, places=None
):
    """
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
    """
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
        if isinstance(metarole, basestring):
            metarole = get_metarole(metarole)
        if metarole:
            for place in cleaned_places:
                DesktopLoader.add(metarole, place, launcher)
