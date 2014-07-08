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
        col_model='cm',  # deprecation: backwards compat - use cm
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
        'col_model',  # use cm
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
        self.setdefault('border', False)

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
            self.banded_columns += [
               [] for _ in range(1 + level - len(self.banded_columns))
            ]
        self.banded_columns[level].append(column)

    def clear_banded_columns(self):
        """
        Удаляет все объединенные колонки из грида
        """
        self.banded_columns = []

    @_must_be_replaced_by('use store attr')
    def set_store(self, store):
        self.store = store

    @_must_be_replaced_by('use store attr')
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
        clicks_to_edit='clicksToEdit',  # Сколько раз нужно щелкнуть для редактирования ячейки.
    )

    def __init__(self, *args, **kwargs):
        super(ExtEditorGrid, self).__init__(*args, **kwargs)
        self.setdefault('clicks_to_edit', 2)


class ExtGridColumn(BaseExtComponent):
    """
    Базовая модель колонки грида
    """
    # Умолчательная ширина колонок
    GRID_COLUMN_DEFAULT_WIDTH = 100

    _xtype = 'gridcolumn'

    js_attrs = BaseExtComponent.js_attrs.extend(
        'header',  # Заголовок
        'align',  # Расположение
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
        'css',  # Класс стиля
        'renderer',  # Имя метода/функции рендерера
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
        super(ExtGridColumn, self).__init__(*args, **kwargs)
        self.setdefault('sortable', False)
        self.setdefault('width', ExtGridColumn.GRID_COLUMN_DEFAULT_WIDTH)
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


class ExtGridBooleanColumn(ExtGridColumn):
    """
    Модель булевой колонки грида
    """
    _xtype = 'booleancolumn'

    js_attrs = ExtGridColumn.js_attrs.extend(
        text_false='falseText',
        text_true='trueText',
        text_undefined='undefinedText',
    )

    def __init__(self, *args, **kwargs):
        super(ExtGridBooleanColumn, self).__init__(*args, **kwargs)
        self.setdefault('text_false', 'false')
        self.setdefault('text_true', 'true')


class ExtGridCheckColumn(ExtGridColumn):
    """
    Модель колонки грида, содержащей чекбоксы
    """
    _xtype = 'checkcolumn'


class ExtGridNumberColumn(ExtGridColumn):
    """
    Модель колонки грида, содержащей числа
    """
    _xtype = 'numbercolumn'


class ExtGridDateColumn(ExtGridColumn):
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


class ExtGridCheckBoxSelModel(BaseExtComponent):
    """
    Модель для грида с возможностью выбора ячейки
    """
    _xtype = 'sm-checkbox'

    js_attrs = BaseExtComponent.js_attrs.extend(
        single_select='singleSelect',
        check_only='checkOnly',
    )

    def __init__(self, *args, **kwargs):
        super(ExtGridCheckBoxSelModel, self).__init__(*args, **kwargs)
        self.setdefault('single_select', False)
        self.setdefault('check_only', False)


class ExtGridRowSelModel(BaseExtComponent):
    """
    Модель для грида с выбором строк
    """
    _xtype = 'sm-row'

    js_attrs = BaseExtComponent.js_attrs.extend(
        single_select='singleSelect',
    )

    def __init__(self, *args, **kwargs):
        super(ExtGridRowSelModel, self).__init__(*args, **kwargs)
        self.setdefault('single_select', False)


class ExtGridCellSelModel(BaseExtComponent):
    """
    Модель для грида с выбором ячеек
    """
    _xtype = 'sm-cell'


class ExtGridGroupingView(BaseExtComponent):
    """
    Компонент используемый для view-группировки
    """

    _xtype = 'view-grouping'

    js_attrs = BaseExtComponent.js_attrs.extend(
        force_fit='forceFit',
        show_preview='showPreview',
        enable_row_body='enableRowBody',
        get_row_class='getRowClass',
        group_text_template='groupTextTpl',
    )

    def __init__(self, *args, **kwargs):
        super(ExtGridGroupingView, self).__init__(*args, **kwargs)
        self.setdefault('force_fit', True)
        self.setdefault('show_preview', False)
        self.setdefault('enable_row_body', False)
        self.setdefault('group_text_template', '{text} ({[values.rs.length]})')


class ExtLiveGridCheckBoxSelModel(ExtGridCheckBoxSelModel):
    """
    Модель выбора для live-грида с возможностью отметки чек-боксом
    """
    _xtype = 'sm-live-checkbox'


class ExtLiveGridRowSelModel(ExtGridRowSelModel):
    """
    Модель выбора для live-грида с выбором строк
    """
    _xtype = 'sm-live-row'


class ExtGridLockingHeaderGroupPlugin(BaseExtComponent):
    """
    Плагин для группировки и одновременного закрепления колонок
    """

    ptype = 'm3-locking-column-header-group'

    js_attrs = BaseExtComponent.js_attrs.extend(
        'ptype',
        column_model_cfg='columnModelCfg',
        rows='columnModelCfg.rows',
        locked_count='columnModelCfg.lockedCount',

        view_cfg='viewCfg',
        hide_group_column='viewCfg.hideGroupedColumn',
    )

    def __init__(self, *args, **kwargs):
        """
        :param dict config: Конфигурация плагина, описание выше
        """
        super(ExtGridLockingHeaderGroupPlugin, self).__init__(*args, **kwargs)
        self.setdefault('ptype', self.ptype)

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
                {'header': c.header,
                 'colspan': c.colspan,
                 'align': c.align}
                for c in cs
            ]
            for cs in grid.banded_columns
        ]
        grid.banded_columns = []

        # настройка плагина
        plugin_config = dict(rows=rows,
                             locked_count=locked_count,
                             hide_group_column=True)

        if config is not None:
            plugin_config.update(config)
        grid.plugins.append(cls(**plugin_config))

        # настройка store
        from m3_ext.ui.misc.store import ExtGroupingStore

        store = ExtGroupingStore(
            url=grid.store.url,
            auto_load=grid.store.auto_load,
            total_property='total',
            root='rows',
            fields=[dict(name=i.data_index, mapping=i.data_index) for i in grid.columns])

        grid.store = store
