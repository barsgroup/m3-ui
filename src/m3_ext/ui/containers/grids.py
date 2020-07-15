# coding: utf-8
from __future__ import absolute_import

from collections import OrderedDict
import json
import weakref

from django.conf import settings

from m3_ext.ui.base import BaseExtComponent
from m3_ext.ui.base import ExtUIComponent

from .base import BaseExtPanel
import six


class ExtGrid(BaseExtPanel):
    """
    Таблица (Grid)
    Внимание! Грид реализует двуличное поведение
    в зависимости от атрибута editor.
    Порождающая его функция createGridPanel может вернуть экземпляр
    Ext.m3.GridPanel (False) или Ext.m3.EditorGridPanel (True),
    поэтому некоторые атрибуты могут действовать в одном,
    но не действовать в другом гриде.
    """
    manageable_listeners = ('dblclick',)

    # TODO: Реализовать человеческий MVC грид

    def __init__(self, *args, **kwargs):
        super(ExtGrid, self).__init__(*args, **kwargs)
        self._items = []
        self.__store = None

        # Будет ли редактироваться
        self.editor = False

        # Объект маскирования, который будет отображаться при загрузке
        self.load_mask = False

        # Сколько раз нужно щелкнуть для редактирования ячейки.
        # Только для EditorGridPanel
        self.clicks_to_edit = 2

        self.drag_drop = False
        self.drag_drop_group = None

        # Разворачивать колонки грида по всей ширине (True)
        self.force_fit = True

        # selection model
        self.__sm = None

        self.__view = None

        # Колонка для авторасширения
        self.auto_expand_column = None

        # устанавливается True, если sm=CheckBoxSelectionModel. Этот флаг нужен
        # чтобы знать когда нужен дополнительный column
        self.__checkbox = False

        # перечень плагинов
        self.plugins = []

        # модель колонок
        self.__cm = None

        self.col_model = ExtGridDefaultColumnModel()

        # Конфигурация для уровня view
        self._view_config = {}
        self.show_preview = False
        self.enable_row_body = False
        self.get_row_class = None

        # признак отображения вертикальных линий в гриде
        self.column_lines = True

        # Если True не рендерим drag and drop, выключаем editor
        self.read_only = False

        # Метка. Использовать только если задан layout=form
        self.label = None

        self.init_component(*args, **kwargs)

        # protected
        self.show_banded_columns = False
        self.banded_columns = OrderedDict()

    def t_render_plugins(self):
        """
        Рендеринг плагинов
        """
        res = []
        for plugin in self.plugins:
            res.append(
                plugin.render() if hasattr(plugin, 'render') else plugin
            )

        return '[%s]' % ','.join(res)

    def t_render_banded_columns(self):
        """
        Возвращает JS массив состоящий из массивов с описанием объединенных
        колонок. Каждый вложенный массив соответствует уровню шапки грида от
        верхней к нижней.
        """
        result = []
        for level_list in self.banded_columns.values():
            result.append('[%s]' % ','.join(
                [column.render() for column in level_list]))
        return '[%s]' % ','.join(result)

    def t_render_columns(self):
        return self.t_render_items()

    def t_render_store(self):
        assert self.__store, 'Store is not define'
        return self.__store.render(self.columns)

    def t_render_col_model(self):
        return self.__cm.render()

    def add_column(self, **kwargs):
        """
        Добавляет стандартную колонку
        """
        self.columns.append(ExtGridColumn(**kwargs))

    def add_bool_column(self, **kwargs):
        """
        Добавляет булевую колонку
        """
        self.columns.append(ExtGridBooleanColumn(**kwargs))

    def add_check_column(self, **kwargs):
        """
        Добавляет колонку для выбора значения
        """
        self.columns.append(ExtGridCheckColumn(**kwargs))

    def add_number_column(self, **kwargs):
        """
        Добавляет числовую колонку
        """
        self.columns.append(ExtGridNumberColumn(**kwargs))

    def add_date_column(self, **kwargs):
        """
        Добавляет колонку с датой
        """
        self.columns.append(ExtGridDateColumn(**kwargs))

    def add_banded_column(self, column, level, colspan):
        """
        Добавляет в грид объединенную ячейку.
        :param column: Колонка грида
        :type column: ExtGridColumn или None
        :param colspan: Количество колонок, кот-е находятся под данной колонкой
        :type colspan: int
        :param level: Уровень ячейки (0 - самый верхний, 1-ниже, и т.д)
        :type level: int

        .. note ::
            upd:26.10.2010 kirov
            колонка может быть не указана, т.е. None,
            в этом случае на указанном уровне будет "дырка"
        """
        class BlankBandColumn():
            colspan = 0

            def render(self):
                return '{%s}' % (
                    ('colspan:%s' % self.colspan) if self.colspan else '')

        assert isinstance(level, int)
        assert isinstance(colspan, int)
        assert isinstance(column, ExtGridColumn) or not column
        if not column:
            column = BlankBandColumn()
        # Колонки хранятся в списках внутки сортированного словаря,
        # чтобы их можно было
        # извечь по возрастанию уровней
        column.colspan = colspan
        level_list = self.banded_columns.get(level, [])
        level_list.append(column)
        self.banded_columns[level] = level_list
        self.show_banded_columns = True

    def clear_banded_columns(self):
        """
        Удаляет все объединенные колонки из грида
        """
        self.banded_columns.clear()
        self.show_banded_columns = False

    def set_store(self, store):
        self.__store = store

    def get_store(self):
        return self.__store

    store = property(get_store, set_store)

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        super(ExtGrid, self)._make_read_only(
            access_off, exclude_list, *args, **kwargs)
        self.read_only = access_off
        if self.columns:
            for column in self.columns:
                column.make_read_only(
                    self.read_only, exclude_list, *args, **kwargs)

        # контекстное меню.
        context_menu_items = [self.handler_contextmenu,
                              self.handler_rowcontextmenu]
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

    @property
    def columns(self):
        return self._items

    @property
    def sm(self):
        return self.__sm

    @sm.setter
    def sm(self, value):
        self.__sm = value
        self.checkbox_model = isinstance(self.__sm, ExtGridCheckBoxSelModel)

    @property
    def view(self):
        return self.__view

    @view.setter
    def view(self, value):
        self.__view = value

    def t_render_view(self):
        return self.view.render()

    def pre_render(self):
        super(ExtGrid, self).pre_render()
        if self.store:
            self.store.action_context = self.action_context

    @property
    def col_model(self):
        return self.__cm

    @col_model.setter
    def col_model(self, value):
        self.__cm = value
        self.__cm.grid = self

    @property
    def handler_click(self):
        return self._listeners.get('click')

    @handler_click.setter
    def handler_click(self, function):
        self._listeners['click'] = function

    @property
    def handler_dblclick(self):
        if self.read_only:
            # Если грид работает в режиме "чтения"
            # выключаем двойной клик, заменяя пустой функцией
            return 'Ext.emptyFn'
        return self._listeners.get('dblclick')

    @handler_dblclick.setter
    def handler_dblclick(self, function):
        self._listeners['dblclick'] = function

    @property
    def handler_contextmenu(self):
        return self._listeners.get('contextmenu')

    @handler_contextmenu.setter
    def handler_contextmenu(self, menu):
        menu.container = self
        self._listeners['contextmenu'] = menu

    @property
    def handler_rowcontextmenu(self):
        return self._listeners.get('rowcontextmenu')

    @handler_rowcontextmenu.setter
    def handler_rowcontextmenu(self, menu):
        menu.container = self
        self._listeners['rowcontextmenu'] = menu

    def render_base_config(self):
        super(ExtGrid, self).render_base_config()
        if self.force_fit:
            self._view_config['forceFit'] = self.force_fit
        if self.show_preview:
            self._view_config['showPreview'] = self.show_preview
        if self.enable_row_body:
            self._view_config['enableRowBody'] = self.enable_row_body
        if self.get_row_class:
            self._view_config['getRowClass'] = self.get_row_class

        for args in (
            ('stripeRows', True),
            ('stateful', True),
            ('loadMask', self.load_mask),
            ('autoExpandColumn', self.auto_expand_column),
            ('editor', self.editor),
            ('view', self.t_render_view, self.view),
            ('store', self.t_render_store, self.get_store()),
            ('viewConfig', self._view_config),
            ('columnLines', self.column_lines, self.column_lines),
            ('enableDragDrop', self.drag_drop) if self.read_only else (),
            ('ddGroup', self.drag_drop_group) if self.read_only else (),
            ('fieldLabel', self.label) if self.label else (),
            (
                'clicksToEdit',
                self.clicks_to_edit, self.clicks_to_edit != 2
            ) if self.editor else (),
        ):
            if args:
                self._put_config_value(*args)

    def render_params(self):
        super(ExtGrid, self).render_params()

        handler_cont_menu = (
            self.handler_contextmenu.render
            if self.handler_contextmenu else ''
        )
        handler_rowcontextmenu = (
            self.handler_rowcontextmenu.render
            if self.handler_rowcontextmenu else ''
        )

        self._put_params_value(
            'menus',
            {
                'contextMenu': handler_cont_menu,
                'rowContextMenu': handler_rowcontextmenu
            }
        )
        if self.sm:
            self._put_params_value('selModel', self.sm.render)

        self._put_params_value('colModel', self.col_model.render)
        # проверим набор колонок на наличие фильтров,
        # если есть, то добавим плагин с фильтрами
        for col in self.columns:
            if col.filter:
                self.plugins.append(
                    u"new Ext.ux.grid.GridFilters({menuFilterText:'Фильтр'})")
                break
        self._put_params_value('plugins', self.t_render_plugins)

        if self.show_banded_columns:
            self._put_params_value(
                'bundedColumns', self.t_render_banded_columns)

    def render(self):
        try:
            self.pre_render()

            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError as msg:
            raise Exception(msg)

        config = self._get_config_str()
        params = self._get_params_str()
        return 'createGridPanel({%s}, {%s})' % (config, params)


