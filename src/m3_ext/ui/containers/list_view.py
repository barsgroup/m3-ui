#coding:utf-8
"""
Created on 31.03.2010

@author: prefer
"""

from m3_ext.ui.base import ExtUIComponent
from m3_ext.ui.containers import (
    ExtGridColumn, ExtGridBooleanColumn, ExtGridDateColumn, ExtGridNumberColumn
)


class ExtDataView(ExtUIComponent):
    """
    Невизуальный компонент.
    Используется только для правильного наследование ExtListView
    """
    def __init__(self, *args, **kwargs):
        super(ExtDataView, self).__init__(*args, **kwargs)
        self.block_refresh = False
        self.defer_empty_text = False
        self.empty_text = ''
        self.item_selector = None
        self.loading_text = ''
        self.multi_select = False
        self.over_class = None
        self.selected_class = None
        self.simple_select = False
        self.single_select = False
        self.store = None  # Рендер в ExtListView
        self.tpl = None
        self.track_over = False

    def render_base_config(self):
        super(ExtDataView, self).render_base_config()
        for args in (
            ('blockRefresh', self.block_refresh, self.block_refresh),
            ('deferEmptyText', self.defer_empty_text, self.defer_empty_text),
            ('emptyText', self.empty_text, self.empty_text),
            ('itemSelector', self.item_selector),
            ('loadingText', self.loading_text, self.loading_text),
            ('multiSelect', self.multi_select, self.multi_select),
            ('overClass', self.over_class),
            ('selectedClass', self.selected_class),
            ('simpleSelect', self.simple_select, self.simple_select),
            ('singleSelect', self.single_select, self.single_select),
            ('tpl', self.tpl),
            ('trackOver', self.track_over, self.track_over),
        ):
            self._put_config_value(*args)


class ExtListView(ExtDataView):
    '''
    Класс list view в соответствии с Ext.list.ListView
    '''
    def __init__(self, *args, **kwargs):
        super(ExtListView, self).__init__(*args, **kwargs)
        self.column_resize = True
        self.column_sort = True
        self._items = []  # Для совместимости с М3
        self.hide_headers = None
        self.reserve_scroll_offset = None
        self.scroll_offset = None

        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(ExtListView, self).render_base_config()
        for args in (
            ('columnResize', self.column_resize, not self.column_resize),
            ('columnSort', self.column_sort, not self.column_sort),
            ('hideHeaders', self.hide_headers),
            ('reserveScrollOffset', self.reserve_scroll_offset),
            ('scrollOffset', self.scroll_offset),
            ('store', self.t_render_store),
            ('columns', self.t_render_columns),
        ):
            self._put_config_value(*args)

    def render(self):
        self.pre_render()  # Тут рендерится контекст
        self.render_base_config()  # Тут конфиги
        self.render_params()  # Пусто
        base_config = self._get_config_str()
        return 'new Ext.list.ListView({%s})' % base_config

    def t_render_store(self):
        assert self.store, 'Store is not define'
        return self.store.render(
            [column.data_index for column in self.columns])

    def t_render_columns(self):
        return '[%s]' % ','.join([item.render() for item in self._items])

    def set_store(self, store):
        """
        Для совместимости
        """
        self.store = store

    def add_column(self, **kwargs):
        '''
        Добавляет дефолтную колонку
        @param kwargs: Параметры колонки
        '''
        self.columns.append(ExtGridColumn(**kwargs))

    def add_bool_column(self, **kwargs):
        '''
        Добавляет булевую колонку
        @param kwargs: Параметры колонки
        '''
        self.columns.append(ExtGridBooleanColumn(**kwargs))

    def add_number_column(self, **kwargs):
        '''
        Добавляет числовую колонку
        @param kwargs: Параметры колонки
        '''
        self.columns.append(ExtGridNumberColumn(**kwargs))

    def add_date_column(self, **kwargs):
        '''
        Добавляет колонку даты
        @param kwargs: Параметры колонки
        '''
        self.columns.append(ExtGridDateColumn(**kwargs))

    @property
    def columns(self):
        return self._items
