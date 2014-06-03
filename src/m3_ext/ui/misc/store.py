# coding:utf-8

from m3_ext.ui.base import BaseExtComponent
from base_store import BaseExtStore


class ExtDataStore(BaseExtStore):
    """
    Хранилище данных, которое не генерирует запрос на сервер,
    а принимает данные в массиве data, либо через метод load_data
    """

    _xtype = 'arraystore'

    js_attrs = BaseExtStore.js_attrs.extend(
        'data',
    )

    def __init__(self, data=None, *args, **kwargs):
        super(ExtDataStore, self).__init__(*args, **kwargs)
        self.setdefault('data', data)


class ExtJsonStore(BaseExtStore):
    """
    Хранилище данных, которое отправляет запрос на сервер и ждет, что данные
    вернуться в формате json
    """

    _xtype = 'jsonstore'

    js_attrs = BaseExtStore.js_attrs.extend(
        start='baseParams.start',  # Начальная позиция для показа, если используется постраничная навигация
        limit='baseParams.limit',  # Количество записей для показа, если используется постраничная навигация
        remote_sort='remoteSort'  # Использовать ли удаленную сортировку
    )

    def __init__(self, *args, **kwargs):
        super(ExtJsonStore, self).__init__(*args, **kwargs)
        self.setdefault('start', 0)


class ExtJsonWriter(BaseExtComponent):
    """
    Предназначен для отправки и преобразования
    новых и измененных записей Store на сервер
    """
    _xtype = None

    js_attrs = BaseExtComponent.js_attrs.extend(
        'encode',  # Если True, записи (records) переводится в хешированные данные,
        encode_delete='encodeDelete',  # Если False, при удалении будет отправляться только id записи на сервер
        write_all_fields='writeAllFields'  # Если True, то сохраняются все записи, а не только измененные
    )

    def __init__(self, *args, **kwargs):
        super(ExtJsonWriter, self).__init__(*args, **kwargs)
        self.setdefault('encode', True)
        self.setdefault('encode_delete', False)
        self.setdefault('write_all_fields', False)


class ExtGroupingStore(BaseExtStore):
    """
    Хранилище используемое для группировки по определенным полям в гриде
    """

    _xtype = 'm3-grouping-json-store'

    js_attrs = BaseExtStore.js_attrs.extend(
        remote_group='remoteGroup',  # Серверная группировка
        group_field='groupField',  # Имя поля, используемой для сортировки
        sort_info='sortInfo'  # Объект, в котором может указываться например порядок сортировки
    )

    deprecated_attrs = BaseExtStore.deprecated_attrs + (
        't_render_listeners',
    )

    def __init__(self, *args, **kwargs):
        super(ExtGroupingStore, self).__init__(*args, **kwargs)
        self.setdefault('remote_group', False)


class ExtMultiGroupingStore(ExtJsonStore):
    """
    Хранилище используемое для грида с множественной серверной группировкой
    """
    _xtype = 'm3-live-store'

    js_attrs = BaseExtStore.js_attrs.extend(
        'bufferSize',  # Размер буфера
        version_property='version',
    )

    def __init__(self, *args, **kwargs):
        super(ExtMultiGroupingStore, self).__init__(*args, **kwargs)
        self.setdefault('version_property', 'version')
        self.setdefault('bufferSize', 200)