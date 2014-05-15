#coding:utf-8
"""
Created on 02.03.2010
"""

from base import ExtWindow


class ExtEditWindow(ExtWindow):
    """
    Базовый класс окна редактрирования
    """

    _xtype = 'm3-edit-window'

    js_attrs = ExtWindow.js_attrs.extend(
        'form',
        data_url='dataUrl',
    )

    deprecated_attrs = ExtWindow.deprecated_attrs + (
        'handler_beforesubmit',
    )

    def __init__(self, *args, **kwargs):
        super(ExtEditWindow, self).__init__(*args, **kwargs)
        if not hasattr(self, 'form'):
            self.setdefault('form', None)
