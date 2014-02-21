#coding: utf-8
from django import http

from m3_ext.ui.containers.containers import ExtToolBar, ExtStaticToolBarItem, ExtTextToolBarItem, ExtRadioGroup
from m3_ext.ui.containers.forms import ExtFieldSet, ExtTitlePanel
from m3_ext.ui.containers.grids import ExtGrid, ExtGridRowSelModel, ExtGridGroupingView, ExtGridColumn, \
    ExtLiveGridCheckBoxSelModel, ExtLiveGridRowSelModel, ExtGridCellSelModel
from m3_ext.ui.containers.trees import ExtTree, ExtTreeNode
from m3_ext.ui.fields.complex import ExtFileUploadField, ExtImageUploadField, ExtMultiSelectField
from m3_ext.ui.fields.simple import ExtRadio, ExtHiddenField, ExtHTMLEditor, ExtDisplayField, ExtDateTimeField, \
    ExtAdvTimeField, ExtNumberField, ExtStringField
from m3_ext.ui.misc.store import ExtDataStore, ExtJsonReader, ExtGroupingStore, ExtMultiGroupingStore, ExtJsonWriter
from m3_ext.ui.panels.grids import ExtMultiGroupinGrid, ExtObjectGrid
from m3_ext.ui.results import ExtUIScriptResult
from m3_ext.ui.shortcuts import MessageBox
from m3_ext.ui.windows.lists import BaseExtListWindow
from m3_ext.ui.windows.window import ExtWindow

__author__ = 'prefer'

from m3_ext_demo import url


@url(r'ui/toolbar-item')
def toolbar_elements(request):
    win = ExtWindow()
    win.top_bar = ExtToolBar()
    win.top_bar.items.append(ExtStaticToolBarItem("{xtype: 'tbtext', text: 'tra-ta-ta'}"))
    win.top_bar.items.append(ExtTextToolBarItem('tra-ta-ta'))

    return http.HttpResponse(win.get_script())


@url(r'ui/radio-group')
def radio_group(request):
    win = ExtWindow()

    radio1 = ExtRadio(box_label=u'Один')
    radio2 = ExtRadio(box_label=u'Два')
    radio3 = ExtRadio(box_label=u'Три')

    radio_group = ExtRadioGroup()
    radio_group.columns = 2
    radio_group.label = u'Наименование'
    radio_group.items.extend([radio1, radio2, radio3])

    field_set = ExtFieldSet()
    field_set.items.append(radio_group)

    win.items.append(field_set)

    return http.HttpResponse(win.get_script())


@url(r'ui/title-panel')
def title_panel(request):
    win = ExtWindow(layout='fit')

    panel = ExtTitlePanel()

    win.items.append(panel)

    return http.HttpResponse(win.get_script())


@url(r'ui/grid-check-column')
def grid_check_column(request):
    win = ExtWindow(layout='fit')

    grid = ExtGrid()
    grid.add_check_column(header=u'N', data_index='number')
    grid.add_column(header=u'Имя', data_index='fname')
    grid.set_store(ExtDataStore([[1, 'true', u'Юрий'],]))

    win.items.append(grid)
    return http.HttpResponse(win.get_script())


@url(r'ui/grid-row-selection-model')
def grid_row_selection_model(request):
    win = ExtWindow(layout='fit')

    grid = ExtGrid()
    grid.add_check_column(header=u'N', data_index='number')
    grid.add_column(header=u'Имя', data_index='fname')
    grid.set_store(ExtDataStore([[1, 1, u'Юрий'], [2, 0, u'Иван']]))

    grid.sm = ExtGridRowSelModel()
    grid.sm.single_select = True

    win.items.append(grid)
    return http.HttpResponse(win.get_script())


@url(r'ui/grid-grouping-view')
def grid_grouping_view(request):

    win = ExtWindow(layout='fit')

    grid = ExtGrid()
    map(lambda i: grid.add_column(data_index=i, header=str(i), extra={'summaryType': '"sum"'}), range(1, 13))

    reader = ExtJsonReader(total_property='total', root='rows')
    reader.set_fields(*grid.columns)

    store = ExtGroupingStore(url='/data/locking-grouping-grid',
                             auto_load=True,)
    store.group_field = '1'
    store.reader = reader

    grid.store = store

    grid.view = ExtGridGroupingView()

    win.items.append(grid)
    return http.HttpResponse(win.get_script())


@url(r'ui/live-grid-checkbox-selection-model')
def live_grid_checkbox(request):
    win = ExtWindow(layout='fit')

    grid = ExtMultiGroupinGrid()
    grid.columns.append(ExtGridColumn(header=u'ИД',
                                      data_index='id'))
    grid.columns.append(ExtGridColumn(header=u'Поле 1',
                                      data_index='F1',
                                      sortable=True))
    grid.columns.append(ExtGridColumn(header=u'Поле 2',
                                      data_index='F2',
                                      extra={},
                                      sortable=True))
    grid.columns.append(ExtGridColumn(header=u'Поле 3',
                                      data_index='F3',
                                      extra={}))
    grid.columns.append(ExtGridColumn(header=u'Значение 1',
                                      data_index='value',
                                      sortable=True))
    grid.columns.append(ExtGridColumn(header=u'Значение 2',
                                      data_index='value1',
                                      sortable=True))
    grid.columns.append(ExtGridColumn(header=u'% различия',
                                      data_index='percent',
                                      sortable=True))
    grid.set_store(ExtMultiGroupingStore(url='/ui/livegrid-data',
                                         auto_load=True,
                                         total_property='totalCount',
                                         root='data',
                                         id_property='index'))

    grid.sm = ExtLiveGridCheckBoxSelModel()
    grid.sm.single_select = True

    win.items.append(grid)
    return http.HttpResponse(win.get_script())


