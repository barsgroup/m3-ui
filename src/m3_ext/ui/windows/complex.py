#coding: utf-8

"""
Created on 9.03.10
"""

from m3_ext.ui.containers.grids import ExtGridCheckBoxSelModel
from m3_ext.ui.fields import ExtSearchField
from m3_ext.ui.controls import ExtButton
from m3_ext.ui.containers import (
    ExtContextMenu,
    ExtToolBar,
    ExtTree,
    ExtGrid
)
from base import BaseExtWindow


#==============================================================================
# TODO: Необходимо отрефакторить данный класс под внутриклассовый рендеринг 15.08.11
# TODO: Необходимо отрефакторить нахер все тут 29.01.13
# TODO: Кто-нибудь, выкиньте уже этот код <near future>
# deprecated: use objectpack
class ExtDictionaryWindow(BaseExtWindow):
    """
    :deprecated:
    Базовое окно для линейного, иерархичесого и совмещенного справочника
    """

    # Режим отображения
    LIST_MODE = 0

    # Режим выбора
    SELECT_MODE = 1

    # Режим множественного выбора
    MULTI_SELECT_MODE = 2

    def __init__(self, *args, **kwargs):
        super(ExtDictionaryWindow, self).__init__(*args, **kwargs)
        # TODO: Отрефакторить под внутриклассовый рендеринг
        self.template = 'ext-windows/ext-window.js'
        # TODO: Отрефакторить под внутриклассовый рендеринг
        self.template_globals = 'ext-script/ext-dictionary-window-globals.js'

        # Специальный layout для корректного отображения
        self.layout = 'border'

        # Кнопка "Закрыть" по-умолчанию
        self.buttons.append(ExtButton(
            name='close_btn', text=u'Закрыть',
            handler='function(){Ext.getCmp("%s").close();}' % self.client_id))

        # Основные контролы должны быть доступны для изменения
        # Грид
        self.grid = None

        # Дерево
        self.tree = None

        # Контрол поиска для грида
        self.search_text_grid = None

        # Контрол поиска для дерева
        self.search_text_tree = None

        # Кнопка выбора, если mode = SELECT_MODE
        self.select_button = None

        # Окно может находится в двух положениях:
        # просто список записей и список выбора записи/записей
        # По умолчанию справочник открыт в режиме списка
        self._mode = 0

        # Компоненты для различных действий для грида
        self._components_new_grid = None
        self._components_edit_grid = None
        self._components_delete_grid = None
        self._components_refresh_grid = None
        self._components_copy_grid = None

        # Компоненты для различных действий для дерева
        self._components_new_tree = None
        self._components_new_tree_child = None
        self._components_edit_tree = None
        self._components_delete_tree = None
        self._components_refresh_tree = None

        # Вызываемые url для грида
        self._url_new_grid = None
        self._url_edit_grid = None
        self._url_delete_grid = None
        self._url_drag_grid = None
        self._url_copy_grid = None

        # Вызываемые url для дерева
        self._url_new_tree = None
        self._url_edit_tree = None
        self._url_delete_tree = None
        self._url_drag_tree = None

        # Колонка для выбора, если компонент находится в режиме выбора
        self._column_name_on_select = None

        # Возможность максимизировать и минимизировать окно
        self.maximizable = self.minimizable = True

        # Наименования атрибута при создании/редактировании элемента в дереве
        # Если элемент создается/редактируется в корне, то id=''
        # Если элемент создается/редактирвется внутри дерева,
        # то id= parent_node.id -
        # id родительского узла
        self.contextTreeIdName = 'id'

        self.allow_copy = False

        self._text_on_select = None

        self.init_component(*args, **kwargs)

    @property
    def mode(self):
        return self._mode

    @mode.setter
    def mode(self, value):
        assert value in (
            ExtDictionaryWindow.LIST_MODE,
            ExtDictionaryWindow.SELECT_MODE,
            ExtDictionaryWindow.MULTI_SELECT_MODE
        ), 'Mode value should be 0(list), 1(select) or 2(multi select)'

        if value == ExtDictionaryWindow.SELECT_MODE:
            select_btn = ExtButton(
                name='select_btn', text=u'Выбрать', disabled=True)
            self.buttons.insert(0, select_btn)
            self.select_button = select_btn

        elif value == ExtDictionaryWindow.LIST_MODE:
            if self.select_button:
                self.buttons.remove(self.select_button)
                self.select_button = None

        if value == ExtDictionaryWindow.MULTI_SELECT_MODE:
            select_btn = ExtButton(
                name='select_btn', text=u'Выбрать', disabled=True)
            self.buttons.insert(0, select_btn)
            self.select_button = select_btn

        self._mode = value

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        exclude_list = exclude_list or []
        self.read_only = access_off

        super(ExtDictionaryWindow, self)._make_read_only(
            self.read_only, exclude_list, *args, **kwargs)
        if self.tree:
            # Включаем обратно refresh, ибо он нужен.
            for component in self._components_refresh_tree:
                exclude_list.append(component)
            # И поиск тоже включаем
            if self.search_text_tree:
                exclude_list.append(self.search_text_tree)
            self.tree.make_read_only(
                self.read_only, exclude_list, *args, **kwargs)

        if self.grid:
            # Включаем обратно refresh, ибо он нужен.
            for component in self._components_refresh_grid:
                exclude_list.append(component)
            # И поиск тоже включаем
            if self.search_text_grid:
                exclude_list.append(self.search_text_grid)
            self.grid.make_read_only(
                self.read_only, exclude_list, *args, **kwargs)

        # Оставим кнопку Закрыть и Выбрать
        for btn in self.buttons:
            if btn.name in ['close_btn', 'select_btn']:
                btn.make_read_only(False)

    def _add_menu_item_grid(
            self, to_tbar=True, to_row_menu=True,
            to_grid_menu=True, to_menu=None, **kwargs):
        """
        Добавление контролов управления в грид
        """
        ret = []

        if to_menu:
            ret.append(
                to_menu.add_item(**kwargs))

        if to_tbar:
            btn = ExtButton(**kwargs)
            self.grid.top_bar.items.append(btn)
            ret.append(btn)

        if to_row_menu:
            ret.append(
                self.grid.handler_rowcontextmenu.add_item(**kwargs))

        if to_grid_menu:
            ret.append(
                self.grid.handler_contextmenu.add_item(**kwargs))

        return ret

    def _add_separator_grid(
            self, to_tbar=True, to_row_menu=True,
            to_grid_menu=True, to_menu=None):
        """
        Добавление разделителя в контролы грида
        """
        if to_menu:
            to_menu.add_separator()
        if to_tbar:
            self.grid.top_bar.add_separator()
        if to_row_menu:
            self.grid.handler_rowcontextmenu.add_separator()
        if to_grid_menu:
            self.grid.handler_contextmenu.add_separator()

    def _add_menu_item_tree(
            self, to_tbar=True, to_node_menu=True,
            to_tree_menu=True, to_menu=None, **kwargs):
        """
        Добавление контролов управления в дерево
        """
        ret = []

        if to_menu:
            ret.append(
                to_menu.add_item(**kwargs))

        if to_tbar:
            btn = ExtButton(**kwargs)
            self.tree.top_bar.items.append(btn)
            ret.append(btn)

        if to_node_menu:
            ret.append(
                self.tree.handler_contextmenu.add_item(**kwargs))

        if to_tree_menu:
            ret.append(
                self.tree.handler_containercontextmenu.add_item(**kwargs))

        return ret

    def _add_separator_tree(
            self, to_tbar=True, to_node_menu=True,
            to_tree_menu=True, to_menu=None):
        """Добавление разделителя в контролы дерева"""
        if to_menu:
            to_menu.add_separator()
        if to_tbar:
            self.tree.top_bar.add_separator()
        if to_node_menu:
            self.tree.handler_contextmenu.add_separator()
        if to_tree_menu:
            self.tree.handler_containercontextmenu.add_separator()

    # Урлы для грида:
    @property
    def url_new_grid(self):
        return self._url_new_grid

    @url_new_grid.setter
    def url_new_grid(self, value):
        self.init_grid_components()
        if value:
            self._set_handler(self._components_new_grid, 'newValueGrid')
        else:
            self._clear_handler(self._components_new_grid)
        self._url_new_grid = value

    @property
    def url_edit_grid(self):
        return self._url_edit_grid

    @url_edit_grid.setter
    def url_edit_grid(self, value):
        self.init_grid_components()
        if value:
            self._set_handler(self._components_edit_grid, 'editValueGrid')
            self.grid.handler_dblclick = 'editValueGrid'
        else:
            self._clear_handler(self._components_edit_grid)
            self.grid.handler_dblclick = None
        self._url_edit_grid = value

    @property
    def url_delete_grid(self):
        return self._url_delete_grid

    @url_delete_grid.setter
    def url_delete_grid(self, value):
        self.init_grid_components()
        if value:
            self._set_handler(self._components_delete_grid, 'deleteValueGrid')
        else:
            self._clear_handler(self._components_delete_grid)
        self._url_delete_grid = value

    @property
    def url_copy_grid(self):
        return self._url_copy_grid

    @url_copy_grid.setter
    def url_copy_grid(self, value):
        self.init_grid_components()
        if value:
            self._set_handler(self._components_copy_grid, 'copyValueGrid')
        else:
            self._clear_handler(self._components_copy_grid)
        self._url_copy_grid = value

    #Урлы для дерева
    @property
    def url_new_tree(self):
        return self._url_new_tree

    @url_new_tree.setter
    def url_new_tree(self, value):
        self.init_tree_components()
        if value:
            self._set_handler(
                self._components_new_tree, 'newValueTreeRoot')
            self._set_handler(
                self._components_new_tree_child, 'newValueTreeChild')
        else:
            self._clear_handler(self._components_new_tree)
            self._clear_handler(self._components_new_tree_child)
        self._url_new_tree = value

    @property
    def url_edit_tree(self):
        return self._url_edit_tree

    @url_edit_tree.setter
    def url_edit_tree(self, value):
        self.init_tree_components()
        if value:
            self._set_handler(self._components_edit_tree, 'editValueTree')
            self.tree.handler_dblclick = 'editValueTree'
        else:
            self._clear_handler(self._components_edit_tree)
            self.tree.handler_dblclick = None
        self._url_edit_tree = value

    @property
    def url_delete_tree(self):
        return self._url_delete_tree

    @url_delete_tree.setter
    def url_delete_tree(self, value):
        self.init_tree_components()
        if value:
            self._set_handler(self._components_delete_tree, 'deleteValueTree')
        else:
            self._clear_handler(self._components_delete_tree)
        self._url_delete_tree = value

    # Выбор из справочника
    @property
    def column_name_on_select(self):
        return self._text_on_select

    @column_name_on_select.setter
    def column_name_on_select(self, value):
        handler = 'selectValue'

        if self.mode == ExtDictionaryWindow.MULTI_SELECT_MODE:
            handler = 'multiSelectValues'

        if value:
            self._set_handler([self.select_button], handler)
        else:
            self._clear_handler([self.select_button])
        self._text_on_select = value

    def _set_handler(self, components, handler):
        if not isinstance(components, (list, tuple)):
            components = [components]
        for component in components:
            component.handler = handler
            # Если окно в режиме только для чтения,
            # все контролы будут отключены.
            component.disabled = self.read_only

    def _clear_handler(self, components):
        if not isinstance(components, (list, tuple)):
            components = [components]
        for component in components:
            component.handler = None
            component.disabled = True

    def init_grid_components(self):
        """
        Идентификация грида
        """
        if not self.grid:
            grid = ExtGrid(region='center')
            grid.load_mask = True
            grid.handler_rowcontextmenu = ExtContextMenu()
            grid.handler_contextmenu = ExtContextMenu()
            grid.top_bar = ExtToolBar()

            search_grid = ExtSearchField(
                empty_text=u'Поиск',
                width=180, component_for_search=grid)

            self.grid = grid
            self.search_text_grid = search_grid
            self.items.append(grid)

            # Добавляются пункты в меню грида и на тулбар грида
            self._components_new_grid = self._add_menu_item_grid(
                text=u'Добавить',
                icon_cls='add_item',
                disabled=True
            )
            self._components_edit_grid = self._add_menu_item_grid(
                to_grid_menu=False,
                text=u'Изменить',
                icon_cls='edit_item',
                disabled=True
            )
            if self.allow_copy:
                self._components_copy_grid = self._add_menu_item_grid(
                    text=u'Копировать',
                    icon_cls='icon-page-copy'
                )
            self._components_delete_grid = self._add_menu_item_grid(
                to_grid_menu=False,
                text=u'Удалить',
                icon_cls='delete_item',
                disabled=True
            )
            self._add_separator_grid()
            self._components_refresh_grid = self._add_menu_item_grid(
                text=u'Обновить',
                icon_cls='table_refresh',
                handler='refreshGridStore'
            )

            grid.top_bar.add_fill()
            grid.top_bar.items.append(search_grid)

            if self.mode == ExtDictionaryWindow.MULTI_SELECT_MODE:
                self.grid.sm = ExtGridCheckBoxSelModel()

    def init_tree_components(self):
        """
        Идентификация дерева
        """
        if not self.tree:
            tree = ExtTree(width=180)
            tree.handler_contextmenu = ExtContextMenu()
            tree.handler_containercontextmenu = ExtContextMenu()
            tree.handler_click = 'onClickNode'
            tree.top_bar = ExtToolBar()

            search_tree = ExtSearchField(
                empty_text=u'Поиск', width=200, component_for_search=tree)

            self.tree = tree
            self.search_text_tree = search_tree
            self.items.append(tree)

            menu = ExtContextMenu()
            self.tree.top_bar.add_menu(
                icon_cls="add_item", menu=menu, text=u'Добавить')

            self._components_new_tree = self._add_menu_item_tree(
                to_tbar=False,
                to_menu=menu,
                text=u'Новый в корне',
                icon_cls='add_item',
                disabled=True
            )
            self._components_new_tree_child = self._add_menu_item_tree(
                to_tbar=False,
                to_tree_menu=False,
                to_menu=menu,
                text=u'Новый дочерний',
                icon_cls='add_item',
                disabled=True
            )
            self._components_edit_tree = self._add_menu_item_tree(
                to_tree_menu=False,
                text=u'Изменить',
                icon_cls='edit_item',
                disabled=True
            )
            self._components_delete_tree = self._add_menu_item_tree(
                to_tree_menu=False,
                text=u'Удалить',
                icon_cls='delete_item',
                disabled=True
            )
            self._add_separator_tree()
            self._components_refresh_tree = self._add_menu_item_tree(
                text=u'Обновить',
                icon_cls='table_refresh',
                handler='refreshTreeLoader'
            )

    def pre_render(self):
        if self.grid:
            self.grid.action_context = self.action_context
        if self.tree:
            self.tree.action_context = self.action_context
        super(ExtDictionaryWindow, self).pre_render()

    def render(self):
        assert (self.grid or self.tree), 'Grid or tree is not initialized'
        if not self.grid and self.tree:
            self.tree.region = 'center'
            self.tree.top_bar.add_fill()
            self.tree.top_bar.items.append(self.search_text_tree)

        elif self.tree:
            self.tree.region = 'west'
            # overflow='visible' -- для того, чтобы комбобокс отображался
            menu = ExtContextMenu(style=dict(overflow='visible'))
            menu.items.append(self.search_text_tree)
            self.tree.top_bar.add_fill()
            self.tree.top_bar.add_menu(icon_cls="search", menu=menu)

        # В режиме выбора даблклик работает на выбор
        if self.mode == self.SELECT_MODE:
            if self.grid:
                self.grid.handler_dblclick = 'selectValue'
            if self.tree:
                self.tree.handler_dblclick = 'selectValue'
        if self.mode == self.MULTI_SELECT_MODE:
            if self.grid:
                self.grid.handler_dblclick = 'multiSelectValues'
            if self.tree:
                self.tree.handler_dblclick = 'multiSelectValues'

        return super(ExtDictionaryWindow, self).render()

    @property
    def url_drag_grid(self):
        return self._url_drag_grid

    @url_drag_grid.setter
    def url_drag_grid(self, value):
        assert self.tree, 'Tree is not initialized'
        if value:
            self.grid.drag_drop = True
            self.grid.drag_drop_group = 'TreeDD'
            self.tree.handler_beforedrop = 'onBeforeDrop'
        else:
            self.grid.drag_drop = False
            self.grid.drag_drop_group = None
        self._url_drag_grid = value

    @property
    def url_drag_tree(self):
        return self._url_drag_tree

    @url_drag_tree.setter
    def url_drag_tree(self, value):
        if value:
            self.tree.drag_drop = True
            self.tree.handler_beforedrop = 'onBeforeDrop'
        else:
            self.tree.drag_drop = False
        self._url_drag_tree = value
