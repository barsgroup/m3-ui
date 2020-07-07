# coding: utf-8
from __future__ import absolute_import

import json
import os
import weakref

from django.conf import settings
from django.utils.html import escapejs
from m3 import actions
from m3.actions import ControllerCache
from m3.actions.interfaces import IMultiSelectablePack
from m3.actions.interfaces import ISelectablePack

from m3_ext.ui.base import BaseExtComponent
from m3_ext.ui.base import ExtUIComponent
from m3_ext.ui.fields.base import BaseExtTriggerField
from m3_ext.ui.misc import ExtJsonStore
import six

from .base import BaseExtField


#==============================================================================
class ExtDictSelectField(BaseExtTriggerField):
    """
    Поле с выбором из справочника
    """
    class ExtTrigger(BaseExtComponent):
        def __init__(self, *args, **kwargs):
            self.icon_cls = None
            self.handler = None
            self.init_component(*args, **kwargs)

        def render(self):
            res = 'iconCls: "%s"' % (self.icon_cls if self.icon_cls else '')
            res += ',handler: %s' % self.handler if self.handler else ''
            return res

    def __init__(self, *args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)

        # Эти атрибуты отвечают за отображение кнопок действий в строке выбора:
        # Выпадающий список
        self.hide_trigger = True
        # Очистка поля
        self.hide_clear_trigger = False
        # Редактирование выбранного элемента
        self.hide_edit_trigger = False
        # Выбора из справочника
        self.hide_dict_select_trigger = False

        # количество знаков, с которых начинаются запросы на autocomplete
        self.min_chars = 2

        self.set_store(ExtJsonStore())

        #self.width = 150
        self.default_text = None

        self.ask_before_deleting = True

        self.url = None
        self.edit_url = None
        self.autocomplete_url = None

        # это взято из магического метода configure_edit_field
        # из mis.users.forms
        self.value_field = 'id'
        # и это тоже взято оттуда же
        self.query_param = 'filter'
        # по умолчанию отображаем значение поля name
        self.display_field = 'name'

        # Из-за ошибки убраны свойства по умолчанию
        self.total = 'total'
        self.root = 'rows'

        # значение, которое будет передано в store
        self.__record_value = {}

        self._triggers = []

        self._pack = None

        self.init_component(*args, **kwargs)

        # внутренние переменные
        self.__action_select = None
        self.__action_data = None

    @property
    def handler_afterselect(self):
        return self._listeners.get('afterselect')

    @handler_afterselect.setter
    def handler_afterselect(self, function):
        self._listeners['afterselect'] = function

    @property
    def handler_beforerequest(self):
        return self._listeners.get('beforerequest')

    @handler_beforerequest.setter
    def handler_beforerequest(self, function):
        self._listeners['beforerequest'] = function

    @property
    def handler_changed(self):
        return self._listeners.get('changed')

    @handler_changed.setter
    def handler_changed(self, function):
        self._listeners['changed'] = function

    #==========================================================================
    # Экшены для управления процессом работы справочника
    #==========================================================================

    #==========================================================================
    #  Получение окна выбора значения
    def _get_action_select(self):
        return self.__action_autocomplete

    def _set_action_select(self, value):
        self.__action_autocomplete = value
        if isinstance(value, actions.Action):
            self.autocomplete_url = value.get_absolute_url()
    action_select = property(
        _get_action_select,
        _set_action_select,
        doc=(
            'Действие, которое используется '
            'для получения окна выбора значения'
        ))
    #==========================================================================

    #==========================================================================
    # Получение списка для получения списка значений
    # (используется в автозаполнении)
    def _get_action_data(self):
        return self.__action_data

    def _set_action_data(self):
        return self.__action_data
    action_data = property(
        _get_action_data,
        _set_action_data,
        doc=(
            'Действие для получения списка '
            'строковых значений для '
        ))
    #==========================================================================

    @property
    def url(self):
        return self.__url

    @url.setter
    def url(self, value):
        self.__url = value

    @property
    def edit_url(self):
        return self.__edit_url

    @edit_url.setter
    def edit_url(self, value):
        self.__edit_url = value

    @property
    def autocomplete_url(self):
        return self.__autocomplete_url

    @autocomplete_url.setter
    def autocomplete_url(self, value):
        if value:
            self.editable = True
            self.get_store().url = value
        self.__autocomplete_url = value

    @property
    def record_value(self):
        return self.__record_value

    @record_value.setter
    def record_value(self, val):
        self.__record_value = val

    @property
    def value(self):
        return self.__value

    @value.setter
    def value(self, val):
        self.__value = val

    def configure_by_dictpack(self, pack, controller=None):
        """
        Метод настройки поля выбора из справочника на основе
        переданного ActionPack работы со справочниками.
        @param pack: Имя класса или класс пака.
        @controller: Контроллер в котором будет искаться пак.
        Если не задан, то ищем во всех.
        @deprecated: 0.4
        """
        registered_pack = ControllerCache.find_pack(pack)
        if not registered_pack:
            raise Exception(
                'Pack %s not found!' % pack
            )
        self.url = registered_pack.get_select_url()
        self.autocomplete_url = registered_pack.rows_action.get_absolute_url()
        # TODO: можно ли обойтись без bind_back?
        self.bind_pack = registered_pack

    def set_value_from_model(self, obj):
        """
        Устанавливает значения value и default_text по экземпляру модели obj.
        Причем они могут быть методами, например обернутыми json_encode.
        Это позволяет избежать двойного присваивания в коде.
        """

        value = getattr(obj, self.value_field)
        self.value = escapejs(value() if callable(value) else value)

        value = getattr(obj, self.display_field)
        self.default_text = value() if callable(value) else value

        # также запомним объект как значение
        # будем брать только те атрибуты, которые есть в fields
        attr_set = set(self.fields)
        attr_set.add(self.value_field)
        attr_set.add(self.display_field)
        self.__record_value = {}
        for attr in attr_set:
            value = getattr(obj, attr, None)
            self.__record_value[attr] = value() if callable(value) else value

    @property
    def pack(self):
        return self._pack

    @pack.setter
    def pack(self, ppack):
        self._set_urls_from_pack(ppack)

    @property
    def total(self):
        return self.get_store().total_property

    @total.setter
    def total(self, value):
        self.get_store().total_property = value

    @property
    def root(self):
        return self.get_store().root

    @root.setter
    def root(self, value):
        self.get_store().root = value

    def add_trigger(self, *args, **kwargs):
        self._triggers.append(ExtDictSelectField.ExtTrigger(*args, **kwargs))

    def t_render_triggers(self):
        return '[%s]' % ','.join(
            ['{%s}' % item.render() for item in self._triggers])

    def _set_urls_from_pack(self, ppack):
        """
        Настраивает поле выбора под указанный экшенпак ppack.
        Причем в качестве аргумента может быть как сам класс пака,
        так и имя. Это связано с тем, что не во всех формах можно
        импортировать паки и может произойти кроссимпорт.
        Поиск пака производится по всем экшенконтроллерам в системе.
        Используется первый найденный, т.к. при правильном дизайне
        один и тот же пак не должен быть в нескольких
        контроллерах одновременно.
        @param ppack: Имя класса пака или класс пака.
        """
        assert isinstance(ppack, six.string_types) or hasattr(ppack, '__bases__'), (
            'Argument %s must be a basestring or class' % ppack)
        ppack = ControllerCache.find_pack(ppack)
        assert ppack, 'Pack %s not found in ControllerCache' % ppack
        assert isinstance(ppack, ISelectablePack), (
            'Pack %s must provide ISelectablePack interface' % ppack)
        self._pack = ppack

        # старый спосом подключения Pack теперь не действует
        # - всё должно быть в рамках интерфейса ISelectablePack

        # url формы редактирования элемента
        self.edit_url = ppack.get_edit_url()
        # url автокомплита и данных
        self.autocomplete_url = ppack.get_autocomplete_url()
        # url формы выбора
        self.url = ppack.get_select_url()

    def render_params(self):
        action_context = None
        # FIXME: Почему то нет в конструкторе.
        if self.action_context:
            # функция
            action_context = self.action_context.json

        for args in (
            ('askBeforeDeleting', self.ask_before_deleting),
            ('actions', {
                'actionSelectUrl': self.url,
                'actionEditUrl': self.edit_url,
                'contextJson':  action_context}),
            ('defaultText', self.default_text),
            ('hideClearTrigger', self.hide_clear_trigger),
            ('hideEditTrigger', self.hide_edit_trigger),
            ('hideDictSelectTrigger', self.hide_dict_select_trigger),
            ('defaultValue', self.value),
            ('customTriggers', self.t_render_triggers, self._triggers),
            ('recordValue', json.dumps(self.record_value), self.record_value),
        ):
            self._put_params_value(*args)

    def render(self):
        self.render_base_config()
        self.render_params()

        base_config = self._get_config_str()
        params = self._get_params_str()
        return 'createAdvancedComboBox({%s},{%s})' % (base_config, params)


