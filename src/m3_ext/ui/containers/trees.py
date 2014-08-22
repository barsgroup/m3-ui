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
    def __init__(self, *args, **kwargs):
        super(ExtTree, self).__init__(*args, **kwargs)
        self.template = 'ext-trees/ext-tree.js'

        # Типизированный список узлов
        self.nodes = []

        # Список колонок
        self._items = []

        # Специальный загрузчик для дерева
        self.tree_loader = ExtTreeLoader()

        # url для загрузки данных
        self.url = None

        # Текст для корневого элемента
        self.root_text = None

        # Если включен - показываем корневой элемент
        self.root_visible = False

        # Возможность использовать drag & drop.
        # То есть одновременные
        self.drag_drop = False

        # Если выставлен данный атрибут, то работает схема:
        # Всегда подгружается уровни дочерних элементов, в то время как
        # дочерние элементы уже подгружены.
        # Таким образом создается впечатление,
        # что дерево не динамическое и все узлы видны пользователю
        self.custom_load = False

        # Если включен - не рендерим drag'n'drop
        self.read_only = False

        # разрешить перетаскивать элементы в корень
        # (путем кидания просто в контейнер)
        self.allow_container_drop = True

        # Разрешает вставку узлов между родительскими элементами
        self.allow_parent_insert = False

        # Разрешить только дропить (перемещать в дерево)
        self.enable_drop = False

        # Разрешить только драгить (перемещать из дерево)
        self.enable_drag = False

        # перечень плагинов
        self.plugins = []

        self.init_component(*args, **kwargs)

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        exclude_list = exclude_list or []
        # Выключаем\включаем компоненты.
        super(ExtTree, self)._make_read_only(
            access_off, exclude_list, *args, **kwargs)

        self.read_only = access_off
        # контекстное меню.
        context_menu_items = [self.handler_contextmenu,
                              self.handler_containercontextmenu]
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

    def t_render_tree_loader(self):
        return self.tree_loader.render()

    def t_render_nodes(self):
        return ','.join([node.render() for node in self.nodes])

    def t_render_root(self):
        return (
            "new Ext.tree.AsyncTreeNode({id: '-1', "
            "expanded: true, allowDrag: false, "
            "uiProvider: Ext.ux.tree.TreeGridNodeUI %s %s %s})"
        ) % (
            (',text:"%s"' % self.root_text) if self.root_text else '',
            (',%s:"%s"' % (self.columns[0].data_index, self.root_text)) if self.columns and self.root_text else '',
            (',children:[%s]' % ','.join(
                [node.render() for node in self.nodes])) if self.nodes else ''
        )

    def t_render_columns(self):
        return self.t_render_items()

    def add_nodes(self, *args):
        """
        Добавляет переданные узлы дерева
        :param *args: Узлы дерева
        """
        for node in args:
            self.nodes.append(node)

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

    @property
    def columns(self):
        return self._items

    @property
    def url(self):
        return self.__url

    @url.setter
    def url(self, value):
        self.tree_loader.url = value
        self.__url = value

    def pre_render(self):
        self.tree_loader.action_context = self.action_context
        super(ExtTree, self).pre_render()

    @property
    def handler_contextmenu(self):
        return self._listeners.get('contextmenu')

    @handler_contextmenu.setter
    def handler_contextmenu(self, menu):
        menu.container = self
        self._listeners['contextmenu'] = menu

    @property
    def handler_containercontextmenu(self):
        return self._listeners.get('containercontextmenu')

    @handler_containercontextmenu.setter
    def handler_containercontextmenu(self, menu):
        menu.container = self
        self._listeners['containercontextmenu'] = menu

    @property
    def handler_click(self):
        return self._listeners.get('click')

    @handler_click.setter
    def handler_click(self, function):
        self._listeners['click'] = function

    @property
    def handler_dblclick(self):
        return self._listeners.get('dblclick')

    @handler_dblclick.setter
    def handler_dblclick(self, function):
        self._listeners['dblclick'] = function

    @property
    def handler_dragdrop(self):
        return self._listeners.get('dragdrop')

    @handler_dragdrop.setter
    def handler_dragdrop(self, function):
        self._listeners['dragdrop'] = function

    @property
    def handler_dragover(self):
        return self._listeners.get('nodedragover')

    @handler_dragover.setter
    def handler_dragover(self, function):
        self._listeners['nodedragover'] = function

    @property
    def handler_startdrag(self):
        return self._listeners.get('startdrag')

    @handler_startdrag.setter
    def handler_startdrag(self, function):
        self._listeners['startdrag'] = function

    @property
    def handler_enddrag(self):
        return self._listeners.get('enddrag')

    @handler_enddrag.setter
    def handler_enddrag(self, function):
        self._listeners['enddrag'] = function

    @property
    def handler_drop(self):
        return self._listeners.get('nodedrop')

    @handler_drop.setter
    def handler_drop(self, function):
        self._listeners['nodedrop'] = function

    @property
    def handler_beforedrop(self):
        return self._listeners.get('beforenodedrop')

    @handler_beforedrop.setter
    def handler_beforedrop(self, function):
        self._listeners['beforenodedrop'] = function

    #--------------------------------------------------------------------------
    def render_base_config(self):
        super(ExtTree, self).render_base_config()
        for args in (
            ('useArrows', True),
            ('autoScroll', False),
            ('animate', True),
            ('containerScroll', True),
            ('columns', self.t_render_columns),
            ('loader', self.t_render_tree_loader),
            ('root', self.t_render_root),
            ('plugins', lambda: '[%s]' % ','.join(self.plugins)),
        ):
            self._put_config_value(*args)

        if self.drag_drop and not self.read_only:
            self._put_config_value('enableDD', True)
            self._put_config_value(
                'dropConfig',
                {
                    'allowContainerDrop': self.allow_container_drop,
                    'allowParentInsert': self.allow_parent_insert
                }
            )
        else:
            self._put_config_value('enableDrop', self.enable_drop)
            self._put_config_value('enableDrag', self.enable_drag)

    def render_params(self):
        super(ExtTree, self).render_params()
        self._put_params_value('customLoad', self.custom_load)
        self._put_params_value('rootVisible', self.root_visible)


