#coding:utf-8
"""
Модуль с базовыми классами/интерфейсами, которые необходимы
для работы подсистемы m3_ext_demo.ui

Created on 01.03.2010

@author: akvarats
@author: prefer
"""

import datetime
import decimal
from warnings import warn
from functools import wraps

from m3_ext.ui import render_template, render_component
from m3_ext.ui import generate_client_id, normalize
from m3 import date2str


class ExtComponentException(Exception):
    """
    Ошибка М3-шного экстового компонента.
    """
    pass


class AttrDict(dict):
    """
    Словарь атрибутов со встроенным преобразованием ключей
    """
    def __init__(self, *args, **kwargs):
        """
        Возвращает новый словарь хранения значений
        с преобразованием ключей
        *args    - ключи, преобразующиеся один-в-один
        **kwargs - ключи, меняющие "написание".

        >>> ad = AttrDict('a', 'b', other_attr='otherAttr')
        >>> ad['a'] = 1
        >>> ad['other_attr'] = 2
        >>> ad
        {'a': 1, 'otherAttr': 2}
        """
        self.mapping = dict((a, a) for a in args)
        self.mapping.update(**kwargs)
        # набор итоговых атрибутов
        self.internals = set(self.mapping.values())
        super(AttrDict, self).__init__()

    def _map(self, key):
        return key if key in self.internals else self.mapping[key]

    def get(self, key, default=None):
        return super(AttrDict, self).get(self._map(key), default)

    def __getitem__(self, key):
        return super(AttrDict, self).__getitem__(self._map(key))

    def __setitem__(self, key, val):
        super(AttrDict, self).__setitem__(self._map(key), val)

    def __contains__(self, key):
        return super(AttrDict, self).__contains__(self._map(key))

    def maps(self, key):
        """
        Фозвращает True, если ключ key присутствует
        в таблице преобразования
        """
        return key in self.mapping

    def extend(self, *args, **kwargs):
        """
        Возвращает копию словаря (пустую)
        с расширенной таблицей преобразования
        """
        mapping = self.mapping.copy()
        mapping.update(kwargs)
        return self.__class__(*args, **mapping)

    def __call__(self, **kwargs):
        """
        Возвращает новое хранилище на основе текущего
        (можно рассматривать как экземпляр)
        """
        new = self.__class__()
        new.mapping = self.mapping
        new.internals = self.internals
        new.update(kwargs)
        return new


class BaseExtComponent(object):
    """
    Базовый класс для всех компонентов пользовательского интерфейса
    """
    __slots__ = ('_config', '_data', '_py_only')

    _xtype = None

    # хранилище атрибутов ExtJS и правила их преобразования
    js_attrs = AttrDict(
        'xtype',
        item_id='itemId',
    )

    def __new__(cls, *args, **kwargs):
        self = super(BaseExtComponent, cls).__new__(cls)
        self._config = self.js_attrs(xtype=cls._xtype)
        self._data = {}
        self._py_only = {}
        for pair in kwargs.iteritems():
            setattr(self, *pair)
        return self

    def setdefault(self, key, val):
        try:
            _ = getattr(self, key)
        except AttributeError:
            setattr(self, key, val)

    def __setattr__(self, attr, value):
        if attr in self.__slots__:
            if getattr(self, attr, None) is None:
                super(BaseExtComponent, self).__setattr__(attr, value)
            return

        if self.js_attrs.maps(attr):
            conf = super(BaseExtComponent, self).__getattribute__('_config')
            conf[attr] = value

        elif attr.startswith('_') or isinstance(value, BaseExtComponent):
            # атрибуты, существующие только в python
            pyo = super(BaseExtComponent, self).__getattribute__('_py_only')
            pyo[attr] = value
            # компонентам проставляется itemId
            if isinstance(value, BaseExtComponent):
                value.item_id = attr
        else:
            if attr in (
                'renderer',
                'template',
                'template_globals'
            ):
                return
            data = super(BaseExtComponent, self).__getattribute__('_data')
            data[attr] = value

    def __getattr__(self, attr):
        if attr in self.__slots__:
            super(BaseExtComponent, self).__getattribute__(attr)
        else:
            def get(d, k):
                try:
                    return d[k]
                except KeyError:
                    raise AttributeError(
                        'Attribute %r not present in %r' % (k, self)
                    )
            if self.js_attrs.maps(attr):
                return get(
                    super(BaseExtComponent, self).__getattribute__('_config'),
                    attr
                )
            else:
                try:
                    return get(
                        super(BaseExtComponent, self).__getattribute__(
                            '_py_only'),
                        attr
                    )
                except AttributeError:
                    return get(
                        super(BaseExtComponent, self).__getattribute__(
                            '_data'),
                        attr
                    )

    def init_component(self, *args, **kwargs):
        """
        Заполняет атрибуты экземпляра значениями в kwargs,
        если они проинициализированы ранее
        """
        warn('init_component is deprecated!', UserWarning, 2)


class ExtUIComponent(BaseExtComponent):
    """
    Базовый класс для компонентов визуального интерфейса
    Наиболее походит на BoxComponent в ExtJS
    """
    js_attrs = BaseExtComponent.js_attrs.extend(
        'style', 'hidden',
        'height', 'width', 'x', 'y',
        'html', 'region', 'flex',
        'name', 'anchor', 'cls',
        min_width='minWidth', min_height='minHeight',
        auto_scroll='autoScroll',
        auto_width='autoWidth', auto_height='autoHeight',
        label='fieldLabel',
        label_style='labelStyle',
        hide_label='hideLabel',
    )

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
