#coding: utf-8
"""
Created on 27.02.2010

@author: akvarats
@author: prefer
"""

from django.conf import settings

from m3 import date2str
from base import BaseExtField, BaseExtTriggerField


class ExtStringField(BaseExtField):
    """
    Поле ввода простого текстового значения
    """

    # TODO: необходимо перенести функциональность Ext.ux.Mask
    # Вызывалось в render_base_config
    # if self.input_mask:
    #   self.plugins.append("new Ext.ux.Mask('%s')" % self.input_mask)

    # TODO: Проверить работу кода
    # Вызывалось в render_base_config
    #     if self.value:
    #         self.value = self.value.replace('\\', '\\\\')

    # TODO: Написать override для mask_re
    # def t_render_mask_re(self):
    #     return '/%s/' % self.mask_re

    _xtype = "textfield"

    js_attrs = BaseExtField.js_attrs.extend(
        input_type='inputType',
        mask_re='maskRe',
        select_on_focus='selectOnFocus',
        enable_key_events='enableKeyEvents'
    )

    def __init__(self, *args, **kwargs):

        super(ExtStringField, self).__init__(*args, **kwargs)
        self.setdefault('enable_key_events', False)


class ExtDateField(BaseExtField):
    """
    Поле ввода даты
    """
    _xtype = "datefield"

    js_attrs = BaseExtField.js_attrs.extend(
        'editable', # Признак возможности редактирования,
        'format',
        start_day="startDay", # атрибут задает с какого дня начинается неделя в календаре.
                    # 0-Воскресенье, 1-Понедельник, 2-Вторник и т.д.
        hide_today_btn="hideTodayBtn",  # Прятать кнопку "Сегодняшняя дата"
        enable_key_events="enableKeyEvents", # Разрешает перехват нажатий клавиш
        max_value="maxValue", # Максимальная возможная дата
        min_value="minValue" # Минимально возможная дата
    )

    def get_format(self):

        default_format = 'd.m.Y'

        try:
            format_ = settings.DATE_FORMAT.replace('%', '')
        except:
            format_ = default_format

        return format_

    def __init__(self, *args, **kwargs):
        super(ExtDateField, self).__init__(*args, **kwargs)

        self.setdefault('start_day', 1)
        self.setdefault('hide_today_btn', False)
        self.setdefault('enable_key_events', False)
        self.setdefault('max_value', None)
        self.setdefault('min_value', None)
        self.setdefault('format', self.get_format())
        self.setdefault('editable', True)


class ExtNumberField(BaseExtField):
    """
    Поле ввода числового значения
    """
    _xtype = "numberfield"

    js_attrs = BaseExtField.js_attrs.extend(
        decimal_separator="decimalSeparator",
        allow_decimals="allowDecimals",
        allow_negative="allowNegative",
        decimal_precision="decimalPrecision",
        max_value="maxValue",
        max_text="maxText",
        min_value="minValue",
        min_text="minText",
        enable_key_events="enableKeyEvents",
        select_on_focus="selectOnFocus"
    )


#===============================================================================
class ExtHiddenField(BaseExtField):
    """
    Скрытое поле, которое не видно пользователю на форме, но хранит значение
    и передает его при submit'е"""

    # Тип поля - integer
    INT = 0
    # Тип поля - string
    STRING = 1

    _xtype = "hidden"

    def __init__(self, *args, **kwargs):
        super(ExtHiddenField, self).__init__(*args, **kwargs)

        # TODO: Необходимо отрефакторить под внутриклассовый рендеринг
        self.setdefault('template', 'ext-fields/ext-hidden-field.js')

        # Тип поля
        self.setdefault('type', ExtHiddenField.INT)


class ExtTextArea(BaseExtField):
    """
    Большое :) Текстовое поле
    """
    _xtype = 'textarea'

    js_attrs = BaseExtField.js_attrs.extend(
        auto_create="autoCreate",
        input_type='inputType',
        mask_re='maskRe',
        select_on_focus='selectOnFocus',
        enable_key_events='enableKeyEvents'
    )

    def __init__(self, *args, **kwargs):
        super(ExtTextArea, self).__init__(*args, **kwargs)

        # Фильтр допустимых символов по регекспу
        self.setdefault('mask_re', None)

        # DOM-атрибуты
        self.setdefault('auto_create',
            {"tag": "textarea", "autocomplete": "off"}
        )
