#coding:utf-8
"""
Created on 25.02.2010

@author: prefer <telepenin@bars-open.ru>
"""
from m3.actions.context import ActionContext

from m3_ext.ui.base import ExtUIComponent


class BaseExtContainer(ExtUIComponent):
    """
    Базовый класс qдля контейнерных компонентов
    """
    AUTO = 'auto'
    FIT = 'fit'
    FORM = 'form'
    BORDER = 'border'
    VBOX = 'vbox'
    HBOX = 'hbox'
    ABSOLUTE = 'absolute'
    ACCORDITION = 'accordition'

    def __init__(self, *args, **kwargs):
        super(BaseExtContainer, self).__init__(*args, **kwargs)

        # layout - атрибут, регламентирующий каким-образом отображать контрол
        self.layout = None

        # Конфигурация, специфичная для каждого layout
        self.layout_config = {}

        # Типизированный список контролов, находящихся в данном компоненте
        self._items = []

        # Атрибуты специфичные для form layout
        self.label_width = self.label_align = self.label_pad = None

        # Если контрол находится непосредственно на компоненте с layout=border
        # то при задании этого свойства можно будет ресайзить
        # (изменять размеры) панели
        self.split = False

        # Если контрол находится непосредственно на компоненте с layout=border
        # то можно указывать различные типы, например "mini"
        self.collapse_mode = None

        # Возможность сворачивать
        self.collapsible = False

        # True - компонент изначально свернут
        self.collapsed = False

    def t_render_items(self):
        """
        :deprecated: Рекомендуется использовать render_base_config
        Дефолтный рендеринг вложенных объектов
        """
        return '[%s]' % ','.join([item.render() for item in self._items])

    def find_by_name(self, name):
        """
        Осуществляет поиск экземпляра во вложенных объектах
        по имени экземпляра и возвращает его, если тот был найден
        :param name: имя экземпляра
        :type name: str
        """
        for item in self._items:
            if hasattr(item, 'name') and name == getattr(item, 'name'):
                return item

            if hasattr(item, 'find_by_name'):
                res = item.find_by_name(name)
                if res:
                    return res

    def t_render_layout_config(self):
        """
        :deprecated: Рекомендуется использовать render_base_config
        Рендерит конфиг, если указан layout
        """
        return '{%s}' % ','.join([
            '%s:"%s"' % i for i in self.layout_config.items()
        ])

    def pre_render(self):
        """
        Вызывается до рендеринга контрола
        """
        super(BaseExtContainer, self).pre_render()

        # выставляем action_context у дочерних элементов
        for item in self._items:
            if item:
                # объединим личный и общий контексты. личный важнее!
                # поэтому его накатим его первым
                # если у объекта небыло контекста, то будет!
                item.action_context = ActionContext().combine(
                    getattr(item, 'action_context', None)
                ).combine(
                    getattr(self, 'action_context', None)
                )

    def render_base_config(self):
        super(BaseExtContainer, self).render_base_config()
        if self.layout_config and self.layout:
            self._put_config_value('layoutConfig', self.t_render_layout_config)

        self._put_config_value('layout', self.layout)

        if self.region == BaseExtContainer.BORDER:
            self._put_config_value('split', self.split)
            self._put_config_value('collapseMode', self.collapse_mode)
            self._put_config_value('collapsible', self.collapsible)
            self._put_config_value('collapsed', self.collapsed)

        self._put_config_value('labelWidth', self.label_width)
        self._put_config_value('labelAlign', self.label_align)
        self._put_config_value('labelPad', self.label_pad)

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        if self._items:
            for item in self._items:
                if hasattr(item, "make_read_only") and callable(
                        item.make_read_only):
                    item.make_read_only(
                        access_off, exclude_list, *args, **kwargs)


class BaseExtPanel(BaseExtContainer):
    """
    Базовый класс для визуальных контейнерных компонентов
    """
    def __init__(self, *args, **kwargs):
        super(BaseExtPanel, self).__init__(*args, **kwargs)

        # Заголовок
        self.title = None

        self.header = False

        self.icon_cls = None

        self.top_bar = None

        self.bottom_bar = None

        self.footer_bar = None

        # :deprecated: Нет в документации extjs 3.3.1
        self.dd_group = None

        # Будет ли граница
        self.border = True

    def t_render_top_bar(self):
        #TODO: Использовать lambda функцию в render_base_config
        return self.top_bar.render()

    def t_render_bottom_bar(self):
        #TODO: Использовать lambda функцию в render_base_config
        return self.bottom_bar.render()

    def t_render_footer_bar(self):
        #TODO: Использовать lambda функцию в render_base_config
        return self.footer_bar.render()

    def render_base_config(self):
        super(BaseExtPanel, self).render_base_config()
        for args in (
            ('title', self.title),
            ('border', self.border),
            ('iconCls', self.icon_cls),
            ('ddGroup', self.dd_group),
            ('tbar', self.t_render_top_bar, self.top_bar),
            ('bbar', self.t_render_bottom_bar, self.bottom_bar),
            ('fbar', self.t_render_footer_bar, self.footer_bar),
            ('split', self.split),
            ('collapseMode', self.collapse_mode),
            ('collapsed', self.collapsed, self.collapsed),
        ):
            self._put_config_value(*args)

        if not self.title or not self.header is None:
            self._put_config_value('header', self.header)

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        #FIXME: нельзя использовать в качестве умолчательных параметров
        # изменяемые типы. Это может привести к неприятным side эффектам
        super(BaseExtPanel, self)._make_read_only(
            access_off, exclude_list, *args, **kwargs)

        bar_typle = (self.footer_bar, self.bottom_bar, self.top_bar)
        for bar in bar_typle:
            if bar and bar._items:
                # Обязательно проверяем, что пришел контейнер.
                assert isinstance(bar, BaseExtContainer)
                for item in bar._items:
                    if hasattr(item, "make_read_only") and callable(
                            item.make_read_only):

                        item.make_read_only(
                            access_off, exclude_list, *args, **kwargs)
