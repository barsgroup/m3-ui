#coding:utf-8
"""
Created on 3.3.2010


"""
import json

from django.conf import settings

from m3.actions import _must_be_replaced_by
from m3_ext.ui.base import ExtUIComponent, BaseExtComponent

from base import BaseExtPanel


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

    #FIXME: придумать как передавать action_context
    # def pre_render(self):
    #     super(ExtGrid, self).pre_render()
    #     if self.store:
    #         self.store.action_context = self.action_context

    _xtype = 'm3-grid'

    js_attrs = BaseExtPanel.js_attrs.extend(
        'columns',

        # A flag which causes the Component to attempt to restore the state
        # of internal properties from a saved state on startup
        'stateful',
        'store',
        'params',
        'sm',  # selection model
        'view',  # grid view
        'cm',  # модель колонок
        'plugins',  # список плагинов
        view_config='viewConfig',
        stripe_rows='stripeRows',  # Раскраска строк черз одну
        column_lines='columnLines',  # Признак отображения вертикальных линий в гриде
        load_mask='loadMask',  # Объект маскирования, который будет отображаться при загрузке
        auto_expand_column='autoExpandColumn',  # Колонка для авторасширения
        drag_drop='enableDragDrop',
        drag_drop_group='ddGroup',
        handler_contextmenu='params.contextMenu',  # Контекстное меню грида
        handler_rowcontextmenu='params.rowContextMenu',  # Контекстное меню строки
        force_fit='viewConfig.forceFit',  # Разворачивать колонки грида по всей ширине (True)
        show_preview='viewConfig.showPreview',
        enable_row_body='viewConfig.enableRowBody',
        banded_columns='params.bandedColumns',  # Группировочные колонки
        header_style='viewConfig.headerStyle',
    )

    deprecated_attrs = BaseExtPanel.deprecated_attrs + (
        '_view_config',  # use view_config
        'editor',  # use ExtEditorGrid
        'handler_click',  # через js
        'handler_dblclick',  # через js
        'get_row_class',  # через js
        'handler_dblclick',
    )

    def __init__(self, *args, **kwargs):
        super(ExtGrid, self).__init__(*args, **kwargs)
        self.setdefault('columns', [])
        self.setdefault('view_config', {})
        self.setdefault('load_mask', False)
        self.setdefault('drag_drop', False)
        self.setdefault('plugins', [])
        self.setdefault('show_preview', False)
        self.setdefault('enable_row_body', False)
        self.setdefault('force_fit', True)
        self.setdefault('stripe_rows', True)
        self.setdefault('stateful', True)
        self.setdefault('column_lines', True)
        self.setdefault('banded_columns', [])

        #Если True не рендерим drag and drop, выключаем editor
        self.setdefault('read_only', False)

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

    def add_banded_column(self, column=None, level=0, colspan=1):
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
        assert isinstance(level, int)
        assert isinstance(colspan, int)
        assert isinstance(column, ExtGridColumn) or not column

        if not column:
            column = {'colspan': colspan}
        else:
            column.colspan = colspan

        if len(self.banded_columns) <= level:
            # дополним список уровней до нужного level
            self.banded_columns += [[]]*(1 + level - len(self.banded_columns))
        self.banded_columns[level].append(column)

    def clear_banded_columns(self):
        """
        Удаляет все объединенные колонки из грида
        """
        self.banded_columns = []

    @_must_be_replaced_by('store')
    def set_store(self, store):
        self.store = store

    @_must_be_replaced_by('store')
    def get_store(self):
        return self.store


    # FIXME: перенести make_read_only в js-код
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


class ExtEditorGrid(ExtGrid):
    """
    Редактируемый грид
    """

    _xtype = 'm3-edit-grid'

    js_attrs = ExtGrid.js_attrs.extend(
        clicks_to_edit='clicksToEdit',
    )

    def __init__(self, *args, **kwargs):
        super(ExtEditorGrid, self).__init__(*args, **kwargs)
        # Сколько раз нужно щелкнуть для редактирования ячейки.
        # Только для EditorGridPanel
        self.setdefault('clicks_to_edit', 2)


