# coding: utf-8
from __future__ import absolute_import

from decimal import Decimal
import abc
import datetime
import json

from m3_ext.ui import normalize
from m3_ext.ui.base import BaseExtComponent

from .base_store import BaseExtStore
import six


class ExtDataStore(BaseExtStore):
    """
    Хранилище данных, которое не генерирует запрос на сервер,
    а принимает данные в массиве data, либо через метод load_data
    """
    def __init__(self, data=None, *args, **kwargs):
        super(ExtDataStore, self).__init__(*args, **kwargs)

        # По умолчанию первым параметром передаются данные на заполнение store
        if data:
            self.data = data
        else:
            self.data = []

        self.reader = ExtArrayReader()

        self._id_property = 'id'

        self._root = None

        self._total_property = None

        # Для заполнения полей в шаблоне
        self.__columns = []

        self.init_component(*args, **kwargs)

    @property
    def id_property(self):
        return self.reader.id_property

    @id_property.setter
    def id_property(self, value):
        self.reader.id_property = value

    @property
    def root(self):
        return self.reader.root

    @root.setter
    def root(self, value):
        self.reader.root = value

    @property
    def total_property(self):
        return self.reader.total_property

    @total_property.setter
    def total_property(self, value):
        self.reader.total_property = value

    def render_base_config(self):

        super(ExtDataStore, self).render_base_config()

        self._put_config_value('reader', self.reader.render)

        self._put_config_value('data', self.render_data)

    def load_data(self, data):
        self.data = data

    def render(self, columns):

        self.reader._fields = columns

        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)

        base_config = self._get_config_str()

        return 'new Ext.data.Store({%s})' % base_config

    def render_data(self):
        return self.reader._render_data(self.data)


class ExtJsonStore(BaseExtStore):
    """
    Хранилище данных, которое отправляет запрос на сервер и ждет, что данные
    вернуться в формате json
    """
    def __init__(self, *args, **kwargs):
        super(ExtJsonStore, self).__init__(*args, **kwargs)
        # TODO: Отрефакторить под внутриклассовый рендеринг
        self.template = 'ext-misc/ext-json-store.js'

        # Для заполнения полей в шаблоне
        self.__columns = []

        # Начальная позиция для показа,
        # если используется постраничная навигация
        self.__start = 0

        # Количество записей для показа,
        # если используется постраничная навигация
        self.__limit = -1

        #
        self.total_property = None

        # Название вершины в json массиве, откуда будут браться записи
        # Например root = 'rows'
        # Тогда предполагаемый json массив должен выглядеть примерно так:
        # {rows: [id:1, name:'name', age:45]}
        self.root = None

        # Использовать ли удаленную сортировку
        self.remote_sort = False

        # Поле, откуда будет браться id записи
        self.id_property = 'id'

        self.init_component(*args, **kwargs)

    def render(self, columns):
        self.__columns = columns
        #self.__columns.insert(0, self.id_property)
        return super(ExtJsonStore, self).render()

    def t_render_fields(self):
        """
        Прописывается в шаблоне и заполняется при рендеринге
        """

        res = ['{name: "%s"}' % self.id_property]
        for col in self.__columns:
            if isinstance(col, six.string_types):
                if col != self.id_property:
                    res.append('{name: "%s"}' % col)
            else:
                if col.data_index != self.id_property:
                    d = {'name': col.data_index}
                    if hasattr(col, 'format'):  # ExtDateField
                        d['type'] = 'date'
                        d['dateFormat'] = col.format

                    res.append(json.dumps(d))
        return ','.join(res)

    def _get_start(self):
        return self.__start

    def _set_start(self, s):
        self.__start = s
        self._base_params['start'] = self.__start

    start = property(_get_start, _set_start)

    def _get_limit(self):
        return self.__limit

    def _set_limit(self, l):
        self.__limit = l
        self._base_params['limit'] = self.__limit

    limit = property(_get_limit, _set_limit)


class ExtJsonWriter(BaseExtStore):
    """
    Предназначен для отправки и преобразования
    новых и измененных записей Store на сервер
    """
    def __init__(self, *args, **kwargs):
        super(ExtJsonWriter, self).__init__(*args, **kwargs)

        # Если True, записи (records) переводится в хешированные данные,
        # имя беруться из ридера (Reader).
        # .. seealso::
        # Подробности http://extjs.docs/d/?class=Ext.data.JsonWriter
        self.encode = True

        # Если False, при удалении будет отправляться
        # только id записи на сервер
        self.encode_delete = False

        # Если True, то сохраняются все записи, а не только измененные
        self.write_all_fields = False

        self.init_component(*args, **kwargs)

    def render(self):
        result = '''
new Ext.data.JsonWriter({
    %(writeAllFields)s
    %(encode)s
    %(encodeDelete)s
})
''' % {
            'writeAllFields': (
                'writeAllFields: true' if self.write_all_fields else ''),
            'encode': 'encode: false' if not self.encode else '',
            'encodeDelete': 'encodeDelete: true' if self.encode_delete else ''}

        return result


