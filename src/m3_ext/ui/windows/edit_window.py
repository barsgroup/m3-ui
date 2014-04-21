#coding:utf-8
"""
Created on 02.03.2010
"""

from base import BaseExtWindow


class ExtEditWindow(BaseExtWindow):
    """
    Базовый класс окна редактрирования
    """

    _xtype = 'm3-edit-window'

    js_attrs = BaseExtWindow.js_attrs.extend(
        'form',
        data_url='dataUrl',
    )

    deprecated_attrs = BaseExtWindow.deprecated_attrs + (
        'handler_beforesubmit',
    )

    def __init__(self, *args, **kwargs):
        super(ExtEditWindow, self).__init__(*args, **kwargs)
        self.setdefault('form', None)
