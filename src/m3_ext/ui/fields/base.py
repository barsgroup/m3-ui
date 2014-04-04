#coding:utf-8
"""
Created on 27.02.2010

@author: akvarats
"""

from m3_ext.ui.base import ExtUIComponent
from m3_ext.ui.misc import ExtDataStore


class BaseExtField(ExtUIComponent):
    """
    Базовый класс для полей
    """

    # TODO: Реализовать override на стороне js-a
    # def t_render_regex(self):
    #     return '/%s/' % self.regex

    # TODO: Реализовать override на стороне js-a
    # Вызывалось в render_base_config
    #     if self.read_only:
    #         grey_cls = 'm3-grey-field'
    #         self.cls = grey_cls if not self.cls else self.cls + grey_cls

    # TODO: Реализовать override на стороне js-a
    # Вызывалось в render_base_config
    # дополнительно вешаем DOM-атрибуты через Ext.Field.autoCreate
    #     if self.max_length:
    #         self.auto_create.update({"maxlength": self.max_length})
    #         self._put_config_value('autoCreate', self.auto_create)

    _xtype = 'field'

    js_attrs = ExtUIComponent.js_attrs.extend(
        'value',
        'vtype',  # Тип валидации
        'regex',  # Валидация на регулярное вырожение
        'plugins',  # Плагины к полям ввода

        read_only='readOnly',  # Признак нередактируемости поля

        # Признак, что поле используется для изменения значения, а не для навигации
        # - при Истине будут повешаны обработчики на изменение окна
        # см. m3.js
        is_edit='isEdit',

        allow_blank='allowBlank',  # Не обязательно для заполнения (True), иначе поле должно быть не пустым
        empty_text='emptyText',  # Этот текст будет выводиться, если поле незаполненно
        min_length='minLength',  # Минимальные длина поля
        min_length_text='minLengthText',  # Текст ошибки, если минимальная длина была превышена
        max_length='maxLength',  # Максимальные длина поля
        max_length_text='maxLengthText',  # Текст ошибки, если максимальная длина была превышена
        regex_text='regexText',  # Текст ошибки, если валидация на регулярку будет нарушена
        tab_index='tabIndex',  # Порядок обхода для этого поля
        invalid_class='invalidClass',  # Свой CSS класс валидации для некорректно заполненного поля
        invalid_text='invalidText',  # Текст, который будет отображаться, если поле заполненно некорректно
        auto_create='autoCreate',  # Дополнительные DOM-атрибуты

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
        self.setdefault('auto_create', {
            "tag": "input",
            "type": "text",
            "size": "20",
            "autocomplete": "off"
        })

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

    ALL = 'all'
    QUERY = 'query'

    def __init__(self, *args, **kwargs):
        super(BaseExtTriggerField, self).__init__(*args, **kwargs)

        # Поле, которое будет отображаться при выборе
        self.display_field = None

        # Поле, которое будет использоваться в качестве значения
        self.value_field = None

        #
        self.hidden_name = None

        # Скрыть триггера выподающего списка
        self.hide_trigger = False

        #
        self.type_ahead = False

        #
        self.query_param = None

        # Количество записей, показываемых на странице
        self.page_size = None

        # Максимальная высота выподаюего списка
        self.max_heigth_dropdown_list = None

        # Количество введенных символов,
        # после которых произойдет запрос на сервер
        self.min_chars = None

        # Ссылка на хранилище данных
        self.__store = None

        #
        self.mode = None

        # Признак возможности редактирования
        self.editable = True

        # Признак, что отображаться при выборе будут все записи (QUERY),
        # Иначе те, которые подходят введенному тексту (ALL)
        self.trigger_action = BaseExtTriggerField.QUERY

        #
        self.force_selection = False

        # Текст, если записей в сторе нет
        self.not_found_text = None

        # Текст, отображаемый при загрузке данных
        self.loading_text = u'Загрузка...'

        # иные имена полей (кроме id и display_field),
        # которые будут попадать в store
        self.fields = []

        # ширина выпадающего списка
        self.list_width = None

        # шаблон рендера выпадающего списка
        self.list_tpl = None

        # изменение ширины выпадающего списка
        self.resizable = False

    def set_store(self, store):
        self.mode = 'local' if isinstance(store, ExtDataStore) else 'remote'
        self.__store = store

    def get_store(self):
        return self.__store

    store = property(get_store, set_store)

    def t_render_store(self):
        assert self.__store, 'Store is not define'
        # отрисуем стор с полями
        if self.display_field in self.fields:
            return self.__store.render(self.fields)
        else:
            return self.__store.render([self.display_field] + self.fields)

    @property
    def trigger_action_all(self):
        """
        Для обратной совместимости
        """
        return self.trigger_action == BaseExtTriggerField.ALL

    @trigger_action_all.setter
    def trigger_action_all(self, value):
        """
        Для обратной совместимости
        """
        self.trigger_action = BaseExtTriggerField.ALL if value else \
            BaseExtTriggerField.QUERY

    @property
    def name(self):
        return self.hidden_name

    @name.setter
    def name(self, value):
        self.hidden_name = value

    @property
    def handler_change(self):
        return self._listeners.get('change')

    @handler_change.setter
    def handler_change(self, function):
        self._listeners['change'] = function

    @property
    def handler_select(self):
        return self._listeners.get('select')

    @handler_select.setter
    def handler_select(self, function):
        self._listeners['select'] = function

    @property
    def handler_afterrender(self):
        return self._listeners.get('afterrender')

    @handler_afterrender.setter
    def handler_afterrender(self, function):
        self._listeners['afterrender'] = function

    def pre_render(self):
        if self.get_store():
            self.get_store().action_context = self.action_context
        super(BaseExtTriggerField, self).pre_render()

    def render_base_config(self):
        self.pre_render()

        super(BaseExtTriggerField, self).render_base_config()

        for args in (
                ('displayField', self.display_field),
                ('valueField', self.value_field),
                ('hiddenName', self.hidden_name),
                ('hideTrigger', self.hide_trigger),
                ('typeAhead', self.type_ahead),
                ('queryParam', self.query_param),
                ('pageSize', self.page_size),
                ('maxHeight', self.max_heigth_dropdown_list),
                ('minChars', self.min_chars),
                ('mode', self.mode),
                ('triggerAction', self.trigger_action),
                ('editable', self.editable),
                ('forceSelection', self.force_selection),
                ('valueNotFoundText', self.not_found_text),
                ('loadingText', self.loading_text),
                ('store', self.t_render_store, self.get_store()),
                ('listWidth', self.list_width, self.list_width),
                ('tpl', self.list_tpl, self.list_tpl),
                ('resizable', self.resizable, self.resizable),
        ):
            self._put_config_value(*args)
