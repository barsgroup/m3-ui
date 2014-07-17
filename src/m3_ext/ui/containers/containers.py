#coding:utf-8
"""
"""
from m3_ext.ui.base import ExtUIComponent, BaseExtComponent

from base import BaseExtContainer


class ExtContainer(BaseExtContainer):
    """
    Класс, имитирующий работу Ext.Container

    FIXME:
            if 'overflow' not in self.style:
            # делается для хака IE иначе иногда дочерние элементы ведут себя
            # словно у них задано position: fixed т.е. начинаю неадекватничать
            self.style['overflow'] = 'hidden'
    """

    _xtype = 'container'


class ExtToolBar(BaseExtContainer):
    """
    Класс, имитирующий работу Ext.Toolbar
    """

    _xtype = 'toolbar'

    class Fill(BaseExtComponent):
        _xtype = 'tbfill'

    class Separator(BaseExtComponent):
        _xtype = 'tbseparator'

    class Spacer(BaseExtComponent):
        _xtype = 'tbspacer'
        js_attrs = BaseExtComponent.js_attrs.extend('width')

    class TextItem(BaseExtComponent):
        _xtype = 'tbtext'
        js_attrs = BaseExtComponent.js_attrs.extend('text')

    def add_fill(self):
        """
        Переносит все последующие компоненты направо
        """
        self.items.append(ExtToolBar.Fill())

    def add_separator(self):
        """
        Добавляет разделитель
        """
        self.items.append(ExtToolBar.Separator())

    def add_spacer(self, width=2):
        """
        Добавляет дополнительное расстояние с шириной width
        :param width: расстояние
        :type width: int
        """
        self.items.append(ExtToolBar.Spacer(width=width))

    def add_text_item(self, text_item):
        """
        Добавляет текст
        :param text_item: текст
        :type text_item: unicode
        """
        el = ExtToolBar.TextItem(text=text_item)
        self.items.append(el)
        return el

    def add_menu(self, **kwargs):
        """
        Добавляет меню
        :param **kwargs: конфиг для меню
        """
        menu = ExtToolbarMenu(**kwargs)
        self.items.append(menu)
        return menu


class ExtPagingBar(BaseExtContainer):
    """
    Класс, имитирующий работу Ext.PagingToolbar
    """

    _xtype = 'paging'
    js_attrs = BaseExtContainer.js_attrs.extend(
        page_size='pageSize',
        display_message='displayMsg',
        display_info='displayInfo',
        empty_message='emptyMsg',
    )

    def __init__(self, *args, **kwargs):
        super(ExtPagingBar, self).__init__(*args, **kwargs)
        self.setdefault('page_size', 25)
        self.setdefault('display_message', u'Показано записей {0} - {1} из {2}')
        self.setdefault('display_info', True)
        self.setdefault('empty_message', u'Нет записей')


class ExtToolbarMenu(ExtUIComponent):
    """
    Класс, позволяющий вставлять меню в ToolBar
    """
    _xtype = 'm3-button'

    js_attrs = ExtUIComponent.js_attrs.extend(
        'text',
        'menu',
        icon_cls='iconCls', 
        tooltip_text='tooltip')

    def __init__(self, *args, **kwargs):
        super(ExtToolbarMenu, self).__init__(*args, **kwargs)
        self.setdefault('text', None)
        self.setdefault('icon_cls', '')
        self.setdefault('tooltip_text', None)
        self.setdefault('menu', None)

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        if self.menu:
            self.menu.make_read_only(
                access_off, exclude_list, *args, **kwargs)


class ExtRadioGroup(BaseExtContainer):
    """
    Компонент-контейнер для радио-полей
    """

    _xtype = 'radiogroup'

    js_attrs = BaseExtContainer.js_attrs.extend(
        'columns'
    )
