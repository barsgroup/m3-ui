#coding:utf-8
"""
"""
import os

from django.conf import settings

from m3_ext.ui.misc import ExtJsonStore
from m3_ext.ui.fields.base import BaseExtTriggerField

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

        hide_clear_trigger='hideTriggerClear',  # Скрыть кнопку очистки
        hide_edit_trigger='hideTriggerDictEdit',  # Скрыть кнопку редактирования элемента
        hide_dict_select_trigger='hideTriggerDictSelect',  # Скрыть кнопку выбора из справочника

        ask_before_deleting='askBeforeDeleting',
        default_text='defaultText',
        value='defaultValue',
        record_value='defaultRecord',  # Значение, которое будет передано в store

        url='actionSelectUrl',
        edit_url='actionEditUrl',
        autocomplete_url='autocompleteUrl',

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
    )

    def __init__(self, *args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)

        self.setdefault('record_value', {})
        self.setdefault('hide_clear_trigger', False)
        self.setdefault('hide_edit_trigger', False)
        self.setdefault('hide_dict_select_trigger', False)
        self.setdefault('min_chars', 2)
        self.setdefault('store', ExtJsonStore(total_property='total',
                                              root='rows'))
        self.setdefault('query_param', 'filter')

        self.setdefault('value_field', 'id')
        self.setdefault('display_field', 'name')

        self.setdefault('pack', None)


class ExtSearchField(BaseExtField):
    """Поле поиска"""

    _xtype = 'm3-search-field'

    js_attrs = BaseExtField.js_attrs.extend(

        component_item_id='componentItemId',
        query_param='paramName',
        empty_text='emptyText',
    )


class ExtFileUploadField(BaseExtField):
    """
    Компонент загрузки файлов на сервер.
    """

    # Префикс добавляется к скрытому полю, где передается файл
    PREFIX = 'file_'

    _xtype = 'fileuploadfield'

    js_attrs = BaseExtField.js_attrs.extend(

        file_url='fileUrl',
        possible_file_extensions='possibleFileExtensions',
        prefix='prefixUploadField',
        read_only='readOnlyButton',

    )

    def __init__(self, *args, **kwargs):
        super(ExtFileUploadField, self).__init__(*args, **kwargs)
        self.setdefault('prefix', self.PREFIX)
        self.setdefault('possible_file_extensions', ())

        # Привязка к файлу
        self.memory_file = None


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

    _xtype = 'imageuploadfield'

    js_attrs = ExtFileUploadField.js_attrs.extend(

        'thumbnail',
        thumbnail_size='thumbnailSize',
        prefix='prefixThumbnailImg',

    )

    def __init__(self, *args, **kwargs):
        super(ExtImageUploadField, self).__init__(*args, **kwargs)
        self.setdefault('thumbnail_size', (300, 300))
        self.setdefault('thumbnail', True)
        self.setdefault('width', 300)  # Умолчательный параметр, иначе контрол разъедется
        self.setdefault('possible_file_extensions',
                        ('png', 'jpeg', 'gif', 'bmp', 'jpg'))  # начальные допустимые расширения
        self.setdefault('prefixThumbnailImg', ExtImageUploadField.MIN_THUMBNAIL_PREFIX)

        # Используется в биндинге helpers/to_object
        self.middle_thumbnail_size = self.max_thumbnail_size = self.min_thumbnail_size = None

        # Высота и ширина изображения. Изображение будет подгоняться под
        # эту высоту
        self.image_max_size = (600, 600)


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

    _xtype = 'm3-multiselect'

    js_attrs = ExtDictSelectField.js_attrs.extend(
        'delimeter',
        multiple_display_value='multipleDisplayValue',
    )

    def __init__(self, *args, **kwargs):
        super(ExtMultiSelectField, self).__init__(*args, **kwargs)
        self.setdefault('value', [])