class BaseExtGridColumn(ExtUIComponent):
    """
    Базовая модель колонки грида
    """
    # Умолчательная ширина колонок
    GRID_COLUMN_DEFAULT_WIDTH = 100

    # Рендерер для цен и сумм
    THOUSAND_CURRENCY_RENDERER = 'thousandCurrencyRenderer'

    def __init__(self, *args, **kwargs):
        super(BaseExtGridColumn, self).__init__(*args, **kwargs)

        # Заголовок
        self.header = None

        # Возможность сортировки
        self.sortable = False

        # Уникальное название колонки в пределах column model
        self.data_index = None

        # Расположение
        self.align = None

        # Ширина
        self.width = BaseExtGridColumn.GRID_COLUMN_DEFAULT_WIDTH

        # Редактор, если колонка может быть редактируемой
        self.editor = None

        # Список рендереров колонки
        self._column_renderer = []

        # Всплывающая подсказка
        self.tooltip = None

        # Признак того, скрыта ли колонка или нет
        self.hidden = False

        # Возможность разрешить скрывать/показывать колонку
        self.hideable = True

        # Признак не активности
        self.read_only = False

        # TODO: В версии 3.3 нет такого свойства
        self.colspan = None

        # Запрет на изменение ширины колонки
        self.fixed = False

        # Признак зафиксированности колонки
        # используется вместе с ExtGridLockingView + ExtGridLockingColumnModel
        self.locked = False

        # дополнительные атрибуты колонки
        self.extra = {}

        # Настройки фильтра колонки для плагина Ext.ux.grid.GridFilters
        self.filter = None

        self.menu_disabled = False

    def t_render_extra(self):
        lst = []
        for key in self.extra.keys():
            val = self.extra[key]

            if isinstance(val, BaseExtComponent):
                lst.append('%s:%s' % (key, val.render()))
            elif isinstance(val, bool):
                lst.append('%s:%s' % (key, str(val).lower()))
            elif isinstance(val, (int, str, six.text_type)):
                lst.append('%s:%s' % (key, val))
            else:  # пусть как хочет так и рендерится
                lst.append('%s:%s' % (key, val))
        return ','.join(lst)

    def render_editor(self):
        return self.editor.render()

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        self.read_only = access_off
        if self.editor and isinstance(self.editor, ExtUIComponent):
            self.editor.make_read_only(
                self.read_only, exclude_list, *args, **kwargs)

    def render_base_config(self):
        super(BaseExtGridColumn, self).render_base_config()
        for args in (
            ('header', self.header),
            ('sortable', self.sortable),
            ('dataIndex', self.data_index),
            ('align', self.align),
            ('editor', self.editor.render if self.editor else None),
            ('hidden', self.hidden),
            ('hideable', self.hideable),
            ('readOnly', self.read_only),
            ('colspan', self.colspan),
            ('fixed', self.fixed),
            ('locked', self.locked),
            ('renderer', self.render_column_renderer),
            ('tooltip', self.tooltip),
            ('filter', self.filter),
            ('menuDisabled', self.menu_disabled),
        ):
            self._put_config_value(*args)

        for i, render in enumerate(self._column_renderer):
            if BaseExtGridColumn.THOUSAND_CURRENCY_RENDERER == render:
                # Финансовый формат для Сумм и Цен
                # подразумевает прижимание к правому краю.
                thousand_column_renderer = (
                    '(function(val, metaData){ '
                    'metaData.attr="style=text-align:right"; '
                    'return %s.apply(this, arguments);}) '
                ) % BaseExtGridColumn.THOUSAND_CURRENCY_RENDERER
                self._column_renderer[i] = thousand_column_renderer

    @property
    def column_renderer(self):
        return ','.join(self._column_renderer)

    @column_renderer.setter
    def column_renderer(self, value):
        self._column_renderer.append(value)

    def render_column_renderer(self):
        """
        Кастомный рендеринг функций-рендерера колонок
        """
        if self._column_renderer:
            self._column_renderer.reverse()
            val = self._get_renderer_func(self._column_renderer)
            return (
                'function(val, metaData, record, rowIndex, '
                'colIndex, store){return %s}'
            ) % val
        return None

    def _get_renderer_func(self, list_renderers):
        """
        Рекурсивная функция, оборачивающая друг в друга рендереры колонок
        """
        if list_renderers:
            return '%s(%s, metaData, record, rowIndex, colIndex, store)' % (
                list_renderers[0],
                self._get_renderer_func(list_renderers[1:])
            )
        else:
            return 'val'