#==============================================================================
class ExtDictSelectScrollField(ExtDictSelectField):
    """
    Поле с выбором из справочника c динамическим обновлением списка при прокрутке
    """

    def render(self):
        super(ExtDictSelectScrollField, self).render()

        base_config = self._get_config_str()
        params = self._get_params_str()
        return 'createAdvancedScrollComboBox({%s},{%s})' % (base_config, params)

#==============================================================================
class ExtSearchField(BaseExtField):
    """Поле поиска"""
    def __init__(self, *args, **kwargs):
        super(ExtSearchField, self).__init__(*args, **kwargs)
        self.query_param = None
        self.empty_text = None
        self.__component_for_search = None
        self.init_component(*args, **kwargs)

    @property
    def component_for_search(self):
        if self.__component_for_search is not None:
            return self.__component_for_search()

    @component_for_search.setter
    def component_for_search(self, value):
        self.__component_for_search = weakref.ref(value)

    def render_base_config(self):
        super(ExtSearchField, self).render_base_config()
        self._put_params_value('paramName', self.query_param)
        self._put_params_value('emptyText', self.empty_text)

    def render(self):
        assert isinstance(self.component_for_search, ExtUIComponent)
        self.render_base_config()
        base_config = self._get_config_str()
        # Строка рендера как в шаблоне
        return (
            'new Ext.app.form.SearchField({%s, '
            'getComponentForSearch: function(){return Ext.getCmp("%s");}})'
        ) % (base_config, self.component_for_search.client_id)