#FIXME
#    def t_render_mask_re(self):
#        return '/%s/' % self.mask_re
#FIXME
#    def render_base_config(self):
#        if self.value:
#            self.value = escapejs(self.value)
#        super(ExtTextArea, self).render_base_config()
#        self._put_config_value('maskRe', self.t_render_mask_re, self.mask_re)


class ExtCheckBox(BaseExtField):
    """
    Галочка выбора значения
    """
    _xtype = "checkbox"

    js_attrs = BaseExtField.js_attrs.extend(
        'template', 'checked',
        box_label="boxLabel"
    )

    def __init__(self, *args, **kwargs):
        super(ExtCheckBox, self).__init__(*args, **kwargs)

        self.setdefault('template', 'ext-fields/ext-checkbox.js')
        self.setdefault('checked', False)
        self.setdefault('box_label', None)
        self._config['autoCreate'] = None

#        #TODO: Необходимо отрефакторить под внутриклассовый рендеринг
#        self.template = 'ext-fields/ext-checkbox.js'
#
#        # Признак того, что значение выбрано
#        self.checked = False
#
#        # Текст рядом с полем выбора значения
#        self.box_label = None

#        self.init_component(*args, **kwargs)

#    @property
#    def handler_check(self):
#        return self._listeners.get('check')
#
#    @handler_check.setter
#    def handler_check(self, function):
#        self._listeners['check'] = function
#
#    def _make_read_only(self, access_off=True, *args, **kwargs):
#        self.read_only = access_off


class ExtRadio(BaseExtField):
    """
    Радио-поле
    """
    _xtype="radio"

    js_attrs = BaseExtField.js_attrs.extend(
        'checked',        # Признак того, что значение выбрано
        box_label='boxLabel'    # Текст рядом с полем выбора значения
    )

    def __init__(self, *args, **kwargs):
        super(ExtRadio, self).__init__(*args, **kwargs)
#        self._ext_name = 'Ext.form.Radio'
        self.setdefault('checked', False)
        self.setdefault('box_label', None)

#    def render_base_config(self):
#        value = self.value
#        self.value = None
#        super(ExtRadio, self).render_base_config()
#        if self.checked:
#            self._put_config_value('checked', True)
#        if self.box_label:
#            self._put_config_value('boxLabel', self.box_label)
#        self._put_config_value('inputValue', value)

#    def render(self):
#        try:
#            self.render_base_config()
#        except UnicodeDecodeError as msg:
#            raise Exception(msg)
#
#        base_config = self._get_config_str()
#        return 'new %s({%s})' % (self._ext_name, base_config)


class ExtComboBox(BaseExtTriggerField):
    """
    Поле выпадающий список - combobox
    """

    def __init__(self, *args, **kwargs):
        super(ExtComboBox, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)

    def render(self):
        try:
            self.render_base_config()

        except UnicodeDecodeError as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        return 'new Ext.form.ComboBox({%s})' % base_config


#===============================================================================
class ExtTimeField(BaseExtField):
    """
    Поле ввода времени
    """
    _xtype = "timefield"

    js_attrs = BaseExtField.js_attrs.extend(
        # Формат отображения времени
        'format',
        # Шаг повышения времени
        'increment',
        # max и min допустимые значения времени. Задаются только в виде строки,
        # т.к. форматы времени в python'e и javascript'e разные
        max_value='maxValue',
        min_value='minValue'
    )

    def __init__(self, *args, **kwargs):

        super(ExtTimeField, self).__init__(*args, **kwargs)
        self.setdefault('format', 'H:i:s')

        self.setdefault('increment', 15)
        self.setdefault('min_value', None)
        self.setdefault('max_value', None)


class ExtHTMLEditor(BaseExtField):
    """
    Поле HTML-редактор
    """
    _xtype="htmleditor"


class ExtDisplayField(BaseExtField):
    """
    Поле отображающее значение (не проверяется и не сабмитится)
    """
    _xtype = "displayfield"

    #FIXME - доделать и протестировать
#    def render_base_config(self):
#        super(ExtDisplayField, self).render_base_config()
#
#        # Для данного класса установка дополнительно css класса при read_only -
#        # излишне
#        if self.read_only:
#            self._set_config_value('cls', None)


class ExtDateTimeField(ExtDateField):
    """
    Поле ввода даты-времени
    """
    _xtype="datetimefield"



class ExtAdvTimeField(BaseExtField):
    """
    Поле ввода времени с дополнительными ползунками
    """
    _xtype = "advtimefield"

