#coding:utf-8
"""
"""

from base import BaseExtControl


class ExtButton(BaseExtControl):
    """
    Кнопка
    """
    _xtype = 'button'

    js_attrs = BaseExtControl.js_attrs.extend(
        'text', 'icon', 'flex', 'region', 'menu', 'margins', 'disabled',
        icon_cls='iconCls',
        tooltip_text='tooltip',
        enable_toggle='enableToggle',
        toggle_group='toggleGroup',
        allow_depress='allowDepress',
        tab_index='tabIndex',
    )

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        self.disabled = access_off
