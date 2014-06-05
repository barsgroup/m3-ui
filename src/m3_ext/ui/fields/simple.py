#coding: utf-8
"""
"""

from django.conf import settings

from base import BaseExtField, BaseExtTriggerField


class ExtStringField(BaseExtField):
    """
    Поле ввода простого текстового значения
    """
    # FIXME: необходимо перенести функциональность Ext.ux.Mask
    # Вызывалось в render_base_config
    # if self.input_mask:
    #   self.plugins.append("new Ext.ux.Mask('%s')" % self.input_mask)

    # FIXME: Проверить работу кода
    # Вызывалось в render_base_config
    #     if self.value:
    #         self.value = self.value.replace('\\', '\\\\')

    _xtype = 'textfield'

    js_attrs = BaseExtField.js_attrs.extend(


        enable_key_events='enableKeyEvents',  # Разрешает перехват нажатий клавиш
        input_type='inputType',
        mask_re='maskRe',  # маска ввода, например "(###)###-##-##"
        select_on_focus='selectOnFocus',
        input_mask='inputMask',

    )

    def __init__(self, *args, **kwargs):
        super(ExtStringField, self).__init__(*args, **kwargs)
        self.setdefault('enable_key_events', False)


class ExtDateField(BaseExtField):
    """
    Поле ввода даты
    """

    # FIXME: Переписать в js-е функцию date2str
    # Вызывалось в render_base_config
    #     if isinstance(self.value, datetime) or isinstance(self.value, date):
    #         value = date2str(self.value)
    #     else:
    #         value = self.value

    _xtype = 'm3-date'

    js_attrs = BaseExtField.js_attrs.extend(
        'format',  # Формат даты
        'editable',  # Признак возможности редактирования

        # Атрибут задает с какого дня начинается неделя в календаре.
        # 0-Воскресенье, 1-Понедельник, 2-Вторник и т.д.
        start_day='startDay',

        hide_today_btn='hideTriggerToday',  # Прятать кнопку "Сегодняшняя дата"
        enable_key_events='enableKeyEvents',  # Разрешает перехват нажатий клавиш
        max_value='maxValue',  # Максимальная возможная дата
        min_value='minValue',  # Минимально возможная дата

    )

    def __init__(self, *args, **kwargs):
        super(ExtDateField, self).__init__(*args, **kwargs)
        self.setdefault('start_day', 1)
        self.setdefault('hide_today_btn', False)
        self.setdefault('enable_key_events', False)

        try:
            self.setdefault('format', settings.DATE_FORMAT.replace('%', ''))
        except:
            self.setdefault('format', 'd.m.Y')


class ExtNumberField(BaseExtField):
    """
    Поле ввода числового значения
    """

    _xtype = 'numberfield'

    js_attrs = BaseExtField.js_attrs.extend(

        decimal_separator='decimalSeparator',  # Разделитель целой и дробной части
        allow_decimals='allowDecimals',  # Признак, что может быть дробная часть
        allow_negative='allowNegative',  # Признак, что могут быть отрицательные значения
        decimal_precision='decimalPrecision',  # Точность дробной части
        max_value='maxValue',  # Маскимально возможное значение
        max_text='maxText',  # Если превышено максимально возможное значение, то будет отображаться этот текстs
        min_value='minValue',  # Минимальное возможное значение
        min_text='minText',  # Если превышено минимальное возможное значение, то будет отображаться этот текст
        enable_key_events='enableKeyEvents',  # Разрешает перехват нажатий клавиш
        select_on_focus='selectOnFocus',  # Выделение всего содержимого при попадании в фокус

    )

    def __init__(self, *args, **kwargs):
        super(ExtNumberField, self).__init__(*args, **kwargs)
        self.setdefault('allow_decimals', True)
        self.setdefault('allow_negative', True)
        self.setdefault('enable_key_events', False)
        self.setdefault('decimal_separator', '.')


class ExtHiddenField(BaseExtField):
    """
    Скрытое поле, которое не видно пользователю на форме, но хранит значение
    и передает его при submit'е"""

    _xtype = 'hidden'


class ExtTextArea(BaseExtField):
    """
    Большое :) Текстовое поле
    """

    _xtype = 'textarea'

    js_attrs = BaseExtField.js_attrs.extend(

        mask_re='maskRe',  # Фильтр допустимых символов по регекспу
        auto_create='autoCreate',  # DOM-атрибуты
    )

    def __init__(self, *args, **kwargs):
        super(ExtTextArea, self).__init__(*args, **kwargs)

        # Пусть пока это строчка будет закомиченна, так как в предыдущей версии
        # рендеринга autoCreate вообще не рендерилось!
        # Но! возможно какой-то прикладной код завязан как-то на эту конструкцию, что странно
        # FIXME: Проверить, есть ли прикладной код, завязанный на auto_create
        #self.setdefault('auto_create', {"tag": "textarea", "autocomplete": "off"})


class ExtCheckBox(BaseExtField):
    """
    Галочка выбора значения
    """

    _xtype = 'checkbox'

    js_attrs = BaseExtField.js_attrs.extend(
        'checked',  # Признак того, что значение выбрано
        box_label='boxLabel',  # Текст рядом с полем выбора значения

    )


class ExtRadio(BaseExtField):
    """
    Радио-поле
    """

    # FIXME: Был вот такой странный код, надо принять решение, что делать с ним дальше
    # def render_base_config(self):
    #     value = self.value
    #     self.value = None
    #     self._put_config_value('inputValue', value)

    _xtype = 'radio'

    js_attrs = BaseExtField.js_attrs.extend(
        'checked',
        box_label='boxLabel',
    )


class ExtComboBox(BaseExtTriggerField):
    """
    Поле выпадающий список - combobox
    """

    _xtype = 'm3-combobox'


class ExtTimeField(BaseExtField):
    """
    Поле ввода времени
    """

    _xtype = 'timefield'

    js_attrs = BaseExtField.js_attrs.extend(
        'format',  # Формат отображения времени
        'increment',  # Шаг повышения времени

        max_value='maxValue',  # max и min допустимые значения времени. Задаются только в виде строки,
        min_value='minValue',  # т.к. форматы времени в python'e и javascript'e разные
    )


class ExtHTMLEditor(BaseExtField):
    """
    Поле HTML-редактор
    """

    _xtype = 'htmleditor'


class ExtDisplayField(BaseExtField):
    """
    Поле отображающее значение (не проверяется и не сабмитится)
    """

    # FIXME: Перенести в override зависимость от read_only
    #     # Для данного класса установка дополнительно css класса при read_only -
    #     # излишне
    #     if self.read_only:
    #         self._set_config_value('cls', None)

    _xtype = 'displayfield'


class ExtDateTimeField(ExtDateField):
    """
    Поле ввода даты-времени
    """
    _xtype = "datetimefield"


class ExtAdvTimeField(BaseExtField):
    """
    Поле ввода времени с дополнительными ползунками
    """
    _xtype = "advtimefield"
