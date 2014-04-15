#coding: utf-8
"""
Created on 15.03.2010
"""
from m3_ext.ui.base import ExtUIComponent
from base import BaseExtContainer


class ExtContextMenu(BaseExtContainer):
    """
    Контекстное меню
    """
    __SEPARATOR = '"-"'

    _xtype = 'menu'

    js_attrs = BaseExtContainer.js_attrs.extend(
        'items'
    )

    def add_item(self, **kwargs):
        """
        Добавляет элемент с параметрами **kwargs
        """
        item = ExtContextMenuItem(**kwargs)
        self.items.append(item)
        return item

    def add_separator(self):
        """
        Добавляет разделитель
        """
        self.items.append(ExtContextMenuSeparator())


class ExtContextMenuItem(ExtUIComponent):
    """
    Элемент контекстного меню
    """

    _xtype = 'menuitem'

    js_attrs = ExtUIComponent.js_attrs.extend(
        'menu', 'text', 'disabled', icon_cls='iconCls')

    def __init__(self, *args, **kwargs):
        super(ExtContextMenuItem, self).__init__(*args, **kwargs)

        # Текст для отображения
        self.setdefault('text', None)

        # Ссылка на меню, если имеется вложенное меню
        self.setdefault('menu', None)

        # Флаг недоступности элемента меню
        self.setdefault('disabled', False)

        # CSS класс иконок
        self.setdefault('icon_cls', '')

        # # Идентификатор внутри меню
        # self.item_id = None

        # # Функция-обработчик
        # self.handler = None

        # # FIXME: Что-то сомнительное. См. функцию render
        # self.custom_handler = False

        # TODO: Написать и использовать отдельные классы: menucheckitem, etc.
        # этим параметром можно задавать тип элемента меню: menucheckitem,
        # menutextitem, datemenu и т.п. В конфиге это задается через xtype.
        # Если задать неправильно, то может быть ошибка!
        # self.custom_itemtype = None

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        self.disabled = access_off


class ExtContextMenuSeparator(ExtUIComponent):
    """
    Разделитель элементов в меню
    :deprecated: В контекстном меню есть специальный метод и отдельный класс
    в данном случае не нужен
    """

    _xtype = 'menuseparator'

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        pass
