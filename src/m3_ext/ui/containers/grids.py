#coding:utf-8
"""
Created on 3.3.2010

@author: prefer
"""
import json
from django.conf import settings
from django.utils.datastructures import SortedDict

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
        'columns', 'stripeRows', 'stateful', 'store',
        'params', 'viewConfig',
        # selection model
        'sm',
        # grid view
        'view',
        # модель колонок
        'cm',
        column_lines='columnLines',
        load_mask='loadMask',
        auto_expand_column='autoExpandColumn',
        drag_drop='enableDragDrop',
        drag_drop_group='ddGroup',
        handler_contextmenu='params.menus.contextMenu',
        handler_rowcontextmenu='params.menus.rowContextMenu',
        force_fit='viewConfig.forceFit',
        show_preview='viewConfig.showPreview',
        enable_row_body='viewConfig.enableRowBody',
    )

    deprecated_attrs = BaseExtPanel.deprecated_attrs+('editor',)

    # TODO: Реализовать человеческий MVC грид

    def __init__(self, *args, **kwargs):
        super(ExtGrid, self).__init__(*args, **kwargs)
        self.setdefault('columns', [])

        # Объект маскирования, который будет отображаться при загрузке
        self.setdefault('load_mask', False)

        self.setdefault('drag_drop', False)
        self.setdefault('drag_drop_group', None)

        # Контекстное меню грида
        self.setdefault('handler_contextmenu', None)
        # Контекстное меню строки
        self.setdefault('handler_rowcontextmenu', None)

        # Колонка для авторасширения
        self.setdefault('auto_expand_column', None)

        # устанавливается True, если sm=CheckBoxSelectionModel. Этот флаг нужен
        # чтобы знать когда нужен дополнительный column
        self.__checkbox = False

        # перечень плагинов
        self.plugins = []

        self.setdefault('show_preview', False)
        self.setdefault('enable_row_body', False)
        self.get_row_class = None
        # Разворачивать колонки грида по всей ширине (True)
        self.setdefault('force_fit', True)

        # Раскраска строк черз одну
        self.setdefault('stripeRows', True)

        # A flag which causes the Component to attempt to restore the state
        # of internal properties from a saved state on startup
        self.setdefault('stateful', True)

        # признак отображения вертикальных линий в гриде
        self.setdefault('column_lines', True)

        #Если True не рендерим drag and drop, выключаем editor
        self.read_only = False

        # protected
        self.show_banded_columns = False
        self.banded_columns = SortedDict()

    def t_render_plugins(self):
        """
        Рендеринг плагинов
        """
        res = []
        for plugin in self.plugins:
            res.append(plugin.render() if hasattr(plugin, 'render') else plugin)

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
        #чтобы их можно было
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

    # FIXME: оставлено для совместимости
    def set_store(self, store):
        self.store = store

    # FIXME: для совместимости
    def get_store(self):
        return self.store

    # FIXME: для совместимости
    def columns_to_store(self):
        """
        Формируем поля стора, в зависимости от колонок грида
        """
        if self.store:
            self.store.fields = []
            # FIXME: в полях стора всегда была одна колонка с id
            self.store.fields.append(self.store.id_property)
            for column in self.columns:
                # FIXME: вообще, поля в сторе можно формировать не только по имени
                # но и с типом
                self.store.fields.append(column.data_index)

    # FIXME: избавиться от make_read_only
    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        super(ExtGrid, self)._make_read_only(
            access_off, exclude_list, *args, **kwargs)
        self.read_only = access_off
        if self.columns:
            for column in self.columns:
                column.make_read_only(
                    self.read_only, exclude_list, *args, **kwargs)

        # убираем редактирование записи по даблклику
        self.handler_dblclick = 'Ext.emptyFn'

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

    def pre_render(self):
        super(ExtGrid, self).pre_render()
        if self.store:
            self.store.action_context = self.action_context

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

    def render_base_config(self):
        super(ExtGrid, self).render_base_config()
        # FIXME: здесь должен быть js-метод, который возвращал класс
        # как его сделать в текущих реалиях - не знаю
        if self.get_row_class:
            self._view_config['getRowClass'] = self.get_row_class

        for args in (
            ('view', self.t_render_view, self.view),
        ):
            if args:
                self._put_config_value(*args)

    def render_params(self):
        super(ExtGrid, self).render_params()

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
        # Заголовок
        'header',
        # Расположение
        'align', 'width', 'sortable',
        'format',
        # Признак того, скрыта ли колонка или нет
        'hidden',
        # Редактор, если колонка может быть редактируемой
        'editor',
        # Всплывающая подсказка
        'tooltip',
        # Настройки фильтра колонки для плагина Ext.ux.grid.GridFilters
        'filter',
        'fixed',
        'locked',
        # Уникальное название колонки в пределах column model
        data_index='dataIndex',
        menu_disabled='menuDisabled',
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtGridColumn, self).__init__(*args, **kwargs)

        # Возможность сортировки
        self.setdefault('sortable', False)

        # Ширина
        self.setdefault('width', BaseExtGridColumn.GRID_COLUMN_DEFAULT_WIDTH)

        # Запрет на изменение ширины колонки
        self.setdefault('fixed', False)

        # Признак зафиксированности колонки
        # используется вместе с ExtGridLockingView + ExtGridLockingColumnModel
        self.setdefault('locked', False)

        # FIXME: придумать как избавиться от этого
        # дополнительные атрибуты колонки
        self.extra = {}

        self.setdefault('menu_disabled', False)

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
