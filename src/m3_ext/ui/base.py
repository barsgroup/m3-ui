# coding: utf-8
"""
Модуль с базовыми классами/интерфейсами, которые необходимы
для работы подсистемы m3_ext_demo.ui
"""
from __future__ import absolute_import

import datetime
import decimal

from m3 import date2str

from m3_ext.ui import generate_client_id
from m3_ext.ui import normalize
from m3_ext.ui import render_component

from .helpers import _render_globals
import six


class ExtComponentException(Exception):
    """
    Ошибка М3-шного экстового компонента.
    """
    pass


class ListenerMap(object):
    """
    Дескриптор коллекции листенеров.
    При рендеринге контрола с выставленным флагом flag_attr
    обработчики из списка в атрибуте storage_attr
    будут заменены на None
    """
    def __init__(self, storage_attr, flag_attr):
        self._storage_attr = storage_attr
        self._flag_attr = flag_attr

    def __get__(self, inst, cls):
        disable = getattr(inst, self._flag_attr, False)
        manageable = set(getattr(cls, 'manageable_listeners', tuple()))
        class ListenerStorage(object):

            def __init__(self, data):
                self._data = data

            def items(self):
                if not disable:
                    return list(self._data.items())
                return [
                    (k, v if k not in manageable else None)
                    for (k, v) in six.iteritems(self._data)
                ]

            def __getitem__(self, key):
                return self._data[key]

            def __setitem__(self, key, val):
                self._data[key] = val

            def get(self, key, default=None):
                return self._data.get(key, default)

        return ListenerStorage(getattr(inst, self._storage_attr))

    def __set__(self, inst, val):
        assert inst is not None, "ListenerMap settable only in instances!"
        setattr(inst, self._storage_attr, val)


