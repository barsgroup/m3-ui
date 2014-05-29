#coding:utf-8
"""
"""

from m3_ext.ui.base import ExtUIComponent


class BaseExtContainer(ExtUIComponent):
    """
    Базовый класс для контейнерных компонентов
    """
    AUTO = 'auto'
    FIT = 'fit'
    FORM = 'form'
    BORDER = 'border'
    VBOX = 'vbox'
    HBOX = 'hbox'
    ABSOLUTE = 'absolute'
    ACCORDITION = 'accordition'

    js_attrs = ExtUIComponent.js_attrs.extend(
        'items',
        'split',
        'layout',
        base_cls='baseCls',
        layout_config='layoutConfig',
        label_width='labelWidth',
        collapse_mode='collapseMode',
        collapsible='collapsed',
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtContainer, self).__init__(*args, **kwargs)
        self.setdefault('items', [])

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        if self.items:
            for item in self.items:
                if hasattr(item, "make_read_only") and callable(
                        item.make_read_only):
                    item.make_read_only(
                        access_off, exclude_list, *args, **kwargs)


class BaseExtPanel(BaseExtContainer):
    """
    Базовый класс для визуальных контейнерных компонентов
    """
    #deprecated: Использовать атрибуты с верхним регистром
    ALIGN_LEFT = align_left = 'left'
    ALIGN_CENTER = 'center'
    ALIGN_RIGHT = align_right = 'right'

    js_attrs = BaseExtContainer.js_attrs.extend(
        'title',
        'padding',
        'border',
        'header',
        icon_cls='iconCls',
        dd_group='ddGroup',
        top_bar='tbar',
        bottom_bar='bbar',
        footer_bar='fbar',
        collapse_mode='collapseMode',
        collapsed='collapsed',
        button_align='buttonAlign',
        body_style='bodyStyle',
    )

    deprecated_attrs = BaseExtContainer.deprecated_attrs + (
        'align_left',
        'align_center',
        'align_right'
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtPanel, self).__init__(*args, **kwargs)
        self.setdefault('header', False)
        self.setdefault('border', True)
        self.setdefault('top_bar', [])
        self.setdefault('bottom_bar', [])
        self.setdefault('footer_bar', [])

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):

        super(BaseExtPanel, self)._make_read_only(
            access_off, exclude_list, *args, **kwargs)

        bar_typle = (self.footer_bar, self.bottom_bar, self.top_bar)
        for bar in bar_typle:
            if bar and bar.items:
                # Обязательно проверяем, что пришел контейнер.
                assert isinstance(bar, BaseExtContainer)
                for item in bar.items:
                    if hasattr(item, "make_read_only") and callable(
                            item.make_read_only):
                        item.make_read_only(
                            access_off, exclude_list, *args, **kwargs)
