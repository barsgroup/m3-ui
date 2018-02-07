# coding: utf-8
from __future__ import absolute_import

from .base import BaseExtControl


#==============================================================================
class ExtButton(BaseExtControl):
    """
    Кнопка
    """
    def __init__(self, *args, **kwargs):
        super(ExtButton, self).__init__(self, *args, **kwargs)
        self.template = 'ext-controls/ext-button.js'

        # Текст на кнопке
        self.text = None

        # Обработчик
        self.handler = None

        # Путь до иконки
        self.icon = None

        # CSS класс для иконки
        self.icon_cls = None

        # Заголовок всплывающей подсказки
        self.tooltip_title = None

        # Текст всплывающей подсказки
        self.tooltip_text = None

        # Ссылка на меню
        self.menu = None

        # Индекс обхода кнопки
        self.tab_index = None

        self.margins = None

        # Признак того,
        # что при нажатии кнопка визуально будет нажата до следующего нажатия
        self.enable_toggle = False

        # Группы кнопок, учавствующие в визуальном нажатии
        self.toggle_group = None

        # Если False, то не позваляет нажимать на кнопку, если она продавлена
        # аткуально, если enable_toggle = True
        self.allow_depress = False

        # Кнопка будет нажата, если enable_toggle = True
        self.pressed = False

        self.init_component(*args, **kwargs)

    def t_render_handler(self):
        return self.handler

    def t_render_tooltip(self):
        res = ''
        if self.tooltip_text:
            res += 'text: "%s"' % self.tooltip_text
        if self.tooltip_title:
            res += ',title: "%s"' % self.tooltip_title
        return '{%s}' % res

    def render_base_config(self):
        super(ExtButton, self).render_base_config()
        for args in (
            ('text', self.text),
            ('icon', self.icon),
            ('iconCls', self.icon_cls),
            ('region', self.region),
            ('flex', self.flex),
            ('tooltip', self.t_render_tooltip, self.tooltip_text),
            ('enableToggle', self.enable_toggle),
            ('toggleGroup', self.toggle_group),
            ('allowDepress', self.allow_depress),
            ('tabIndex', self.tab_index),
            ('handler', self.t_render_handler, self.handler),
        ) + ('menu', self.menu.render) if self.menu else (
        ) + ('margins', self.margins) if self.margins else (
        ):
            self._put_base_value(*args)

    def render(self):
        self._ext_name = (
            'Ext.SplitButton' if self.menu and self.handler else 'Ext.Button')
        return super(ExtButton, self).render()

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        self.disabled = access_off