class BaseExtComponent(object):
    """
    Базовый класс для всех компонентов пользовательского интерфейса
    """

    _listeners = ListenerMap('_listeners_stored', 'read_only')

    def __init__(self, *args, **kwargs):
        # Каждый компонент может иметь шаблон, в котором он будет рендериться
        self.template = ''

        # :deprecated: Только окно (наследник BaseExtWindow)
        # может иметь данный атрибут
        self.template_globals = ''

        # Уникальный идентификатор компонента
        self.client_id = generate_client_id()

        # action context of the component (normally, this is
        # an instance of m3.actions.ActionContext class
        self.action_context = None

        # Словарь обработчиков на события
        self._listeners = {}

        # Список словарей с основной конфигурацией компонента
        self._config_list = []

        # Список словарей с дополнительной конфигурацией компонента
        self._param_list = []

        # Если True, то рендерится как функция, без префикса new
        self._is_function_render = False

        # Имя компонента в нотации ExtJs (Например Ext.form.Panel)
        self._ext_name = None

    def render(self):
        """
        Возвращает "кусок" javascript кода, который используется для
        отображения самого компонента. За рендер полного javascript
        отвечает метод get_script()
        :rtype: str
        """
        self.pre_render()
        return render_component(self)

    def render_globals(self):
        """
        Рендерит и возвращает js-код, который помещен в template_globals
        :rtype: str
        """
        return _render_globals(self)

    def pre_render(self):
        """
        Вызывается перед началом работы метода render
        """
        pass

    def init_component(self, *args, **kwargs):
        """
        Заполняет атрибуты экземпляра значениями в kwargs,
        если они проинициализированы ранее
        """
        for k, v in kwargs.items():
            assert k in dir(self) and not callable(getattr(self, k)), (
                'Instance attribute "%s" should be defined in class "%s"!'
                % (k, self.__class__.__name__))
            self.__setattr__(k, v)

    def t_render_listeners(self):
        """
        :deprecated: Если рендеринг не в шаблоне,
        то при вызове render_base_config информация о подписчиках на события
        уже будут в конфиге

        Инкапсуляция над _listeners. Используется из шаблонов!
        """
        return dict([
            (k, v) for k, v in self._listeners.items() if v is not None])

    def t_render_simple_listeners(self):
        """
        :deprecated: Конфиг должен рендериться в render_base_config
        """
        return '{%s}' % ','.join([
            '%s:%s' % (k, v)
            for k, v in self._listeners.items()
            if not isinstance(v, BaseExtComponent) and v is not None
        ])

    def render_base_config(self):
        """
        Рендерит базовый конфиг (Конфигурация extjs контрола)
        """
        self._put_config_value('id', self.client_id)
        if self._listeners:
            self._put_config_value(
                'listeners', self.t_render_simple_listeners)

    def render_params(self):
        """
        Рендерит дополнительные параметры
        (Как правило используется для разработки
        собственных контролов на базе контрола extjs)
        """
        pass

    def __check_unicode(self, string):
        """
        Проверка на не юникодную строку в которой есть русские символы
        Если есть русские символы необходимо использовать юникод!
        :param string: строка для проверки
        :type string: str / unicode
        :raise: Exception
        """
        try:
            six.text_type(string)
        except UnicodeDecodeError:
            raise Exception('"%s" is not unicode' % string)
        else:
            return string

    def _put_base_value(
            self, src_list, extjs_name, item, condition=True, depth=0):
        """
        Управляет правильной установкой (в зависимости от типа)
        параметров контрола
        :param src_list: список словарей
        :type src_list: list
        :param extjs_name: Оригинальное название атрибута в ExtJs
        :type: extjs_name: str
        :param item: значение атрибута в М3
        :type item: basestring, bool, int, float, decimal, long, dict
        :param condition: Условие добавления в конфиг.
        :type condition: bool
        :param depth: глубина обхода
        :type depth: int

        :raise: ExtComponentException
        """
        conf_dict = {}
        res = None
        if item is None or not condition:
            return
        elif callable(item):
            res = self.__check_unicode(item())

        elif isinstance(item, six.string_types):

            # если в строке уже есть апостроф, то будет очень больно.
            # поэтому replace
            res = "'%s'" % normalize(self.__check_unicode(item))

        elif isinstance(item, bool):
            res = str(item).lower()

        elif isinstance(item, (six.integer_types, float, decimal.Decimal)):
            res = item

        elif isinstance(item, datetime.date):
            res = "'%s'" % date2str(item)

        elif isinstance(item, dict):
            # рекурсивный обход вложенных свойств
            d_tmp = {}
            for k, v in item.items():
                prop = self._put_base_value(
                    src_list=src_list,
                    extjs_name=k,
                    item=v,
                    depth=depth + 1
                )
                if prop:
                    d_tmp[k] = prop[k]
            res = d_tmp

        elif hasattr(item, '__unicode__' if six.PY2 else '__str__'):
            return self._put_base_value(
                src_list, extjs_name, six.text_type(item), condition, depth)
        else:
            # Эээээ... Выводится для себя
            raise ExtComponentException(
                u'Тип переданного параметра не '
                u'поддерживается: "%s":"%s"' % (extjs_name, item))

        if res is not None:
            conf_dict[extjs_name] = res
            if depth == 0:
                src_list.append(conf_dict)

            return conf_dict

    def _put_config_value(self, extjs_name, item, condition=True):
        """
        Добавляет значение в конфиг компонента ExtJs,
        для последующей передачи в конструктор JS
        :param extjs_name: Оригинальное название атрибута в ExtJs
        :type: extjs_name: str
        :param item: Значение атрибута в М3
        :param condition: Условие добавления в конфиг.
        :type condition: bool

        .. note::
            Бывает полезно чтобы не использовать лишний if
        """
        self._put_base_value(self._config_list, extjs_name, item, condition)

    def _put_params_value(self, extjs_name, item, condition=True):
        """
        Обертка для упаковки детализированного конфига компонента
        :param extjs_name: Оригинальное название атрибута в ExtJs
        :type: extjs_name: str
        :param item: Значение атрибута в М3
        :param condition: Условие добавления в конфиг.
        :type condition: bool
        """
        self._put_base_value(self._param_list, extjs_name, item, condition)

    def _set_base_value(self, src_list, key, value):
        """
        Устанавливает значение по ключу
        :param src_list: список словарей структуры
        :type src_list: list
        :param key: ключ
        :param value: значение
        :raise: AssertionError
        """
        def set_value_to_dict(src_dict, key, value):
            """
            Вспомогательная функция, позволяет рекурсивно собрать все вложенные
            структуры-словари
            :param src_dict: словарь структуры
            :type src_dict: dict
            :param key: ключ
            :param value: значение
            """
            for k, v in src_dict.items():
                if isinstance(v, dict):
                    res = set_value_to_dict(v, key, value)
                    if res:
                        return True
                elif k == key:
                    if value:
                        src_dict[k] = value
                    else:
                        src_dict[k] = '""'
                    return True
            return False

        for item in src_list:
            assert isinstance(item, dict), 'Nested structure must be dict type'
            res = set_value_to_dict(item, key, value)
            if res:
                return True

        return False

    def _set_config_value(self, key, value):
        return self._set_base_value(self._config_list, key, value)

    def _set_params_value(self, key, value):
        return self._set_base_value(self._param_list, key, value)

    def _get_base_str(self, src_list):
        """
        Возвращает структуру в json-формате
        :param src_list: Список словарей, словари могут быть вложенными
        :type src_list: list

        Пример структуры:
        [
            {...},
            {...},
            {
                {...},
                {...},
            }
        ]
        """
        def get_str_from_dict(src_dict):
            """
            Вспомогательная функция, позволяет рекурсивно собрать все вложенные
            структуры-словари
            :param src_dict: структура-словарь
            :type src_dict: dict
            """
            tmp_list = []
            for k, v in src_dict.items():
                if isinstance(v, dict):
                    tmp_list.append(
                        '%s:{%s}' % (k, get_str_from_dict(v))
                    )
                else:
                    tmp_list.append(
                        '%s:%s' % (k, v)
                    )
            return ','.join(tmp_list)

        tmp_list = []
        for item in src_list:
            assert isinstance(item, dict), 'Nested structure must be dict type'
            tmp_list.append(get_str_from_dict(item))

        return ','.join(tmp_list)

    def _get_config_str(self):
        """
        Возвращает конфиг в формате json
        """
        return self._get_base_str(self._config_list)

    def _get_params_str(self):
        """
        Возрвращает доп. параметры в формате json
        """
        return self._get_base_str(self._param_list)


