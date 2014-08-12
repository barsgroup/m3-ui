# coding: utf-8
"""
Модуль с преднастроенными панелями-гридами

Created on 26.05.2010
"""

from m3_ext.ui import containers, controls, menus, misc
from m3_ext.ui.base import ExtUIComponent


class ExtObjectGrid(containers.ExtGrid):
    """
    Панель с гридом для управления списком объектов.
    """
    # ==========================================================================
    # Внутренние классы для ExtObjectGrid
    #=========================================================================
    class GridContextMenu(menus.ExtContextMenu):
        """
        Внутренний класс для удобной работы с контекстным меню грида
        """

        def __init__(self, *args, **kwargs):
            super(ExtObjectGrid.GridContextMenu, self).__init__(
                *args, **kwargs)

            self.menuitem_new = menus.ExtContextMenuItem(
                text=u'Добавить',
                icon_cls='add_item'
            )
            self.menuitem_edit = menus.ExtContextMenuItem(
                text=u'Изменить',
                icon_cls='edit_item'
            )
            self.menuitem_delete = menus.ExtContextMenuItem(
                text=u'Удалить',
                icon_cls='delete_item'
            )
            self.menuitem_separator = menus.ExtContextMenuSeparator()

            self.menuitem_refresh = menus.ExtContextMenuItem(
                text=u'Обновить',
                icon_cls='x-tbar-loading'
            )

            self.items.extend([
                self.menuitem_new,
                self.menuitem_edit,
                self.menuitem_delete,
                self.menuitem_separator,
                self.menuitem_refresh
            ])

    class GridTopBar(containers.ExtToolBar):
        """
        Внутренний класс для удобной работы топбаром грида
        """

        def __init__(self, *args, **kwargs):
            super(ExtObjectGrid.GridTopBar, self).__init__(*args, **kwargs)
            self.button_new = controls.ExtButton(
                text=u'Добавить',
                icon_cls='add_item'
            )
            self.button_edit = controls.ExtButton(
                text=u'Изменить',
                icon_cls='edit_item'
            )
            self.button_delete = controls.ExtButton(
                text=u'Удалить',
                icon_cls='delete_item'
            )
            self.button_refresh = controls.ExtButton(
                text=u'Обновить',
                icon_cls='x-tbar-loading'
            )

            self.items.extend([
                self.button_new,
                self.button_edit,
                self.button_delete,
                self.button_refresh,
            ])

    _xtype = 'm3-object-grid'

    js_attrs = containers.ExtGrid.js_attrs.extend(
        allow_paging='params.allowPaging',  # Использовать постраничную навигацию
        row_id_name='params.rowIdName',  # Поля для id записи
        column_param_name='params.columnParamName',  # Имя параметра, через который передается имя выделенной колонки

        # Признак редактирования на клиентеpaging_bar - особенным образом обрабатываются данные при редактировании
        local_edit='params.localEdit',
        url_new='params.actions.newUrl',  # Адрес для новой записи.
        url_edit='params.actions.editUrl',  # Адрес для изменения
        url_delete='params.actions.deleteUrl',  # Адрес для удаления
        url_data='params.actions.dataUrl',  # Адрес для данных
    )

    deprecated_attrs = containers.ExtGrid.deprecated_attrs + (
        'handler_beforenew',
        'handler_beforeedit',
    )

    def __init__(self, *args, **kwargs):
        super(ExtObjectGrid, self).__init__(*args, **kwargs)

        #======================================================================
        # Действия, выполняемые изнутри грида
        #======================================================================

        # Экшен для новой записи
        self.setdefault('action_new', None)

        # Экшен для  изменения
        self.setdefault('action_edit', None)

        # Экшен для удаления
        self.setdefault('action_delete', None)

        # Экшен для данных
        self.setdefault('action_data', None)

        #======================================================================
        # Источник данных для грида
        #======================================================================

        # Стор для загрузки данных
        self.setdefault('store', misc.ExtJsonStore(
            auto_load=True,
            root='rows', id_property='id'
        ))
        # Вместо load_mask сейчас маскирование окна
        # self.setdefault('load_mask', True)
        self.setdefault('row_id_name', 'row_id')
        self.setdefault('column_param_name', 'column')
        self.setdefault('allow_paging', True)

        #======================================================================
        # Контекстное меню и бары грида
        #======================================================================

        # Контекстное меню для строки грида
        self.setdefault('handler_rowcontextmenu',
                        ExtObjectGrid.GridContextMenu())

        # Контекстное меню для грида, если произошел счелчок не на строке
        self.setdefault('handler_contextmenu',
                        ExtObjectGrid.GridContextMenu())

        # Топ бар для грида
        self.setdefault('top_bar', ExtObjectGrid.GridTopBar())

        # Paging бар для постраничной навигации
        self.setdefault('paging_bar', containers.ExtPagingBar())

        # Признак локального редактирования
        self.setdefault('local_edit', False)

        # Атрибут store из store baseParams вынесен,
        # для одновременного изменения с атрибутом page_size paging_bar-а
        self.setdefault('limit', 25)

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        self.read_only = access_off
        if self.top_bar:
            exclude_list = list(exclude_list)+[self.top_bar.button_refresh]
        # Выключаем\включаем компоненты.
        for item in (
            self.handler_contextmenu.menuitem_new,
            self.handler_contextmenu.menuitem_edit,
            self.handler_contextmenu.menuitem_delete,
            self.handler_rowcontextmenu.menuitem_new,
            self.handler_rowcontextmenu.menuitem_edit,
            self.handler_rowcontextmenu.menuitem_delete,
            self.handler_rowcontextmenu,
        ):
            if hasattr(item, 'make_read_only') and callable(
                        item.make_read_only):
                item.make_read_only(
                    access_off, exclude_list, *args, **kwargs
                )
        if hasattr(self.top_bar, 'items') and self.top_bar.items:
            for item in self.top_bar.items:
                if hasattr(item, 'make_read_only') and callable(
                        item.make_read_only):
                    item.make_read_only(
                        access_off, exclude_list, *args, **kwargs)


