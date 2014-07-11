#coding:utf-8
"""
Модуль с базовыми классами/интерфейсами, которые необходимы
для работы подсистемы m3_ext_demo.ui
"""

from warnings import warn


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
        self.internals = set(
            v.split('.')[0] for v in self.mapping.values()
        )
        super(AttrDict, self).__init__()

    def _map(self, key):
        return key if key in self.internals else self.mapping[key]

    def get(self, key, default=None):
        key = self._map(key)
        if '.' in key:
            d, k = self._walk_deep(key)
            return d.get(k)
        else:
            return super(AttrDict, self).get(key, default)

    def __getitem__(self, key):
        key = self._map(key)
        if '.' in key:
            d, k = self._walk_deep(key)
            return d[k]
        else:
            return super(AttrDict, self).__getitem__(key)

    def __setitem__(self, key, val):
        key = self._map(key)
        if '.' in key:
            d, k = self._walk_deep(key, make=True)
            d[k] = val
        else:
            super(AttrDict, self).__setitem__(key, val)

    def _walk_deep(self, key, make=False):
        """
        Принимает составной ключ вида "a.b.c"
        Возвращает пару: (подсловарь по пути ["a"]["b"], ключ "c")
        При make=True требуемые уровни создаются
        (в виде пустых словарей)
        """
        path = key.split('.')
        key = path[-1]
        path = path[:-1]
        def walk(d, path):
            if not path:
                return d
            elif make:
                return walk(dict.setdefault(d, path[0], {}), path[1:])
            else:
                return walk(dict.__getitem__(d, path[0]), path[1:])
        return walk(self, path), key

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

    def items(self):
        return list(self.iteritems())

    def iteritems(self):
        """
        Возвращает итератор пар "ключ-значение",
        пропускающий пары со значениями, представляющими собой
        пустые списки и кортежи
        """
        for k, v in super(AttrDict, self).iteritems():
            if v == [] or v == ():
                continue
            yield (k, v)

    def __iter__(self):
        """
        Возвращает итератор ключей, пропускающий ключи, указвающие на
        значения, предаставляющие собой пустые списки и кортежи
        """
        for pair in self.iteritems():
            yield pair[0]


class BaseExtComponent(object):
    """
    Базовый класс для всех компонентов пользовательского интерфейса
    """
    __slots__ = ('_config', '_data', '_py_only', '_configured')

    _xtype = None

    # хранилище атрибутов ExtJS и правила их преобразования
    js_attrs = AttrDict(
        'xtype',
        'plugins',
        item_id='itemId',
    )

    # кортеж атрибутов, которые считаются устаревшими
    deprecated_attrs = (
        'template',
        'renderer',
        'template_globals'
    )

    def __new__(cls, *args, **kwargs):
        self = super(BaseExtComponent, cls).__new__(cls)
        self._config = self.js_attrs(xtype=cls._xtype, plugins=[])
        self._data = {}
        self._py_only = {}
        self._configured = set(kwargs.keys())
        for pair in kwargs.iteritems():
            setattr(self, *pair)
        return self

    def setdefault(self, key, val):
        if key not in super(BaseExtComponent, self).__getattribute__(
            '_configured'
        ):
            setattr(self, key, val)

    def __setattr__(self, attr, value):
        if attr in self.__slots__:
            if getattr(self, attr, None) is None:
                super(BaseExtComponent, self).__setattr__(attr, value)
            return

        if attr in self.deprecated_attrs:
            # предупреждение об устаревших атрибутах
            warn("\"%s.%s\" is deprecated!" % (self.__class__.__name__, attr),
                 UserWarning, stacklevel=2)

        # компонентам проставляется itemId
        is_component = isinstance(value, BaseExtComponent)
        if is_component:
            value.item_id = attr

        if self.js_attrs.maps(attr):
            storage = '_config'
        # атрибуты, существующие только в python
        elif attr.startswith('_') or is_component:
            storage = '_py_only'
        # всё прочее
        else:
            storage = '_data'
        super(BaseExtComponent, self).__getattribute__(storage)[attr] = value

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

    def __getstate__(self):
        return dict(self._config), self._data, self._py_only, self._configured

    def __setstate__(self, value):
        _config, _data, _py_only, _configured = value
        self._config.update(_config)
        self._py_only.update(_py_only)
        self._data.update(_data)
        self._configured.update(_configured)


class ExtUIComponent(BaseExtComponent):
    """
    Базовый класс для компонентов визуального интерфейса
    Наиболее походит на BoxComponent в ExtJS
    """
    js_attrs = BaseExtComponent.js_attrs.extend(
        'style',
        'hidden',
        'height',
        'width',
        'x',
        'y',
        'html',
        'region',
        'flex',
        'name',
        'anchor',
        'cls',
        min_width='minWidth',
        min_height='minHeight',
        auto_scroll='autoScroll',
        auto_width='autoWidth',
        auto_height='autoHeight',
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
