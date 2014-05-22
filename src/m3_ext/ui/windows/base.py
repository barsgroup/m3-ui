#coding: utf-8
"""
Created on 25.02.2010
"""

from m3_ext.ui.containers.base import BaseExtContainer, BaseExtPanel
from m3_ext.ui.controls import ExtButton


class ExtWindow(BaseExtPanel):
    """
    Базовый класс для всех окон
    """

    _xtype = 'm3-window'

    # FIXME: перенести t_render_keys, сейчас будет неправильно работать
    # FIXME: вернуть функцию find_by_name

    js_attrs = BaseExtPanel.js_attrs.extend(
        'modal',
        'maximizable',
        'maximized',
        'minimizable',
        'minimized',
        'closable',
        'resizable',
        'draggable',
        'keys',
        'buttons',
        label_align='labelAlign',
        label_pad='labelPad',
        help_topic='helpTopic',
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtWindow, self).__init__(*args, **kwargs)
        self.setdefault('buttons', [])
        self.setdefault('keys', [])
        self.setdefault('width', 400)
        # self.setdefault('height', 300)
        # self.setdefault('body_style', 'padding:5px;')
        self.setdefault('draggable', True)
        self.setdefault('resizable', True)

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        exclude_list = exclude_list or []

        self.read_only = access_off

        # Перебираем поля.
        for item in self.items:
            item.make_read_only(
                self.read_only, exclude_list, *args, **kwargs)

        # Перебираем бары.
        bar_typle = (self.footer_bar, self.bottom_bar, self.top_bar)
        for bar in bar_typle:
            if bar and bar.items:
                # Обязательно проверяем, что пришел контейнер.
                assert isinstance(bar, BaseExtContainer)
                for item in bar.items:
                    if hasattr(item, 'make_read_only'):
                        item.make_read_only(
                            self.read_only, exclude_list, *args, **kwargs)

        # Перебираем кнопки.
        for button in self.buttons:
            assert isinstance(button, ExtButton)
            button.make_read_only(
                self.read_only, exclude_list, *args, **kwargs)

# backwards compatible
BaseExtWindow = ExtWindow