class ExtUIComponent(BaseExtComponent):
    """
    Базовый класс для компонентов визуального интерфейса
    Наиболее походит на BoxComponent в ExtJS
    """

    def __init__(self, *args, **kwargs):
        super(ExtUIComponent, self).__init__(*args, **kwargs)

        # Произвольные css стили для контрола
        self.style = {}

        # Будет ли отображаться
        self.hidden = False

        # Будет ли активен
        self.disabled = False

        # Высота и ширина
        self.height = self.width = None

        # Координаты по оси Х и Y для абсолютного позиционирования
        self.x = self.y = None

        # html содержимое
        self.html = None

        # Расположение компонента при использовании layout=border
        self.region = None

        # Количество занимаемых ячеек для layout=*box (vbox или hbox)
        self.flex = None

        # Максимальные и минимальные ширины и высоты
        self.max_height = self.min_height = (
            self.max_width) = self.min_width = None

        # Наименование
        self.name = None

        # Якорь
        self.anchor = None

        # CSS класс, который будет добавлен к компоненту
        self.cls = None

        # Использовать ли автоскрол
        self.auto_scroll = False

        # Включение автовысоты. Аналог height='auto'
        self.auto_height = False

        # Включение автоширины. Аналог width='auto'
        self.auto_width = False

        # Метка поля
        self.label = None

        # Скрыть label
        self.hide_label = False

        # CSS стиль для label
        self.label_style = {}

    def t_render_style(self):
        """
        :deprecated: Использовать рендеринг в render_base_config
        """
        return '{%s}' % ','.join(
            ['"%s":"%s"' % i for i in self.style.items()]
        )

    def render_base_config(self):
        """
        Рендер базового конфига объекта
        """
        super(ExtUIComponent, self).render_base_config()
        self._put_config_value('style', self.t_render_style, self.style)
        self._put_config_value('hidden', self.hidden, self.hidden)
        self._put_config_value('disabled', self.disabled, self.disabled)
        self._put_config_value('height', self.height)
        self._put_config_value('width', self.width)
        self._put_config_value('x', self.x)
        self._put_config_value('y', self.y)
        self._put_config_value('html', self.html)
        self._put_config_value('region', self.region)
        self._put_config_value('flex', self.flex)
        self._put_config_value('maxHeight', self.max_height)
        self._put_config_value('minHeight', self.min_height)
        self._put_config_value('maxWidth', self.max_width)
        self._put_config_value('minWidth', self.min_width)
        self._put_config_value('name', self.name)
        self._put_config_value('anchor', self.anchor)
        self._put_config_value('cls', self.cls)
        self._put_config_value(
            'autoScroll', self.auto_scroll, self.auto_scroll)
        self._put_config_value(
            'autoHeight', self.auto_height, self.auto_height)
        self._put_config_value('autoWidth', self.auto_width, self.auto_width)
        self._put_config_value('fieldLabel', self.label)
        if self.label_style:
            self._put_config_value('labelStyle', self.t_render_label_style())
        self._put_config_value('hideLabel', self.hide_label, self.hide_label)

    def make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        """
        :param access_off: переменная регулирует вкл\выкл режима для чтения.
        :type access_off: bool
        :param exclude_list: список, содержит в себе имена элементов,
            которые не надо выключать.
            Позволяет сделать компонент недоступным для изменения.
            Обязательно должен быть переопределен в наследуемых классах.
        :type exclude_list: list

        .. note::
        При вызове метода без параметров, используется параметр по-умолчанию
        access_off=True, в этом случае метод делает компонент, и все контролы
        расположенные на нем неизменяемыми.
        _make_read_only(False) соответственно делает компонент доступным для
        изменения, так же как и все контролы на нем.
        """
        if (
            (self in exclude_list) or
            (hasattr(self, 'name') and self.name and self.name in exclude_list)
        ):
            actual_access_off = not access_off
        else:
            actual_access_off = access_off

        return self._make_read_only(
            actual_access_off, exclude_list, *args, **kwargs)

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        raise NotImplementedError()