#==============================================================================
class ExtFileUploadField(BaseExtField):
    """
    Компонент загрузки файлов на сервер.
    """

    # Префикс добавляется к скрытому полю, где передается файл
    PREFIX = 'file_'

    def __init__(self, *args, **kwargs):
        super(ExtFileUploadField, self).__init__(*args, **kwargs)
        self.file_url = None

        # Скрытие кнопок
        self.hide_clear_button = False
        self.hide_upload_button = False
        self.hide_download_button = False

        # Пример использования:
        # possible_file_extensions = ('png', 'jpeg', 'gif', 'bmp')

        #Пусто
        self.possible_file_extensions = ()
        self.init_component(*args, **kwargs)

        # Привязка к файлу
        self._memory_file = None
        # Флаг множественного выбора файлов
        self.multiple = False

    def render_possible_file_extensions(self):
        p = self.possible_file_extensions
        assert isinstance(p, (six.string_types, list, tuple)), (
            u'File extensions argument must be '
            u'type of basestring, tuple or list'
        )
        return ','.join(p) if not isinstance(p, six.string_types) else p

    def render_params(self):
        super(ExtFileUploadField, self).render_params()
        self._put_params_value('prefixUploadField', ExtFileUploadField.PREFIX)
        self._put_params_value('fileUrl', self.file_url)
        self._put_params_value('multiple', self.multiple)
        self._put_params_value('hideClearButton', self.hide_clear_button)
        self._put_params_value('hideUploadButton', self.hide_upload_button)
        self._put_params_value('hideDownloadButton', self.hide_download_button)
        self._put_params_value(
            'possibleFileExtensions', self.render_possible_file_extensions())

    def render(self):
        self.render_base_config()
        self.render_params()
        base_config = self._get_config_str()
        params_config = self._get_params_str()
        return 'new Ext.ux.form.FileUploadField({%s}, {%s})' % (
            base_config, params_config)

    @property
    def memory_file(self):
        return self._memory_file

    @memory_file.setter
    def memory_file(self, memory_file):
        self._memory_file = memory_file