@url(r'ui/live-grid-rows-selection-model')
def live_grid_row_selection_model(request):
    win = ExtWindow(layout='fit')

    grid = ExtMultiGroupinGrid()
    grid.columns.append(ExtGridColumn(header=u'ИД',
                                      data_index='id'))
    grid.columns.append(ExtGridColumn(header=u'Поле 1',
                                      data_index='F1',
                                      sortable=True))
    grid.columns.append(ExtGridColumn(header=u'Поле 2',
                                      data_index='F2',
                                      extra={},
                                      sortable=True))
    grid.columns.append(ExtGridColumn(header=u'Поле 3',
                                      data_index='F3',
                                      extra={}))
    grid.columns.append(ExtGridColumn(header=u'Значение 1',
                                      data_index='value',
                                      sortable=True))
    grid.columns.append(ExtGridColumn(header=u'Значение 2',
                                      data_index='value1',
                                      sortable=True))
    grid.columns.append(ExtGridColumn(header=u'% различия',
                                      data_index='percent',
                                      sortable=True))
    grid.set_store(ExtMultiGroupingStore(url='/ui/livegrid-data',
                                         auto_load=True,
                                         total_property='totalCount',
                                         root='data',
                                         id_property='index'))

    grid.sm = ExtLiveGridRowSelModel()
    grid.sm.single_select = True

    win.items.append(grid)
    return http.HttpResponse(win.get_script())


@url(r'ui/tree-node')
def tree_node(request):
    win = ExtWindow(layout='fit')

    tree = ExtTree()
    tree.add_column(header=u'Имя', width=140, data_index='fname')

    node1 = ExtTreeNode()
    node1.text = u'1'
    node1.expanded = True
    node1.can_check = True
    node1.set_items(fname=u'Иван')

    node2 = ExtTreeNode()
    node2.text = u'2'
    node2.leaf = True
    node2.can_check = True
    node2.set_items(fname=u'Федор')

    node1.add_children(node2)

    tree.nodes.append(node1)

    win.items.append(tree)
    return http.HttpResponse(win.get_script())


@url(r'ui/upload-fields')
def upload_fields(request):
    win = ExtWindow(layout='form')

    file_upload_field = ExtFileUploadField(width=100, label='1')
    image_upload_field = ExtImageUploadField(width=100, label='2')

    win.items.extend([file_upload_field, image_upload_field])
    return http.HttpResponse(win.get_script())


@url(r'ui/multi-select-field')
def multi_select_field(request):
    win = ExtWindow(layout='form')

    field = ExtMultiSelectField(label=u'Первый участник',
                              url='/ui/tree-dict-window',
                              autocomplete_url='/data/grid-json-store-data',
                              ask_before_deleting=False,
    )

    field.display_field = 'lname'
    field.value_field = 'id'
    field.auto_load = True

    win.items.append(field)
    return http.HttpResponse(win.get_script())


@url(r'ui/simple-fields')
def simple_fields(request):
    win = ExtWindow(layout='form', width=800, height=600)

    hidden_field = ExtHiddenField()

    html_editor = ExtHTMLEditor(label=u'Редактор кода', anchor='100%')

    display_field = ExtDisplayField()
    display_field.label = 'display field'
    display_field.value = 'value of display field'

    date_time_field = ExtDateTimeField(label=u'Дата и время')

    time_field = ExtAdvTimeField()
    time_field.label = u'Дата'

    win.items.extend([hidden_field,
                      html_editor,
                      display_field,
                      time_field,
                      date_time_field])

    return ExtUIScriptResult(win).get_http_response()


@url(r'ui/base-list-window')
def base_list_window(request):

    win = BaseExtListWindow()

    grid = win.grid
    grid.url_data = '/data/object-grid'
    grid.add_column(data_index='lname')
    grid.add_column(data_index='fname')
    grid.add_column(data_index='adress')

    return ExtUIScriptResult(win).get_http_response()


@url(r'ui/json-writer')
def json_writer(request):
    win = ExtWindow(layout='fit')

    grid = ExtObjectGrid(sm=ExtGridCellSelModel())
    grid.editor = True
    grid.store.writer = ExtJsonWriter(write_all_fields=False)
    grid.allow_paging = False
    grid.store.auto_save = False
    cell_css = "'height:40px;'"

    grid.add_column(header=u'Имя', data_index='fname')
    grid.set_store(ExtDataStore([[1, u'Первая запись',],]))

    for column in grid.columns:
        column.width = 50
        if type == 'days':
            grid._listeners['cellclick'] = 'setLogicalValue'
        elif type == 'hours':
            column.editor = editor = ExtNumberField()
            editor.decimal_precision = 2
            editor.select_on_focus = True
            editor.allow_negative = False
            editor.max_value = 24
        else:
            column.editor = ExtStringField(select_on_focus=True)
        column.extra={"css": cell_css}

    win.items.append(grid)
    return ExtUIScriptResult(win).get_http_response()


@url(r'ui/message-box')
def message_box(request):
    message_box = MessageBox(title=u'Внимание', msg=u'Пишите тесты правильно!')
    return ExtUIScriptResult(message_box).get_http_response()