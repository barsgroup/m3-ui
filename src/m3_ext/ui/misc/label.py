# coding: utf-8
from __future__ import absolute_import

from m3_ext.ui.base import ExtUIComponent


class ExtLabel(ExtUIComponent):
    """
    Произвольный текст
    """

    def __init__(self, *args, **kwargs):
        super(ExtLabel, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-label.js'

        # Текст для отображения
        self.text = None

        self.init_component(*args, **kwargs)

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        pass