class ExtDataReader(six.with_metaclass(abc.ABCMeta, BaseExtComponent)):
    """
    Получает ответ от сервера и декодирует его в  массив Record-ов
    """

    def __init__(self, *args, **kwargs):
        super(ExtDataReader, self).__init__(*args, **kwargs)

        # Поле, откуда будет браться идентификатор
        self.id_property = 'id'

        self.root = None

        self.total_property = None

        # Массив данных
        self._fields = []

        self.init_component(*args, **kwargs)

    def get_fields(self):
        return self._fields

    def set_fields(self, *args):

        for field in args:
            self._fields.append(field)

    def convert_value(self, value):
        """Конвертирует данные в JS строку."""
        if value is None:
            result = '""'
        elif isinstance(value, (int, float)):
            result = json.dumps(value)
        elif isinstance(value, Decimal):
            result = str(value)
        elif isinstance(value, datetime.date):
            result = 'new Date("%s")' % value.ctime()
        else:
            result = '"%s"' % normalize(value)

        return result

    @abc.abstractmethod
    def _render_data(self, data):
        """
        """

    @abc.abstractmethod
    def _render_fields(self):
        """
        """

    def render(self):

        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)


class ExtJsonReader(ExtDataReader):
    """
    Reader для данных типа JSON
    """

    def render_base_config(self):

        self._put_config_value('idProperty', self.id_property)
        self._put_config_value('root', self.root)
        self._put_config_value('totalProperty', self.total_property)

    def _render_data(self, data):
        res = []
        for item in data:

            res_tmp = []
            for key, value in item.items():
                res_value = self.convert_value(value)
                res_tmp.append('%s: %s' % (key, res_value))

            res_tmp = ','.join(res_tmp)
            res_tmp = '{%s}' % res_tmp
            res.append(res_tmp)
        return '[%s]' % ','.join(res)

    def _render_fields(self):

        res = [
            '{name: "%s", mapping: "%s"}' %
            (self.id_property, self.id_property)
        ]
        for col in self.get_fields():
            if isinstance(col, six.string_types):
                if col != self.id_property:
                    res.append('{name: "%s", mapping: "%s"}' % (col, col))
            else:
                if col.data_index != self.id_property:
                    d = {'name': col.data_index}
                    if hasattr(col, 'format'):  # ExtDateField
                        d['type'] = 'date'
                        d['dateFormat'] = col.format
                    if hasattr(col, 'mapping'):
                        d['mapping'] = col.mapping
                    else:
                        d['mapping'] = col.data_index

                    res.append(json.dumps(d))
        return 'Ext.data.Record.create([%s])' % ','.join(res)

    def render(self):
        super(ExtJsonReader, self).render()

        return 'new Ext.data.JsonReader({%s}, %s)' % (
            self._get_config_str(), self._render_fields())


class ExtArrayReader(ExtDataReader):
    """
    Reader для данных в виде обычного массива
    """

    def __init__(self, *args, **kwargs):

        self.id_index = 0
        super(ExtArrayReader, self).__init__(*args, **kwargs)

    def _render_data(self, data):
        res = []
        for item in data:
            res_tmp = []
            for subitem in item:

                res_value = self.convert_value(subitem)

                res_tmp.append(res_value)

            res.append('[%s]' % ','.join(res_tmp))

        return '[%s]' % ','.join(res)

    def _render_fields(self):
        """
        Прописывается в шаблоне и заполняется при рендеринге
        """
        res = [
            '{name: "%s", mapping: %d}' %
            (self.id_property, 0)
        ]  # ID
        # .. note::
        # чтобы правильно выставить mapping надо определить,
        # есть ли в списке колонок поле с таким же именем
        # если такая колонка встречается, то пропускаем её
        ind = 1
        for i, col in enumerate(self.get_fields()):
            if isinstance(col, six.string_types):
                if col != self.id_property:
                    res.append('{name: "%s", mapping: %d}' % (col, ind+i))
                else:
                    ind = 0
            else:
                if col.data_index != self.id_property:
                    # 1-ое поле - ID
                    d = {'name': col.data_index, 'mapping': ind+i}
                    if hasattr(col, 'format'):  # ExtDateField
                        d['type'] = 'date'
                        d['dateFormat'] = col.format
                    res.append(json.dumps(d))
                else:
                    ind = 0
        return 'Ext.data.Record.create([%s])' % ','.join(res)

    def render_base_config(self):

        self._put_config_value('idIndex', self.id_index)

    def render(self):
        super(ExtArrayReader, self).render()

        return 'new Ext.data.ArrayReader({%s}, %s)' % (
            self._get_config_str(), self._render_fields())


class ExtGroupingStore(ExtJsonStore):
    """
    Хранилище используемое для группировки по определенным полям в гриде
    """
    def __init__(self, *args, **kwargs):
        super(ExtGroupingStore, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-grouping-store.js'

        self.reader = None

        # Серверная группировка
        self.remote_group = False

        # Имя поля, используемой для сортировки
        self.group_field = None

        # Объект, в котором может указываться например порядок сортировки
        # .. seealso::
        # http://extjs.docs/d/?class=Ext.data.GroupingStore
        self.sort_info = None
        self.init_component(*args, **kwargs)


class ExtMultiGroupingStore(ExtJsonStore):
    """
    Хранилище используемое для грида с множественной серверной группировкой
    """
    def __init__(self, *args, **kwargs):
        super(ExtMultiGroupingStore, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-livegrid-store.js'
        self.version_property = 'version'
        self.bufferSize = 200
        self.init_component(*args, **kwargs)