class BaseExtGridColumn(BaseExtComponent):
    """
    Базовая модель колонки грида
    """
    # Умолчательная ширина колонок
    GRID_COLUMN_DEFAULT_WIDTH = 100

    _xtype = 'gridcolumn'

    js_attrs = BaseExtComponent.js_attrs.extend(
        'header',  # Заголовок
        'align',   # Расположение
        'width',  # Ширина
        'sortable',  # Возможность сортировки
        'format',
        'hidden',  # Признак того, скрыта ли колонка или нет
        'editor',  # Редактор, если колонка может быть редактируемой
        'tooltip',  # Всплывающая подсказка
        'filter',  # Настройки фильтра колонки для плагина Ext.ux.grid.GridFilters
        'fixed',  # Запрет на изменение ширины колонки
        'locked',  # Признак зафиксированности колонки, use вместе с ExtGridLockingView и ExtGridLockingColumnModel
        'colspan',  # продолжительность для группировочной колонки
        'hideable',  # Возможность скрываться
        'groupable',  # Возможность группироваться, только для таблиц с группировкой
        'filter',  # Компонент фильтра
        'css',  # Класс стиля
        data_index='dataIndex',  # Уникальное название колонки в пределах column model
        menu_disabled='menuDisabled',
        summary_type='summaryType',  # Тип группировки: "sum", "count"..., только для таблиц с группировкой
        name_field='nameField',  # Имя поля для расшифровки, только для таблиц с группировкой
    )

    # кортеж атрибутов, которые считаются устаревшими
    deprecated_attrs = BaseExtComponent.deprecated_attrs + (
        'extra',  # перенести в обычные атрибуты колонки
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtGridColumn, self).__init__(*args, **kwargs)
        self.setdefault('sortable', False)
        self.setdefault('width', BaseExtGridColumn.GRID_COLUMN_DEFAULT_WIDTH)
        self.setdefault('fixed', False)
        self.setdefault('locked', False)
        self.setdefault('menu_disabled', False)

        # FIXME: будет удалено
        # дополнительные атрибуты колонки
        self.setdefault('extra', {})

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):

        self.read_only = access_off
        if self.editor and isinstance(self.editor, ExtUIComponent):
            self.editor.make_read_only(
                self.read_only, exclude_list, *args, **kwargs)


class ExtGridColumn(BaseExtGridColumn):
    """
    Модель колонки грида
    """
    pass


class ExtGridBooleanColumn(BaseExtGridColumn):
    """
    Модель булевой колонки грида
    """
    _xtype = 'booleancolumn'

    js_attrs = BaseExtGridColumn.js_attrs.extend(
        text_false='falseText',
        text_true='trueText',
        text_undefined='undefinedText',
    )

    def __init__(self, *args, **kwargs):
        super(ExtGridBooleanColumn, self).__init__(*args, **kwargs)
        self.setdefault('text_false', 'false')
        self.setdefault('text_true', 'true')


class ExtGridCheckColumn(BaseExtGridColumn):
    """
    Модель колонки грида, содержащей чекбоксы
    """
    _xtype = 'checkcolumn'


class ExtGridNumberColumn(BaseExtGridColumn):
    """
    Модель колонки грида, содержащей числа
    """
    _xtype = 'numbercolumn'


class ExtGridDateColumn(BaseExtGridColumn):
    """
    Модель колонки грида с форматом даты
    """
    _xtype = 'datecolumn'

    def __init__(self, *args, **kwargs):
        super(ExtGridDateColumn, self).__init__(*args, **kwargs)
        try:
            self.format = settings.DATE_FORMAT.replace('%', '')
        except AttributeError:
            self.format = 'd.m.Y'


class BaseExtGridSelModel(BaseExtComponent):
    """
    Базовая модель для грида с выбором
    """
    pass

class ExtGridCheckBoxSelModel(BaseExtGridSelModel):
    """
    Модель для грида с возможностью выбора ячейки
    """
    _xtype = 'sm-checkbox'

    js_attrs = BaseExtGridSelModel.js_attrs.extend(
        single_select='singleSelect',
        check_only='checkOnly',
    )

    def __init__(self, *args, **kwargs):
        super(ExtGridCheckBoxSelModel, self).__init__(*args, **kwargs)
        self.setdefault('single_select', False)
        self.setdefault('check_only', False)


class ExtGridRowSelModel(BaseExtGridSelModel):
    """
    Модель для грида с выбором строк
    """
    _xtype = 'sm-row'

    js_attrs = BaseExtGridSelModel.js_attrs.extend(
        single_select='singleSelect',
    )

    def __init__(self, *args, **kwargs):
        super(ExtGridRowSelModel, self).__init__(*args, **kwargs)
        self.setdefault('single_select', False)


class ExtGridCellSelModel(BaseExtGridSelModel):
    """
    Модель для грида с выбором ячеек
    """
    _xtype = 'sm-cell'


class ExtGridDefaultColumnModel(BaseExtComponent):
    """
    Модель колонок для грида по-умолчанию
    """
    # TODO: Этот класс, т.к. ссылка на грид порождает цикличную связь
    def __init__(self, *args, **kwargs):
        super(ExtGridDefaultColumnModel, self).__init__(*args, **kwargs)
        self.grid = None

    def render(self):
        return 'new Ext.grid.ColumnModel({columns:%s})' % (
            self.grid.t_render_columns())


class ExtGridLockingColumnModel(BaseExtComponent):
    """
    Модель колонок для грида блокирования
    """
    # TODO: Этот класс, т.к. ссылка на грид порождает цикличную связь
    def __init__(self, *args, **kwargs):
        super(ExtGridLockingColumnModel, self).__init__(*args, **kwargs)
        self.grid = None
        self.init_component(*args, **kwargs)

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
