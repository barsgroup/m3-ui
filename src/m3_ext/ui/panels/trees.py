# coding: utf-8
"""
Модуль с преднастроенными панелями-деевьями

Created on 25.06.2010

@author: prefer
"""

from m3_ext.ui import containers, controls, menus, render_component
from m3_ext.ui.fields import ExtSearchField
from m3.actions.urls import get_url


class ExtObjectTree(containers.ExtTree):
    """
    Панель с деревом для управления списком объектов.
    """
    #==========================================================================
    # Внутренние классы для ExtObjectTree
    #==========================================================================
    class TreeContextMenu(menus.ExtContextMenu):
        """
        Внутренний класс для удобной работы с контекстным меню дерева
        """
        def __init__(self, *args, **kwargs):
            super(
                ExtObjectTree.TreeContextMenu, self
            ).__init__(
                *args, **kwargs
            )
            self.menuitem_new = menus.ExtContextMenuItem(
                text=u'Новый в корне',
                icon_cls='add_item',
                handler='contextMenuNewRoot'
            )
            self.menuitem_new_child = menus.ExtContextMenuItem(
                text=u'Новый дочерний',
                icon_cls='add_item',
                handler='contextMenuNewChild'
            )
            self.menuitem_edit = menus.ExtContextMenuItem(
                text=u'Изменить',
                icon_cls='edit_item',
                handler='contextMenuEdit'
            )
            self.menuitem_delete = menus.ExtContextMenuItem(
                text=u'Удалить',
                icon_cls='delete_item',
                handler='contextMenuDelete'
            )
            self.menuitem_separator = menus.ExtContextMenuSeparator()
            self.init_component()

    class TreeTopBar(containers.ExtToolBar):
        """
        Внутренний класс для удобной работы топбаром грида
        """
        def __init__(self, *args, **kwargs):
            super(ExtObjectTree.TreeTopBar, self).__init__(*args, **kwargs)

            self.button_new = menus.ExtContextMenuItem(
                text=u'Новый в корне',
                icon_cls='add_item',
                handler='topBarNewRoot'
            )
            self.button_new_child = menus.ExtContextMenuItem(
                text=u'Новый дочерний',
                icon_cls='add_item',
                handler='topBarNewChild'
            )

            self.button_edit = controls.ExtButton(
                text=u'Изменить',
                icon_cls='edit_item',
                handler='topBarEdit'
            )
            self.button_delete = controls.ExtButton(
                text=u'Удалить',
                icon_cls='delete_item',
                handler='topBarDelete'
            )
            self.button_refresh = controls.ExtButton(
                text=u'Обновить',
                icon_cls='refresh-icon-16',
                handler='topBarRefresh'
            )
            menu = menus.ExtContextMenu()
            menu.items.append(self.button_new)
            menu.items.append(self.button_new_child)
            self.add_menu = containers.ExtToolbarMenu(
                icon_cls="add_item",
                menu=menu,
                text=u'Добавить'
            )
            self.init_component()

    #==========================================================================
    # Собственно определение класса ExtObjectTree
    #==========================================================================

    def __init__(self, *args, **kwargs):
        super(ExtObjectTree, self).__init__(*args, **kwargs)
        self.template = 'ext-trees/ext-object-tree.js'
        #======================================================================
        # Действия, выполняемые изнутри грида
        #======================================================================
        self.action_new = None
        self.action_edit = None
        self.action_delete = None
        self.action_data = None

        #======================================================================
        # Источник данных для грида
        #======================================================================
        self.load_mask = True
        self.row_id_name = 'id'
        self.parent_id_name = 'parent_id'
        self.allow_paging = False

        #======================================================================
        # Контекстное меню и бары дерева
        #======================================================================
        self.context_menu_row = ExtObjectTree.TreeContextMenu()
        self.context_menu_tree = ExtObjectTree.TreeContextMenu()
        self.top_bar = ExtObjectTree.TreeTopBar()
        self.top_bar.items.append(self.top_bar.add_menu)
        self.top_bar.items.append(self.top_bar.button_edit)
        self.top_bar.items.append(self.top_bar.button_delete)
        self.top_bar.items.append(self.top_bar.button_refresh)

        self.dblclick_handler = 'onEditRecord'

        # Признак "Сортировки папок"
        # если true, то папки всегда будут выше простых элементов
        # иначе, сортируются как элементы
        self.folder_sort = True

        # Возможность сортировки в дереве
        self.enable_tree_sort = True

        # После редактирования и добавления обновляется только тот узел дерева,
        # в котором произошли изменения
        self.incremental_update = False

        # Список исключений для make_read_only
        self._mro_exclude_list = []

        self.init_component()

    def add_search_field(self):
        u"""Добавляет строку поиска в гриде."""
        self.top_bar.search_field = ExtSearchField(
            empty_text=u'Поиск', width=200, component_for_search=self)
        self.top_bar.add_fill()
        self.top_bar.items.append(self.top_bar.search_field)

        self._mro_exclude_list.append(self.top_bar.search_field)

    def render(self):
        """
        Переопределяем рендер дерева для того,
        чтобы модифицировать содержимое его
        панелей и контекстных меню
        """
        if self.action_new:
            self.context_menu_row.items.append(
                self.context_menu_row.menuitem_new)
            self.context_menu_row.items.append(
                self.context_menu_row.menuitem_new_child)
            self.context_menu_tree.items.append(
                self.context_menu_tree.menuitem_new)

        if self.action_edit:
            self.context_menu_row.items.append(
                self.context_menu_row.menuitem_edit)
            self.handler_dblclick = self.dblclick_handler

        if self.action_delete:
            self.context_menu_row.items.append(
                self.context_menu_row.menuitem_delete)

        # контекстное меню прицепляется к гриду только в том случае, если
        # в нем есть хотя бы один пункт
        if self.context_menu_tree.items:
            self.handler_contextmenu = self.context_menu_tree
        if self.context_menu_row.items:
            self.handler_rowcontextmenu = self.context_menu_row

        #======================================================================
        # Настройка top bar
        #======================================================================
        for action, btn in (
            (self.action_new, self.top_bar.add_menu),
            (self.action_edit, self.top_bar.button_edit),
            (self.action_delete, self.top_bar.button_delete),
            (self.action_data, self.top_bar.button_refresh),
        ):
            if not action and btn in self.top_bar.items:
                self.top_bar.items.remove(btn)

        # тонкая настройка self.store
        if not self.url and self.action_data:
            self.url = get_url(self.action_data)

        self.render_base_config()
        self.render_params()
        return render_component(self)

    def render_params(self):
        super(ExtObjectTree, self).render_params()

        get_url_or_none = lambda x: get_url(x) if x else None
        new_url = get_url_or_none(self.action_new)
        edit_url = get_url_or_none(self.action_edit)
        delete_url = get_url_or_none(self.action_delete)
        data_url = get_url_or_none(self.action_data)
        context_json = (
            self.action_context.json if self.action_context else None
        )

        self._put_params_value(
            'actions', {
                'newUrl': new_url,
                'editUrl': edit_url,
                'deleteUrl': delete_url,
                'dataUrl': data_url,
                'contextJson': context_json
            }
        )

        self._put_params_value('rowIdName', self.row_id_name)
        self._put_params_value('parentIdName', self.parent_id_name)
        self._put_params_value('folderSort', self.folder_sort)
        self._put_params_value('enableTreeSort', self.enable_tree_sort)
        self._put_params_value('incrementalUpdate', self.incremental_update)

    def t_render_base_config(self):
        return self._get_config_str()

    def t_render_params(self):
        return self._get_params_str()
