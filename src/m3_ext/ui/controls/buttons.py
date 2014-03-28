#coding:utf-8
"""
Created on 25.02.2010

@author: akvarats
"""

from base import BaseExtControl
from m3_ext.ui.base import renderable


#==============================================================================
class ExtButton(BaseExtControl):
    """
    Кнопка
    """
    __metaclass__ = renderable

    _xtype = 'button'

    _js_attrs = BaseExtControl._js_attrs + (
        'text', 'icon', 'flex', 'region', 'menu', 'margins', 'disabled',
        ('icon_cls', 'iconCls'),
        ('tooltip_text', 'tooltip'),
        ('enable_toggle', 'enableToggle'),
        ('toggle_group', 'toggleGroup'),
        ('allow_depress', 'allowDepress'),
        ('tab_index', 'tabIndex'),
    )

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        self.disabled = access_off
