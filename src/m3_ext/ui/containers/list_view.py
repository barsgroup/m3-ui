#coding:utf-8
'''
Created on 31.03.2010

@author: prefer
'''

from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.containers import ExtGridColumn, ExtGridBooleanColumn, ExtGridDateColumn, ExtGridNumberColumn


class ExtDataView(ExtUIComponent):
    """
    Невизуальный компонент. Используется только для правильного наследование ExtListView
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
        self.store = None # Рендер в ExtListView
        self.tpl = None
        self.track_over = False

    def render_base_config(self):
        super(ExtDataView, self).render_base_config()
        self._put_config_value('blockRefresh', self.block_refresh, self.block_refresh)
        self._put_config_value('deferEmptyText', self.defer_empty_text, self.defer_empty_text)
        self._put_config_value('emptyText', self.empty_text, self.empty_text)
        self._put_config_value('itemSelector', self.item_selector)
        self._put_config_value('loadingText', self.loading_text, self.loading_text)
        self._put_config_value('multiSelect', self.multi_select, self.multi_select)
        self._put_config_value('overClass', self.over_class)
        self._put_config_value('selectedClass', self.selected_class)
        self._put_config_value('simpleSelect', self.simple_select, self.simple_select)
        self._put_config_value('singleSelect', self.single_select, self.single_select)
        self._put_config_value('tpl', self.tpl)
        self._put_config_value('trackOver', self.track_over, self.track_over)


class ExtListView(ExtDataView):
    '''
    Класс list view в соответствии с Ext.list.ListView
    '''
    def __init__(self, *args, **kwargs):
        super(ExtListView, self).__init__(*args, **kwargs)
        self.column_resize = True
        self.column_sort = True
        self._items = [] # Для совместимости с М3
        self.hide_headers = None
        self.reserve_scroll_offset = None
        self.scroll_offset = None

        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(ExtListView, self).render_base_config()
        self._put_config_value('columnResize', self.column_resize, not self.column_resize)
        self._put_config_value('columnSort', self.column_sort, not self.column_sort)
        self._put_config_value('hideHeaders', self.hide_headers)
        self._put_config_value('reserveScrollOffset', self.reserve_scroll_offset)
        self._put_config_value('scrollOffset', self.scroll_offset)
        self._put_config_value('store', self.t_render_store)
        self._put_config_value('columns', self.t_render_columns)

    def render(self):
        self.pre_render() # Тут рендерится контекст
        self.render_base_config() # Тут конфиги
        self.render_params() # Пусто
        base_config = self._get_config_str()
        return 'new Ext.list.ListView({%s})' % base_config

    def t_render_store(self):
        assert self.store, 'Store is not define'
        return self.store.render([column.data_index for column in self.columns])

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