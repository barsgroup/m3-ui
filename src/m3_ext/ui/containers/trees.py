#coding:utf-8
"""
Created on 11.3.2010
"""

from base import BaseExtPanel
from m3_ext.ui.base import ExtUIComponent
from m3_ext.ui.containers import (
    ExtGridColumn, ExtGridBooleanColumn, ExtGridDateColumn, ExtGridNumberColumn
)


class ExtTree(BaseExtPanel):
    """
    Дерево с колонками
    """

    _xtype = "m3-tree"

    js_attrs = BaseExtPanel.js_attrs.extend(
        "columns",  # список колонок
        "root",

        _root_id='root.id',
        _root_expanded='root.expanded',
        _root_allow_drag='root.allowDrag',
        root_text="root.rootText",  # Текст для корневого элемента
        nodes='root.children',  # список узлов

        allow_container_drop="dropConfig.allowContainerDrop",  # разрешить перетаскивать элементы в корень
        allow_parent_insert="dropConfig.allowParentInsert",  # Разрешает вставку узлов между родительскими элементами
        drag_drop="enableDD",  # Возможность использовать drag & drop
        enable_drop="enableDrop",  # Разрешить только драгить (перемещать из дерево)
        enable_drag="enableDrag",  # Разрешить только дропить (перемещать в дерево)
        handler_contextmenu="contextMenu",
        handler_containercontextmenu="containerContextMenu",
        url="dataUrl",  # url для загрузки данных
        read_only="readOnly",  # Если включен - не рендерим drag'n'drop
        root_visible='rootVisible',  # Отображать ли корневой элемент или нет

        plugins="plugins",  # перечень плагинов
    )

    deprecated_attrs = BaseExtPanel.deprecated_attrs + (
        'handler_click',
        'handler_dblclick',
        'handler_dragdrop',
        'handler_dragover',
        'handler_startdrag',
        'handler_enddrag',
        'handler_drop',
        'handler_beforedrop',
    )

    def __init__(self, *args, **kwargs):
        super(ExtTree, self).__init__(*args, **kwargs)

        self.setdefault('_root_expanded', True)
        self.setdefault('_root_allow_drag', False)
        self.setdefault("nodes", None)  # Иначе если [] - загрузка nodes у treeloader'a не работает

        self.setdefault("columns", [])
        self.setdefault("enable_drop", False)
        self.setdefault("enable_drag", False)
        self.setdefault("allow_container_drop", True)
        self.setdefault("allow_parent_insert", False)
        self.setdefault('drag_drop', False)
        self.setdefault("plugins", [])
        self.setdefault('border', False)

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):

        exclude_list = exclude_list or []
        # Выключаем\включаем компоненты.
        super(ExtTree, self)._make_read_only(
            access_off, exclude_list, *args, **kwargs)

        self.read_only = access_off

        # контекстное меню.
        context_menu_items = [
            getattr(self, 'handler_contextmenu', None),
            getattr(self, 'handler_containercontextmenu', None)
        ]
        for context_menu in context_menu_items:
            if (
                context_menu and
                hasattr(context_menu, 'items') and
                context_menu.items and
                hasattr(context_menu.items, '__iter__')
            ):
                for item in context_menu.items:
                    if isinstance(item, ExtUIComponent):
                        item.make_read_only(
                            self.read_only, exclude_list, *args, **kwargs)

    def add_nodes(self, *args):
        """
        Добавляет переданные узлы дерева
        :param *args: Узлы дерева
        """
        if self.nodes is None:
            self.nodes = []
        self.nodes.extend(args)

    def add_column(self, **kwargs):
        """
        Добавляет колонку с аргументами
        :param **kwargs: Аргументы
        """
        self.columns.append(ExtGridColumn(**kwargs))

    def add_bool_column(self, **kwargs):
        """
        Добавляет колонку с аргументами
        @param **kwargs: Аргументы
        """
        self.columns.append(ExtGridBooleanColumn(**kwargs))

    def add_number_column(self, **kwargs):
        """
        Добавляет колонку с аргументами
        :param **kwargs: Аргументы
        """
        self.columns.append(ExtGridNumberColumn(**kwargs))

    def add_date_column(self, **kwargs):
        """
        Добавляет колонку с аргументами
        :param **kwargs: Аргументы
        """
        self.columns.append(ExtGridDateColumn(**kwargs))