class ExtMultiGroupinGrid(containers.ExtGrid):
    """
    Грид с возможностью множественной группировки колонок.
    Обработка группировки происходит на сервере
    .. seealso::
        m3.helpers.datagrouping
    """

    class GridExportMenu(menus.ExtContextMenu):
        """
        Внутренний класс для удобной работы с контекстным меню грида
        """

        def __init__(self, *args, **kwargs):
            super(ExtMultiGroupinGrid.GridExportMenu, self).__init__(
                *args, **kwargs)
            self.xls = menus.ExtContextMenuItem(
                text=u'XLS (Excel2003 до 65000 строк)',
                handler='function(){exportData("xls");}')
            self.csv = menus.ExtContextMenuItem(
                text=u'CSV (разделитель ";")',
                handler='function(){exportData("csv");}')

            self.items.extend([
                self.xls,
                self.csv,
            ])

    class LiveGridTopBar(containers.ExtToolBar):
        """
        Внутренний класс для удобной работы топбаром грида
        """

        def __init__(self, *args, **kwargs):
            super(ExtMultiGroupinGrid.LiveGridTopBar, self).__init__(
                *args, **kwargs)
            self.button_new = controls.ExtButton(
                text=u'Добавить',
                icon_cls='add_item',
                handler='topBarNew'
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
            self.button_export = controls.ExtButton(
                text=u'Экспорт',
                icon_cls='icon-table-go',
                menu=ExtMultiGroupinGrid.GridExportMenu(
                )
            )

            self.items.extend([
                self.button_new,
                self.button_edit,
                self.button_delete,
                self.button_export,
            ])

    _xtype = 'm3-multigrouping-grid'

    js_attrs = containers.ExtGrid.js_attrs.extend(
        groupable='params.groupable',
        row_id_name='params.rowIdName',  # Поля для id записи

        # Признак редактирования на клиенте - особенным образом обрабатываются данные при редактировании
        local_edit='params.localEdit',
        url_new='params.actions.newUrl',  # Адрес для новой записи.
        url_edit='params.actions.editUrl',  # Адрес для изменения
        url_delete='params.actions.deleteUrl',  # Адрес для удаления
        url_data='params.actions.dataUrl',  # Адрес для данных
        url_export='params.actions.exportUrl',  # Адрес для выгрузки
        buffer_size='viewConfig.bufferSize',
        near_limit='viewConfig.nearLimit',
        data_id_field='params.dataIdField',
        data_display_field='params.dataDisplayField',
        display_info='params.displayInfo',
        display_message='params.displayMsg',
        grouped='params.groupedColumns',
    )

    deprecated_attrs = containers.ExtGrid.deprecated_attrs + (
        'handler_beforenew',
        'handler_beforeedit',
    )

    def __init__(self, *args, **kwargs):
        super(ExtMultiGroupinGrid, self).__init__(*args, **kwargs)
        # Поле в котором будет содержаться значение ключа группировки
        # должно отличаться от ключевого поля Store,
        # т.к. должно содержать совсем другие данные
        self.setdefault('data_id_field', 'id')

        # Поле отображаемое вместо идентификатора группировки
        # (по-умолчанию отображается сам идентификатор)
        self.setdefault('data_display_field', 'id')

        # Поля группировки по-умолчанию (список имен полей)
        self.setdefault('grouped', [])

        # Экшен для новой записи
        self.setdefault('action_new', None)

        # Экшен для  изменения
        self.setdefault('action_edit', None)

        # Экшен для удаления
        self.setdefault('action_delete', None)

        # Экшен для данных
        self.setdefault('action_data', None)

        # Экшен для экспорта
        self.setdefault('action_export', None)

        # Поля для id записи
        self.setdefault('row_id_name', 'row_id')

        # Топ бар для грида
        self.setdefault('top_bar', ExtMultiGroupinGrid.LiveGridTopBar())

        # Признак того, маскировать ли грид при загрузки
        self.setdefault('load_mask', True)

        # Стор для загрузки данных
        self.store = misc.ExtMultiGroupingStore(
            auto_load=True, root='rows', id_property='index')

        # Признак редактирования на клиенте
        # - особенным образом обрабатываются данные при редактировании
        self.setdefault('local_edit', False)

        # Признак возможности группировки (показывает панель)
        self.setdefault('groupable', True)

        # Признак отображения информации о записях
        self.setdefault('display_info', True)

        # Формат отображения информации о записях
        self.setdefault('display_message', u'Показано {0}-{1} из {2}')

        # Объем буфера записей - должен быть больше,
        # чем число соседних элементов + число видимых строк
        self.setdefault('buffer_size', 200)

        # Число соседних элементов сверху и снизу от видимой области,
        # для предотвращения запросов.
        # Обычно 1/4 или 1/2 от объема буфера
        self.setdefault('near_limit', 100)

    # FIXME: перенести make_read_only в js-код
    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):

        super(ExtMultiGroupinGrid, self)._make_read_only(
            access_off, exclude_list, *args, **kwargs)

        if (self._top_bar and hasattr(self._top_bar, 'items')
            and self._top_bar.items and hasattr(
                self._top_bar.items, '__iter__')):
            for item in self._top_bar.items:
                if isinstance(item, ExtUIComponent):
                    item.make_read_only(
                        self.read_only,
                        exclude_list,
                        *args, **kwargs
                    )

        # убираем редактирование записи по даблклику
        if access_off:
            self.dblclick_handler_disabled = dblclick_handler
            self.dblclick_handler = self.EMPTY_HANDLER
        else:
            self.dblclick_handler = self.dblclick_handler_disabled
            self.dblclick_handler_disabled = self.EMPTY_HANDLER


class ExtObjectSelectionPanel(containers.ExtContainer):
    """
    Класс, совмещающий возможность ObjectGrid'a
    и возможности выбора и запоминания значений в случае Paging'a
    """
    _xtype = 'm3-object-selection-panel'

    js_attrs = containers.ExtContainer.js_attrs.extend(
        'grid',
        selection_columns='selectionColumns',
        selection_grid_conf='selectionGridConf',
    )

    def __init__(self, *args, **kwargs):
        super(ExtObjectSelectionPanel, self).__init__(*args, **kwargs)
        self.setdefault('layout', self.BORDER)
        self.setdefault('selection_columns', [])
        self.setdefault('selection_grid_conf', {})