#==============================================================================
class ExtImageUploadField(ExtFileUploadField):
    """
    Компонент загрузки изображений
    """
    MAX = 'max'
    MIN = 'min'
    MIDDLE = 'middle'
    THUMBNAIL_PREFIX = 'thumbnail_'
    MIN_THUMBNAIL_PREFIX = '%s_%s' % (MIN, THUMBNAIL_PREFIX)
    MIDDLE_THUMBNAIL_PREFIX = '%s_%s' % (MIDDLE, THUMBNAIL_PREFIX)
    MAX_THUMBNAIL_PREFIX = '%s_%s' % (MAX, THUMBNAIL_PREFIX)

    def __init__(self, *args, **kwargs):

        self.middle_thumbnail_size = (
            self.max_thumbnail_size) = self.min_thumbnail_size = None

        self.thumbnail_size = (300, 300)

        # Использовать ли миниатюры для изображений
        self.thumbnail = True

        # Высота и ширина изображения. Изображение будет подгоняться под
        # эту высоту
        self.image_max_size = (600, 600)

        super(ExtImageUploadField, self).__init__(*args, **kwargs)

        # Умолчательный параметр, иначе контрол разъедется
        self.width = 300
        # начальные допустимые расширения
        self.possible_file_extensions = ('png', 'jpeg', 'gif', 'bmp', 'jpg')

        self.init_component(*args, **kwargs)

    @property
    def thumbnail_size(self):
        return self.min_thumbnail_size

    @thumbnail_size.setter
    def thumbnail_size(self, value):
        self.min_thumbnail_size = value

    def render_params(self):
        super(ExtImageUploadField, self).render_params()
        self._put_params_value('thumbnail', self.thumbnail)
        if self.thumbnail:
            assert isinstance(self.thumbnail_size, tuple) and len(
                self.thumbnail_size) == 2
            self._put_params_value(
                'thumbnailWidth', self.min_thumbnail_size[0],
                self.thumbnail
            )
            self._put_params_value(
                'thumbnailHeight', self.min_thumbnail_size[1],
                self.thumbnail
            )
            self._put_params_value(
                'prefixThumbnailImg',
                ExtImageUploadField.MIN_THUMBNAIL_PREFIX,
                self.thumbnail
            )
            self._put_params_value('thumbnail', self.thumbnail)

    def render(self):
        self.render_base_config()
        self.render_params()
        base_config = self._get_config_str()
        params_config = self._get_params_str()
        return 'new Ext.ux.form.ImageUploadField({%s}, {%s})' % (
            base_config, params_config)

    @staticmethod
    def _prefix_by_type(type_img=None):
        if type_img == ExtImageUploadField.MIDDLE:
            return ExtImageUploadField.MIDDLE_THUMBNAIL_PREFIX
        elif type_img == ExtImageUploadField.MAX:
            return ExtImageUploadField.MAX_THUMBNAIL_PREFIX
        else:
            return ExtImageUploadField.MIN_THUMBNAIL_PREFIX

    @staticmethod
    def get_thumbnail_path(path, size=None):
        if os.path.exists(path):
            _dir = os.path.dirname(path)
            name = os.path.basename(path)
            prefix = ExtImageUploadField._prefix_by_type(size)
            return os.path.join(_dir, prefix + name)

    @staticmethod
    def get_thumbnail_url(name, type_img=None):
        """
        Возвращает url до thumbnail
        @param name: Имя
        @param size: Размер
        """
        base_url, file_name = os.path.split(name)
        prefix = ExtImageUploadField._prefix_by_type(type_img)
        return (
            '%s/%s' % (
                settings.MEDIA_URL,
                '%s/%s%s' % (
                    base_url,
                    prefix,
                    file_name
                ))).replace('//', '/')

    @staticmethod
    def get_image_url(name):
        return '%s/%s' % (settings.MEDIA_URL, name)


#==============================================================================
class ExtMultiSelectField(ExtDictSelectField):
    """
    Множественный выбор из справочника.
    Может использоваться также как стандартный ExtDictSelectField,
    При использовании следует обратить внимание,
    что биндиться к полям формы этот компонент не будет,
    тк в качестве value принимается список чего-либо,
    откуда на клиенте будут извлекаться объекты по value_field и display_field.
    Не рекомендуются передавать в value список моделей,
    тк все что передано будет преобразовано в json строку для
    отдачи на клиент, а от полной сериализации моделей хорошего мало.
    Лушче отдавать список словарей.

    Кроме того можно использовать как локальный комбокс с галочками,
    для этого достаточно задать Store методом
    set_store и в value, если нужно, передать список со значениями value_field.

    """
    def __init__(self, *args, **kwargs):
        self.delimeter = ','
        self.multiple_display_value = None
        self._value = ''
        self._init_flag = True
        self.editable = False

        super(ExtMultiSelectField, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
        self.hidden_name = self.client_id

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        if self._init_flag:
            self._init_flag = False
            return

        if not value:
            value = []

        if isinstance(value, six.string_types):
            value = json.loads(value)

        if isinstance(value, (list, tuple)):
            self._value = json.dumps(value)
        else:
            raise TypeError(
                u'ExtMultiSelectField value must be list or tuple of values')

    @property
    def pack(self):
        return self._pack

    @pack.setter
    def pack(self, ppack):
        assert isinstance(ppack, six.string_types) or hasattr(ppack, '__bases__'), (
            'Argument %s must be a basestring or class' % ppack)
        ppack_class = ControllerCache.find_pack(ppack)
        assert isinstance(ppack_class, IMultiSelectablePack), (
            'Pack %s must provide IMultiSelectablePack interface' % ppack)
        self._set_urls_from_pack(ppack)
        self.url = self._pack.get_multi_select_url()

    def render(self):
        self.render_base_config()
        self.render_params()

        base_config = self._get_config_str()
        params = self._get_params_str()
        return 'new Ext.m3.MultiSelectField({%s}, {%s})' % (
            base_config, params)

    def render_base_config(self):
        self.pre_render()

        super(ExtMultiSelectField, self).render_base_config()
        self._put_config_value('delimeter', self.delimeter)
        if self.multiple_display_value:
            self._put_config_value(
                'multipleDisplayValue', self.multiple_display_value)
        self._put_config_value('delimeter', self.delimeter)
