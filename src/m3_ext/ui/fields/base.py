#coding:utf-8
"""
Created on 27.02.2010

@author: akvarats
"""

from m3_ext.ui.base import ExtUIComponent


class BaseExtField(ExtUIComponent):
    """
    Базовый класс для полей
    """

    # FIXME: Реализовать override на стороне js-a
    # def t_render_regex(self):
    #     return '/%s/' % self.regex

    # FIXME: Реализовать override на стороне js-a
    # Вызывалось в render_base_config
    #     if self.read_only:
    #         grey_cls = 'm3-grey-field'
    #         self.cls = grey_cls if not self.cls else self.cls + grey_cls

    # FIXME: Реализовать override на стороне js-a
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

    # FIXME: атрибут mode - удалено, так как не используется в js
    # Использовался
    # def set_store(self, store):
    #     self.mode = 'local' if isinstance(store, ExtDataStore) else 'remote'
    #     self.__store = store


    # FIXME: Необходимо перенести на сторону js
    # иные имена полей (кроме id и display_field),
    # которые будут попадать в store
    # self.fields

    # FIXME: Разобраться с action_context
    # Был такой метод:
    # def pre_render(self):
    #     if self.get_store():
    #         self.get_store().action_context = self.action_context
    #     super(BaseExtTriggerField, self).pre_render()

    # FIXME: Необходимо в overrid'e использовать в качестве hiddenName значение name
    # Для поддержки обратной совместимости по коду
    # @property
    # def name(self):
    #     return self.hidden_name
    #
    # @name.setter
    # def name(self, value):
    #     self.hidden_name = value


    # FIXME: Необходимо перенести добавление колонок на сторону js
    #  def t_render_store(self):
    #     assert self.__store, 'Store is not define'
    #     # отрисуем стор с полями
    #     if self.display_field in self.fields:
    #         return self.__store.render(self.fields)
    #     else:
    #         return self.__store.render([self.display_field] + self.fields)

    ALL = 'all'  # Признак, что отображаться при выборе будут все записи
    QUERY = 'query'  # Признак того, что отображаются только те записи, которые подходят по тексту

    _xtype = None  # Не определен

    js_attrs = BaseExtField.js_attrs.extend(
        'store',
        'editable',
        'resizable',  # Изменение ширины выпадающего списка
        # 'fields',

        display_field='displayField',  # Поле, которое будет отображаться при выборе
        value_field='valueField',  # Поле, которое будет использоваться в качестве значения
        hidden_name='hiddenName',
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

    def __init__(self, *args, **kwargs):
        super(BaseExtTriggerField, self).__init__(*args, **kwargs)
        self.setdefault('hide_trigger', False)
        self.setdefault('trigger_action', self.QUERY)
        self.setdefault('force_selection', False)
        self.setdefault('loading_text', u'Загрузка...')
        self.setdefault('resizable', False)
        # self.setdefault('fields', [])  -- пока не работает

    @property
    def trigger_action_all(self):
        """
        deprecated
        Для обратной совместимости
        """
        return self.trigger_action == BaseExtTriggerField.ALL

    @trigger_action_all.setter
    def trigger_action_all(self, value):
        """
        deprecated
        Для обратной совместимости
        """
        self.trigger_action = BaseExtTriggerField.ALL if value else \
            BaseExtTriggerField.QUERY




