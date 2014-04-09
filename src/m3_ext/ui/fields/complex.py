#coding:utf-8
"""
Created on 27.02.2010

@author: prefer
"""
import os
import json

from django.conf import settings

from m3_ext.ui.misc import ExtJsonStore
from m3_ext.ui.fields.base import BaseExtTriggerField
from m3_ext.ui.base import ExtUIComponent
from m3.actions import ControllerCache
from m3.actions.interfaces import IMultiSelectablePack

from base import BaseExtField


class ExtDictSelectField(BaseExtTriggerField):
    """
    Поле с выбором из справочника
    """

    # FIXME: Удалено set_value_from_model
    # Необходимо использовать биндинг.
    # Заполнялся record_value

    # FIXME: Удалено configure_by_dictpack,
    # необходимо использовать атрибут pack

    _xtype = 'm3-select'

    js_attrs = BaseExtTriggerField.js_attrs.extend(

        hide_clear_trigger='params.hideClearTrigger',  # Скрыть кнопку очистки
        hide_edit_trigger='params.hideEditTrigger',  # Скрыть кнопку редактирования элемента
        hide_dict_select_trigger='params.hideDictSelectTrigger',  # Скрыть кнопку выбора из справочника

        ask_before_deleting='params.askBeforeDeleting',
        default_text='params.defaultText',
        value='params.defaultValue',
        record_value='params.recordValue',  # Значение, которое будет передано в store

        url='params.actions.actionSelectUrl',
        edit_url='params.actions.actionEditUrl',
    )

    deprecated_attrs = BaseExtTriggerField.deprecated_attrs + (

        # property:
        '_triggers',  # Судя по грепу по проектам - нигде не используется
        'action_select',  # Судя по грепу по проектам - нигде не импользовался
        'action_data',  # Судя по прошлому коду вообще не работал этот property
        'hide_trigger',  # Судя по исходнику нигде по коду не использовалась

        'handler_afterselect',  # Все хендлеры теперь необходимо навешивать в js-файле
        'handler_beforerequest',
        'handler_changed',

        'total',  # Нужно использовать доступ к store и установку атрибутов там
        'root',  # Нужно использовать доступ к store и установку атрибутов там

        'autocomplete_url',  # Нужно использовать доступ к store и установку url там
    )

    def __init__(self, *args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)

        self.setdefault('record_value', {})
        self.setdefault('hide_clear_trigger', False)
        self.setdefault('hide_edit_trigger', False)
        self.setdefault('hide_dict_select_trigger', False)
        self.setdefault('min_chars', 2)
        self.setdefault('store', ExtJsonStore())
        self.setdefault('query_param', 'filter')

        self.setdefault('value_field', 'id')
        self.setdefault('display_field', 'name')

        self.pack = None


    # FIXME: Перенести код ниже в M3JSONEncoder, и там будет сериализоваться пак
    # def _set_urls_from_pack(self, ppack):
    #     """
    #     Настраивает поле выбора под указанный экшенпак ppack.
    #     Причем в качестве аргумента может быть как сам класс пака,
    #     так и имя. Это связано с тем, что не во всех формах можно
    #     импортировать паки и может произойти кроссимпорт.
    #     Поиск пака производится по всем экшенконтроллерам в системе.
    #     Используется первый найденный, т.к. при правильном дизайне
    #     один и тот же пак не должен быть в нескольких
    #     контроллерах одновременно.
    #     @param ppack: Имя класса пака или класс пака.
    #     """
    #     assert isinstance(ppack, basestring) or hasattr(ppack, '__bases__'), (
    #         'Argument %s must be a basestring or class' % ppack)
    #     ppack = ControllerCache.find_pack(ppack)
    #     assert ppack, 'Pack %s not found in ControllerCache' % ppack
    #     assert isinstance(ppack, ISelectablePack), (
    #         'Pack %s must provide ISelectablePack interface' % ppack)
    #     self._pack = ppack
    #
    #     # старый спосом подключения Pack теперь не действует
    #     # - всё должно быть в рамках интерфейса ISelectablePack
    #
    #     # url формы редактирования элемента
    #     self.edit_url = ppack.get_edit_url()
    #     # url автокомплита и данных
    #     self.autocomplete_url = ppack.get_autocomplete_url()
    #     # url формы выбора
    #     self.url = ppack.get_select_url()


class ExtSearchField(BaseExtField):
    """Поле поиска"""
    def __init__(self, *args, **kwargs):
        super(ExtSearchField, self).__init__(*args, **kwargs)
        self.query_param = None
        self.empty_text = None
        self.component_for_search = None
        self.init_component(*args, **kwargs)

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

        # Пример использования:
        # possible_file_extensions = ('png', 'jpeg', 'gif', 'bmp')

        #Пусто
        self.possible_file_extensions = ()
        self.init_component(*args, **kwargs)

        # Привязка к файлу
        self._memory_file = None

    def render_possible_file_extensions(self):
        p = self.possible_file_extensions
        assert isinstance(p, (basestring, list, tuple)), (
            u'File extensions argument must be '
            u'type of basestring, tuple or list'
        )
        return ','.join(p) if not isinstance(p, basestring) else p

    def render_params(self):
        super(ExtFileUploadField, self).render_params()
        self._put_params_value('prefixUploadField', ExtFileUploadField.PREFIX)
        self._put_params_value('fileUrl', self.file_url)
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

        super(ExtMultiSelectField, self).__init__(*args, **kwargs)
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

        if isinstance(value, basestring):
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
        assert isinstance(ppack, basestring) or hasattr(ppack, '__bases__'), (
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
