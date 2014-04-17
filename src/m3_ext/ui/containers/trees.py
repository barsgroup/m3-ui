#coding:utf-8
"""
Created on 11.3.2010

@author: prefer
"""

from base import BaseExtPanel
from m3_ext.ui.base import ExtUIComponent, BaseExtComponent
from m3_ext.ui.containers import (
    ExtGridColumn, ExtGridBooleanColumn, ExtGridDateColumn, ExtGridNumberColumn
)


#==============================================================================
class ExtTree(BaseExtPanel):
    """
    Дерево с колонками
    """
    _xtype = "m3-tree"

    js_attrs = BaseExtPanel.js_attrs.extend(
        "columns",
        nodes="params.Nodes",
        tree_loader="params.loader",
        root_text="params.rootText", # Текст для корневого элемента
        allow_container_drop="dropConfig.allowContainerDrop",
        allow_parent_insert="dropConfig.allowParentInsert",
        drag_drop="enableDD",
        enable_drop="enableDrop",
        enable_drag="enableDrag",
        handler_contextmenu="params.contextMenu",
        handler_containercontextmenu="params.containerContextMenu",
        url="params.url", # url для загрузки данных
        read_only="params.readOnly", # Если включен - не рендерим drag'n'drop
        custom_load="params.customLoad",
        plugins="params.plugins",
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

        # список узлов
        self.setdefault("nodes", [])
        # список колонок
        self.setdefault("columns", [])

        # Разрешить только дропить (перемещать в дерево)
        self.setdefault("enable_drop", False)
        # Разрешить только драгить (перемещать из дерево)
        self.setdefault("enable_drag", False)
        # разрешить перетаскивать элементы в корень
        # (путем кидания просто в контейнер)
        self.setdefault("allow_container_drop", True)
        # Разрешает вставку узлов между родительскими элементами
        self.setdefault("allow_parent_insert", False)

        # Специальный загрузчик для дерева
        self.setdefault("tree_loader", ExtTreeLoader())

        # Возможность использовать drag & drop
        self.setdefault('drag_drop', False)

        # Если выставлен данный атрибут, то работает схема:
        # Всегда подгружается уровни дочерних элементов, в то время как
        # дочерние элементы уже подгружены.
        # Таким образом создается впечатление,
        # что дерево не динамическое и все узлы видны пользователю
        self.setdefault("custom_load", False)

        # перечень плагинов
        self.setdefault("plugins", [])

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        exclude_list = exclude_list or []
        # Выключаем\включаем компоненты.
        super(ExtTree, self)._make_read_only(
            access_off, exclude_list, *args, **kwargs)

        self.read_only = access_off
        # контекстное меню.
        context_menu_items = [
            self.handler_contextmenu,
            self.handler_containercontextmenu
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


#==============================================================================
class ExtTreeNode(BaseExtComponent):
    """
    Узел дерева
    """
    _xtype = "treenode"

    js_attrs = BaseExtComponent.js_attrs.extend(
        "leaf",
        "text", # Отображаемый текст
        "expanded",
        "checked",
        "children",
        icon_cls="iconCls", # CSS класс для иконки
    )

    deprecated_attrs = BaseExtComponent.deprecated_attrs + (
        "items",
        "can_check",
        "has_children",
        "auto_check",
    )

    def __init__(self, *args, **kwargs):
        super(ExtTreeNode, self).__init__(*args, **kwargs)
        # True - Листьевой узел
        self.setdefault('leaf', True)

    def add_children(self, children):
        """
        Добавляет дочерние узлы
        Если необходимо, здесь можно указать у узлов
        атрибут "parent" на текущий (родительский) узел
        """
        self.children.append(children)


#==============================================================================
class ExtTreeLoader(BaseExtComponent):
    """
    Загрузчик данных для ExtTree
    """
    _xtype = "treeloader"

    js_attrs = BaseExtComponent.js_attrs.extend(
        url="dataUrl",
        base_params="baseParams"
    )

    deprecated_attrs = BaseExtComponent.deprecated_attrs + (
        "ui_providers",
        "listeners"
    )