class ExtGridColumn(BaseExtGridColumn):
    """
    Модель колонки грида
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridColumn, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)

    def render(self):
        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)

        config = self._get_config_str()
        extra = self.t_render_extra()
        return '{%s}' % (config + ',' + extra if extra else config)


class ExtGridBooleanColumn(BaseExtGridColumn):
    """
    Модель булевой колонки грида
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridBooleanColumn, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-bool-column.js'
        self.text_false = None
        self.text_true = None
        self.text_undefined = None
        self.init_component(*args, **kwargs)


class ExtGridCheckColumn(BaseExtGridColumn):
    """
    Модель колонки грида, содержащей чекбоксы
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridCheckColumn, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-check-column.js'
        self.init_component(*args, **kwargs)


class ExtGridNumberColumn(BaseExtGridColumn):
    """
    Модель колонки грида, содержащей числа
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridNumberColumn, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-number-column.js'
        self.format = None
        self.init_component(*args, **kwargs)


class ExtGridDateColumn(BaseExtGridColumn):
    """
    Модель колонки грида с форматом даты
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridDateColumn, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-date-column.js'
        try:
            self.format = settings.DATE_FORMAT.replace('%', '')
        except AttributeError:
            self.format = 'd.m.Y'

        self.init_component(*args, **kwargs)


class BaseExtGridSelModel(BaseExtComponent):
    """
    Базовая модель для грида с выбором
    """
    def __init__(self, *args, **kwargs):
        super(BaseExtGridSelModel, self).__init__(*args, **kwargs)


class ExtGridCheckBoxSelModel(BaseExtGridSelModel):
    """
    Модель для грида с возможностью выбора ячейки
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridCheckBoxSelModel, self).__init__(*args, **kwargs)
        self.single_select = False
        self.check_only = False
        self.init_component(*args, **kwargs)

    def render(self):
        self._put_config_value('singleSelect', self.single_select)
        self._put_config_value('checkOnly', self.check_only)
        return 'new Ext.grid.CheckboxSelectionModel({ %s })' % (
            self._get_config_str())


