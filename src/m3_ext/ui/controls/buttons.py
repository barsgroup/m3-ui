#coding:utf-8


from m3_ext.ui.base import ExtUIComponent


class ExtButton(ExtUIComponent):
    """
    Кнопка
    """
    _xtype = 'm3-button'

    js_attrs = ExtUIComponent.js_attrs.extend(
        'text',
        'icon',
        'flex',
        'region',
        'menu',
        'margins',
        'disabled',
        'handler',
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
