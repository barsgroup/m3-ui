#coding: utf-8

from m3_ext.ui.containers import ExtPagingBar
from m3_ext.ui.misc import ExtJsonStore
from m3_ext.ui.windows import ExtEditWindow

from .ui import CatalogueWindow


class UiCreator(object):

    _default_list_form = CatalogueWindow
    _default_edit_form = ExtEditWindow

    columns = None
    filter_columns = None
    read_only = False
    sort_order = None
    paging = False

    def __init__(self, base, edit_form=None, list_form=None,
                 ui_config=None,
                 columns=None, filter_columns=None,
                 column_name_on_select="name",
                 read_only=False, sort_order=False,
                 paging=True, *args, **kwargs):

        self.base = base
        self.ui_config = ui_config
        assert columns, u"Columns configuration not provided"
        self.columns = columns
        self.filter_columns = filter_columns or []
        self.column_name_on_select = column_name_on_select
        self.read_only = read_only
        self.sort_order = sort_order
        self.paging = paging
        self.list_form = list_form or self._default_list_form
        self.edit_form = edit_form or self._default_edit_form

    def create_window(self, request, context, mode):
        base = self.base
        allow_copy = hasattr(base, 'allow_copy') and base.allow_copy
        win = self.list_form(mode=mode, title=base.title_plural
                             if base.title_plural else base.title)
        win.allow_copy = allow_copy
        win_height, win_width = self.list_form.height, self.list_form.width
        win.height, win.width = win_height, win_width
        win.min_height, win.min_width = win_width, win_width
        win.init_grid_components()

        if base.list_paging:
            win.grid.bottom_bar = ExtPagingBar(page_size=25)
        return win

    def create_columns(self, control, columns):
        for column in columns:
            if isinstance(column, tuple):
                column_params = { 'data_index': column[0], 'header': column[1], 'sortable': True }
                if len(column) > 2:
                    column_params['width'] = column[2]
            elif isinstance(column, dict):
                column_params = column
            else:
                raise Exception('Incorrect parameter column.')
            control.add_column(**column_params)

    def configure_list(self, win):
        base = self.base
        # Устанавливаем источники данных
        # быть может кто-то умный уже настроил себе стор
        if not win.grid.get_store():
            grid_store = ExtJsonStore(url=base.rows_action.get_absolute_url(),
                                      auto_load=True, remote_sort=True)
            grid_store.total_property = 'total'
            grid_store.root = 'rows'
            grid_store.base_params['mode'] = 2
            win.grid.set_store(grid_store)

        if not base.list_readonly:
            # Доступны 3 события: создание нового элемента, редактирование или удаление имеющегося
            win.url_new_grid = base.edit_window_action.get_absolute_url()
            win.url_edit_grid = base.edit_window_action.get_absolute_url()
            win.url_delete_grid = base.delete_action.get_absolute_url()

            # Если разрешено копирование, то доступно ещё одно событие.
            if base.allow_copy:
                win.url_copy_grid = base.copy_action.get_absolute_url()

    def configure_window(self, win, request, context):
        base = self.base
        win.orig_request = request
        win.orig_context = context

        # У окна может быть процедура доп. конфигурации под конкретный справочник
        if hasattr(win, 'configure_for_dictpack') and callable(win.configure_for_dictpack):
            win.configure_for_dictpack(action=self, pack=base,
                request=request, context=context)

    def create_operation_window(self, request, context):
        base = self.base
        win = self.edit_form()
        if not win.title:
            win.title = base.title

        if win.form:
            win.form.url = base.save_action.get_absolute_url()
        # укажем адрес для чтения данных
        win.data_url = base.edit_window_action.get_absolute_url()

        win.create_new = True
        if request.POST.get('id'):
            win.create_new = False
            win.url_get_data = self.base.get_url_data()

        # проверим право редактирования
        if getattr(request, 'user', None):
            if not base.has_sub_permission(request.user, base.PERM_EDIT, request):
                exclude_list = ['close_btn', 'cancel_btn']
                win.make_read_only(True, exclude_list)

        win.orig_request = request
        win.orig_context = context

        # У окна может быть процедура доп. конфигурации под конкретный справочник
        if hasattr(win, 'configure_for_dictpack') and callable(win.configure_for_dictpack):
            win.configure_for_dictpack(action=self, pack=self.parent,
                request=request, context=context)

        return win
