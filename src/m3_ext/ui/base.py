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


def renderable(name, bases, attrs):
    """
    Метакласс для отображаемых в JSON компонентов
    """
    mapping = [
        (i, i) if isinstance(i, str) else i
        for i in (
            attrs.get('_js_attrs') or sum(
                (getattr(b, '_js_attrs', ()) for b in bases), ())
        )
    ]
    attrs['_py2js'] = dict(mapping)
    attrs['_js2py'] = dict((js, py) for (py, js) in mapping)

    # def initializer(init):
    #     """
    #     Обертка конструктора, заполняющая атрибуты из kwargs
    #     """
    #     @wraps(init)
    #     def inner(self, *args, **kwargs):
    #         if getattr(self, '_config', None) is None:
    #             self._config = {'xtype': attrs.get('_xtype')}
    #             self._data = {}
    #             self._py_only = {}
    #             for pair in kwargs.iteritems():
    #                 setattr(self, *pair)
    #         init(self, *args, **kwargs)
    #     return inner

    # if '__init__' in attrs:
    #     attrs['__init__'] = initializer(attrs['__init__'])

    # список внутренних атрибутов для нормальной работы __getattr__
    attrs['_internals'] = ('_config', '_data', '_py2js', '_js2py', '_py_only')

    return type(name, bases, attrs)


class BaseExtComponent(object):
    """
    Базовый класс для всех компонентов пользовательского интерфейса
    """
    __metaclass__ = renderable

    __slots__ = ('_config', '_data', '_py_only')

    # атрибуты ExtJS и правила их преобразования
    # кортеж состоящий из строк или кортежей вида ("python_attr", "js_attr")
    _js_attrs = ()

    def __new__(cls, *args, **kwargs):
        self = super(BaseExtComponent, cls).__new__(cls)
        self._config = {'xtype': cls._xtype}
        self._data = {}
        self._py_only = {}
        for pair in kwargs.iteritems():
            setattr(self, *pair)
        return self

    def _init_attr(self, attr, val):
        try:
            _ = getattr(self, attr)
        except AttributeError:
            setattr(self, attr, val)

    def __init__(self, *args, **kwargs):
        # тут заглушка, чтобы нормально вызывался super.__init__
        pass

    def __setattr__(self, attr, value):
        if attr in ('_config', '_data', '_py_only'):
            if getattr(self, attr, None) is None:
                super(BaseExtComponent, self).__setattr__(attr, value)
            return

        js_attr = self._py2js.get(attr)
        if js_attr is not None:
            conf = super(BaseExtComponent, self).__getattribute__('_config')
            conf[js_attr] = value
        elif attr.startswith('_') or isinstance(value, BaseExtComponent):
            # атрибуты, существующие только в python
            pyo = super(BaseExtComponent, self).__getattribute__('_py_only')
            pyo[attr] = value
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
        if attr in self._internals:
            super(BaseExtComponent, self).__getattribute__(attr)
        else:
            def get(d, k):
                try:
                    return d[k]
                except KeyError:
                    raise AttributeError(
                        'Attribute %r not present in %r' % (k, self)
                    )
            js_attr = self._js2py.get(attr)
            if js_attr is not None:
                return get(
                    super(BaseExtComponent, self).__getattribute__('_config'),
                    js_attr
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
    _js_attrs = (
        'style', 'hidden',
        'height', 'width', 'x', 'y',
        ('min_width', 'minWidth'), ('min_height', 'minHeight'),
        'html', 'region', 'flex',
        'name', 'anchor', 'cls',
        ('auto_scroll', 'autoScroll'),
        ('auto_width', 'autoWidth'), ('auto_height', 'autoHeight'),
        ('label', 'fieldLabel'),
        ('label_style', 'labelStyle'),
        ('hide_label', 'hideLabel'),
    )

    def make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        """
        @access_off - переменная регулирует вкл\выкл режима для чтения.
        @exclude_list - список, содержит в себе имена элементов,
        которые не надо выключать.
        Позволяет сделать компонент недоступным для изменения.
        Обязательно должен быть переопределен в наследуемых классах.
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
