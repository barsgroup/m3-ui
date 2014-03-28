#coding:utf-8
"""
Created on 23.3.2010

@author: prefer
"""
from m3_ext.ui.base import ExtUIComponent, renderable


class ExtLabel(ExtUIComponent):
    """
    Произвольный текст
    """
    __metaclass__ = renderable

    _xtype = 'textfield'

    _js_attrs = ExtUIComponent._js_attrs + (
        'text',
    )

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        pass