#==============================================================================
class ExtTreeNode(ExtUIComponent):
    """Узел дерева"""

    def __init__(self, *args, **kwargs):
        super(ExtTreeNode, self).__init__(*args, **kwargs)
        self.template = 'ext-trees/ext-tree-node.js'

        # Отображаемый текст
        self.text = None

        # CSS класс для иконки
        self.icon_cls = None

        # True - Листьевой узел
        self.leaf = True

        # Имеются ли дочерние узлы
        # self.has_children = False

        # Развернут ли элемент
        self.expanded = False

        #
        self.auto_check = False

        # Отмечен ли галкой данный узел
        self.checked = False

        # Может ли узел быть отмеченым
        self.can_check = False

        # Типизированный список дочерних узлов
        self.children = []

        self.__items = {}
        self.init_component(*args, **kwargs)

    @property
    def has_children(self):
        return not self.leaf

    @has_children.setter
    def has_children(self, val):
        self.leaf = not val

    def t_render_children(self):
        return '[%s]' % ','.join([child.render() for child in self.children])

    def add_children(self, children):
        """
        Добавляет дочерние узлы
        Если необходимо, здесь можно указать у узлов
        атрибут "parent" на текущий (родительский) узел
        """
        self.has_children = True
        self.children.append(children)

    # TODO: Сомнительный кусок --> В шаблоне используется items.items
    @property
    def items(self):
        return self.__items

    def set_items(self, **kwargs):
        for k, v in kwargs.items():
            self.items[k] = v
    # --<<


#==============================================================================
class ExtTreeLoader(BaseExtComponent):
    """
    Загрузчик данных для ExtTree
    """
    def __init__(self, *args, **kwargs):
        super(ExtTreeLoader, self).__init__(*args, **kwargs)
        self.template = 'ext-trees/ext-tree-loader.js'

        # url для данных
        self.url = None

        # Словарь с параметрами
        self._base_params = {}

        # Node builders
        self.ui_providers = {}

        self.init_component(*args, **kwargs)

    def _set_base_params(self, params):
        self._base_params.update(params)

    def _get_base_params(self):
        return self._base_params

    base_params = property(_get_base_params, _set_base_params)