class ExtGridRowSelModel(BaseExtGridSelModel):
    """
    Модель для грида с выбором строк
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridRowSelModel, self).__init__(*args, **kwargs)
        self.single_select = True
        self.init_component(*args, **kwargs)

    def render(self):
        single_sel = 'singleSelect: true'
        if not self.single_select:
            single_sel = 'singleSelect: false'
        return 'new Ext.grid.RowSelectionModel({ %s })' % single_sel


class ExtGridCellSelModel(BaseExtGridSelModel):
    """
    Модель для грида с выбором ячеек
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridCellSelModel, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)

    def render(self):
        return 'new Ext.grid.CellSelectionModel()'


class ExtGridDefaultColumnModel(BaseExtComponent):
    """
    Модель колонок для грида по-умолчанию
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridDefaultColumnModel, self).__init__(*args, **kwargs)
        self.__grid = None
        self.init_component(*args, **kwargs)

    @property
    def grid(self):
        if self.__grid is not None:
            return self.__grid()

    @grid.setter
    def grid(self, value):
        self.__grid = weakref.ref(value)

    def render(self):
        return 'new Ext.grid.ColumnModel({columns:%s})' % (
            self.grid.t_render_columns())


class ExtGridLockingColumnModel(BaseExtComponent):
    """
    Модель колонок для грида блокирования
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridLockingColumnModel, self).__init__(*args, **kwargs)
        self.__grid = None
        self.init_component(*args, **kwargs)

    @property
    def grid(self):
        if self.__grid is not None:
            return self.__grid()

    @grid.setter
    def grid(self, value):
        self.__grid = weakref.ref(value)

    def render(self):
        return 'new Ext.ux.grid.LockingColumnModel({columns:%s})' % (
            self.grid.t_render_columns())


