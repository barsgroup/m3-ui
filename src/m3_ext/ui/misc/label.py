#coding:utf-8
"""
Created on 23.3.2010

@author: prefer
"""
from m3_ext.ui.base import ExtUIComponent


class ExtLabel(ExtUIComponent):
    """
    Произвольный текст
    """
    _xtype = 'textfield'

    js_attrs = ExtUIComponent.js_attrs.extend(
        'text',
    )

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        pass
