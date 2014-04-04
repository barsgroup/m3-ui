#coding: utf-8
"""
Created on 27.02.2010

@author: akvarats
@author: prefer
"""

from datetime import datetime, date
import re

from django.conf import settings
from django.utils.html import escapejs

from m3 import date2str

from base import BaseExtField, BaseExtTriggerField


from m3_ext.ui.helpers import pythonize

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
        **pythonize(
            [
                'inputType',
                'maskRe',
                'selectOnFocus',
                'enableKeyEvents'
            ],
        )
    )

    def __init__(self, *args, **kwargs):

        super(ExtStringField, self).__init__(*args, **kwargs)
        self.setdefault('enableKeyEvents', False, py=True)


class ExtDateField(BaseExtField):
    """
    Поле ввода даты
    """
    _xtype = "datefield"

    js_attrs = BaseExtField.js_attrs.extend(
        'editable', # Признак возможности редактирования,
        'format',
        **pythonize([
            "startDay", # атрибут задает с какого дня начинается неделя в календаре.
                        # 0-Воскресенье, 1-Понедельник, 2-Вторник и т.д.
            "hideTodayBtn",  # Прятать кнопку "Сегодняшняя дата"
            "enableKeyEvents", # Разрешает перехват нажатий клавиш
            "maxValue", # Максимальная возможная дата
            "minValue" # Минимально возможная дата
        ])
    )

    def __init__(self, *args, **kwargs):
        super(ExtDateField, self).__init__(*args, **kwargs)

        self.setdefault('startDay',         1, py=True)
        self.setdefault('hideTodayBtn',     False, py=True)
        self.setdefault('enableKeyEvents',  False, py=True)
        self.setdefault('maxValue',         None, py=True)
        self.setdefault('minValue',         None, py=True)

        default_format = 'd.m.Y'

        try:
            format_ = settings.DATE_FORMAT.replace('%', '')
        except:
            format_ = default_format

        self.setdefault('format', format_)
        self.setdefault('editable', True)


class ExtNumberField(BaseExtField):
    """
    Поле ввода числового значения
    """
    _xtype = "numberfield"

    js_attrs = BaseExtField.js_attrs.extend(
        **pythonize(
            [
                "decimalSeparator",
                "allowDecimals",
                "allowNegative",
                "decimalPrecision",
                "maxValue",
                "maxText",
                "minValue",
                "minText",
                "enableKeyEvents",
                "selectOnFocus"
            ]
        )
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

    def __init__(self, *args, **kwargs):
        super(ExtHiddenField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-hidden-field.js'  # TODO: Необходимо отрефакторить под внутриклассовый рендеринг

        # Тип поля
        self.type = ExtHiddenField.INT

        self.init_component(*args, **kwargs)


class ExtTextArea(BaseExtField):
    """
    Большое :) Текстовое поле
    """

    def __init__(self, *args, **kwargs):
        super(ExtTextArea, self).__init__(*args, **kwargs)

        # Фильтр допустимых символов по регекспу
        self.mask_re = None
        self.init_component(*args, **kwargs)

        # DOM-атрибуты
        self.auto_create = {"tag": "textarea", "autocomplete": "off"}

    def t_render_mask_re(self):
        return '/%s/' % self.mask_re

    def render_base_config(self):
        if self.value:
            self.value = escapejs(self.value)
        super(ExtTextArea, self).render_base_config()
        self._put_config_value('maskRe', self.t_render_mask_re, self.mask_re)

    def render(self):
        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        return 'new Ext.form.TextArea({%s})' % base_config


class ExtCheckBox(BaseExtField):
    """
    Галочка выбора значения
    """
    _xtype = "checkbox"

    js_attrs = BaseExtField.js_attrs.extend(
        'template', 'checked',
        **pythonize(
            ["boxLabel"]
        )
    )

    def __init__(self, *args, **kwargs):
        super(ExtCheckBox, self).__init__(*args, **kwargs)

        self.setdefault('template', 'ext-fields/ext-checkbox.js')
        self.setdefault('checked', False)
        self.setdefault('box_label', None)

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
        **pythonize(
            ['boxLabel']    # Текст рядом с полем выбора значения
        )
    )

    def __init__(self, *args, **kwargs):
        super(ExtRadio, self).__init__(*args, **kwargs)
#        self._ext_name = 'Ext.form.Radio'
        self.setdefault('checked', False)
        self.setdefault('box_label', None, py=True)

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

    def __init__(self, *args, **kwargs):
        super(ExtTimeField, self).__init__(*args, **kwargs)

        # Формат отображения времени
        self.format = None

        # Шаг повышения времени
        self.increment = None

        # max и min допустимые значения времени. Задаются только в виде строки,
        # т.к. форматы времени в python'e и javascript'e разные
        self.max_value = self.min_value = None
        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(ExtTimeField, self).render_base_config()
        self._put_config_value('format', self.format)
        self._put_config_value('increment', self.increment)
        self._put_config_value('max_value', self.max_value)
        self._put_config_value('min_value', self.min_value)

    def render(self):
        self.render_base_config()
        base_config = self._get_config_str()
        return 'new Ext.form.TimeField({%s})' % base_config


class ExtHTMLEditor(BaseExtField):
    """
    Поле HTML-редактор
    """

    def __init__(self, *args, **kwargs):
        super(ExtHTMLEditor, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(ExtHTMLEditor, self).render_base_config()

    def render(self):
        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        return 'new Ext.form.HtmlEditor({%s})' % base_config


class ExtDisplayField(BaseExtField):
    """
    Поле отображающее значение (не проверяется и не сабмитится)
    """
    _xtype = "displayfield"

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