class ExtGridGroupingView(BaseExtComponent):
    """
    Компонент используемый для группировки
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridGroupingView, self).__init__(*args, **kwargs)
        self.force_fit = True
        self.show_preview = False
        self.enable_row_body = False
        self.get_row_class = None
        self.group_text_template = '{text} ({[values.rs.length]})'
        self.init_component(*args, **kwargs)

    def render_params(self):
        super(ExtGridGroupingView, self).render_params()
        if self.force_fit:
            self._put_params_value('forceFit', self.force_fit)
        if self.show_preview:
            self._put_params_value('showPreview', self.show_preview)
        if self.enable_row_body:
            self._put_params_value('enableRowBody', self.enable_row_body)
        if self.get_row_class:
            self._put_params_value('getRowClass', self.get_row_class)
        self._put_params_value('groupTextTpl', self.group_text_template)

    def render(self):
        try:
            self.pre_render()
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError as msg:
            raise Exception(msg)
        params = self._get_params_str()
        return 'new Ext.grid.GroupingView({%s})' % params


class ExtGridLockingView(BaseExtComponent):
    """
    Компонент используемый для блокирования колонок
    """
    def __init__(self, *args, **kwargs):
        super(ExtGridLockingView, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)

    def render(self):
        result = 'new Ext.ux.grid.LockingGridView()'
        return result


class ExtLiveGridCheckBoxSelModel(ExtGridCheckBoxSelModel):
    """
    Модель выбора для live-грида с возможностью отметки чек-боксом
    """
    def __init__(self, *args, **kwargs):
        super(ExtLiveGridCheckBoxSelModel, self).__init__(*args, **kwargs)
        self.single_select = False
        self.check_only = False
        self.init_component(*args, **kwargs)

    def render(self):
        self._put_config_value('singleSelect', self.single_select)
        self._put_config_value('checkOnly', self.check_only)
        return 'new Ext.ux.grid.livegrid.CheckboxSelectionModel({ %s })' % (
            self._get_config_str())


class ExtLiveGridRowSelModel(ExtGridRowSelModel):
    """
    Модель выбора для live-грида с выбором строк
    """
    def __init__(self, *args, **kwargs):
        super(ExtLiveGridRowSelModel, self).__init__(*args, **kwargs)
        self.single_select = False
        self.init_component(*args, **kwargs)

    def render(self):
        single_sel = 'singleSelect: true' if self.single_select else ''
        return 'new Ext.ux.grid.livegrid.RowSelectionModel({ %s })' % (
            single_sel)


class ExtGridLockingHeaderGroupPlugin(BaseExtComponent):
    """
    Плагин для группировки и одновременного закрепления колонок
    """

    def __init__(self, config):
        """
        :param dict config: Конфигурация плагина, описание выше
        """
        super(ExtGridLockingHeaderGroupPlugin, self).__init__()
        self._ext_name = 'Ext.ux.grid.LockingGridColumnWithHeaderGroup'
        self.config = config

    def render(self):
        return 'new %s(%s)' % (self._ext_name, json.dumps(self.config))

    @classmethod
    def configure_grid(cls, grid, locked_count=1, config=None):
        """
        Конфигурирует grid для работы с собой, как плагином
        :param grid: Конфигурируемый grid
        :type grid: ExtGrid
        :param locked_count: Кол-во фиксируемых колонок
        :type locked_count: int
        :param config: дополнительная конфигурация
        :type config: dict
        """
        # адаптация колонок
        rows = [
            [
                {'header': c.header, 'colspan': c.colspan, 'align': c.align}
                for c in cs
            ]
            for cs in grid.banded_columns.values()
        ]
        grid.banded_columns = {}

        # настройка плагина
        plugin_config = {
            'columnModelCfg': {
                'rows': rows,
                'lockedCount': locked_count
            },
            'viewCfg': {
                'hideGroupedColumn': True
            }
        }
        if config is not None:
            plugin_config.update(config)
        grid.plugins.append(cls(plugin_config))

        # настройка store
        from m3_ext.ui.misc.store import ExtGroupingStore, ExtJsonReader
        store = ExtGroupingStore(
            url=grid.store.url, auto_load=grid.store.auto_load)
        store.reader = ExtJsonReader(total_property='total', root='rows')
        store.reader.set_fields(*grid.columns)
        grid.set_store(store)
