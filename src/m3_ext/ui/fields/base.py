#coding:utf-8
"""
Created on 27.02.2010
"""

from m3_ext.ui.base import ExtUIComponent


class BaseExtField(ExtUIComponent):
    """
    Базовый класс для полей
    """

    _xtype = 'field'

    js_attrs = ExtUIComponent.js_attrs.extend(
        'value',
        'vtype',
        'regex',
        'plugins',

        'tooltip',
        'filterName',

        read_only='readOnly',
        allow_blank='allowBlank',
        is_edit='isEdit',
        empty_text='emptyText',
        min_length='minLength',
        min_length_text='minLengthText',
        max_length='maxLength',
        max_length_text='maxLengthText',
        regex_text='regexText',
        tab_index='tabIndex',
        invalid_class='invalidClass',
        invalid_text='invalidText',
        auto_create='autoCreate',
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtField, self).__init__(*args, **kwargs)

        # Нужно выставлять пустое значение для того, чтобы обязательные поля,
        # те, которые allow_blank=False подсвечивались автоматически после
        # рендеринга
        self.setdefault('value', '')

        self.setdefault('is_edit', True)
        self.setdefault('allow_blank', True)
        self.setdefault('invalid_class', 'm3-form-invalid')
        self.setdefault('plugins', [])

        # Ломает Checkbox
        # self.setdefault('auto_create', {
        #     "tag": "input",
        #     "type": "text",
        #     "size": "20",
        #     "autocomplete": "off"
        # })

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        if self in exclude_list or self.name in exclude_list:
            return
        self.read_only = access_off
        # Выключаем/включаем обязательность заполнения.
        if not hasattr(self, '_allow_blank_old'):
            self._allow_blank_old = self.allow_blank
        self.allow_blank = True if access_off else self._allow_blank_old


class BaseExtTriggerField(BaseExtField):
    """
    Базовый класс для комбобокса, поля выбора справочника
    """

    ALL = 'all'  # Признак, что отображаться при выборе будут все записи
    QUERY = 'query'  # Признак того, что отображаются только те записи, которые подходят по тексту

    _xtype = None  # Не определен

    js_attrs = BaseExtField.js_attrs.extend(
        'store',
        'editable',
        'mode',
        'resizable',  # Изменение ширины выпадающего списка

        display_field='displayField',  # Поле, которое будет отображаться при выборе
        value_field='valueField',  # Поле, которое будет использоваться в качестве значения
        hidden_name='hiddenName',
        name='hiddenName',  # deprecation: backwards compat - use hidden_name
        hide_trigger='hideTrigger',  # Скрыть триггера выподающего списка
        type_ahead='typeAhead',
        query_param='queryParam',
        page_size='pageSize',  # Количество записей, показываемых на странице
        max_heigth_dropdown_list='maxHeight',  # Максимальная высота выподаюего списка
        min_chars='minChars',  # Количество введенных символов, после которых произойдет запрос на сервер
        trigger_action='triggerAction',
        force_selection='forceSelection',
        not_found_text='valueNotFoundText',  # Отображаемый текст, если записей в сторе нет
        loading_text='loadingText',  # Отображаемый текст в момент загрузки данных
        list_width='listWidth',  # Ширина выпадающего списка
        list_tpl='tpl',  # Шаблон рендера выпадающего списка

    )

    deprecated_attrs = BaseExtField.deprecated_attrs + (
        'trigger_action_all',  # Use trigger_action
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtTriggerField, self).__init__(*args, **kwargs)
        self.setdefault('hide_trigger', False)
        self.setdefault('trigger_action', self.QUERY)
        self.setdefault('force_selection', False)
        self.setdefault('loading_text', u'Загрузка...')
        self.setdefault('resizable', False)

        # Поля, которые должны попасть в store
        self.setdefault('fields', [])




