# coding: utf-8
import json

from django import http

from datetime import datetime

from m3_django_compat import get_request_params
from m3_ext.ui.containers import ExtGrid, ExtContextMenu, ExtGridColumn, ExtTabPanel, ExtPanel, ExtFieldSet, \
    ExtPagingBar, ExtContainerTable, ExtGridCellSelModel, ExtGridLockingColumnModel, \
    ExtGridLockingView
from m3_ext.ui.containers.containers import ExtToolBar, ExtContainer
from m3_ext.ui.containers.forms import ExtForm
from m3_ext.ui.containers.grids import \
    ExtGridCheckBoxSelModel, ExtGridLockingHeaderGroupPlugin
from m3_ext.ui.containers.trees import ExtTree
from m3_ext.ui.controls.buttons import ExtButton
from m3_ext.ui.fields import ExtStringField, ExtCheckBox, ExtDictSelectField, ExtDateField, ExtNumberField, \
    ExtTimeField, ExtComboBox, ExtSearchField
from m3_ext.ui.fields.simple import ExtTextArea
from m3_ext.ui.misc import ExtDataStore, ExtJsonStore, ExtLabel
from m3_ext.ui.misc.store import ExtJsonReader, ExtGroupingStore
from m3_ext.ui.panels.grids import ExtObjectGrid, ExtObjectSelectionPanel
from m3_ext.ui.panels.trees import ExtObjectTree
from m3_ext.ui.results import ExtGridDataQueryResult
from m3_ext.ui.shortcuts import js_submit_form, js_close_window
from m3_ext.ui.windows import ExtDictionaryWindow
from m3_ext.ui.windows.edit_window import ExtEditWindow
from m3_ext.ui.windows.window import ExtWindow

import m3_ext.ui.helpers
import m3_ext.ui.shortcuts
import m3_ext.ui.all_components
import m3_ext.ui.results
import m3_ext.ui.js_template_loader

from m3_ext_demo import url


@url(r'^ui/simple-window$')
def simple_window(request):
    window = ExtWindow(title=u'Окно с кнопкой', button_align=ExtWindow.align_left)
    fbar = ExtToolBar()
    fbar.items.append(ExtButton(text='123'))
    fbar.add_fill()
    fbar.items.append(ExtButton(text='123123'))

    window.footer_bar = fbar
    return http.HttpResponse(window.get_script())


@url(r'^ui/simple-window2')
def simple_window2(request):
    window = ExtEditWindow()
    window.handler_beforesubmit = 'function() {console.log("Pre submit")}'
    window.form = ExtForm(title=u'Просто форма')
    window.form.url = '/data/grid-json-store-data'

    window.title = u'Окно с кнопкой'
    window.template_globals = 'ui-js/simple-window2-globals.js'

    button = ExtButton(width=200)
    button.text = u'Показать сообщение'
    button.handler = 'submitForm'
    # button.tooltip_title = 'Кнопка'
    button.tooltip_text = 'Просто кнопка'
    window.buttons.append(button)

    return http.HttpResponse(window.get_script())


@url(r'^ui/simple-window3')
def simple_window3(request):
    window = ExtEditWindow()
    window.title = u'Окно редактирования'

    button1 = ExtButton(text=u'Выбрать событие')
    button1.handler = 'function(){ win.fireEvent("refresh_store");}'
    button2 = ExtButton(text=u'Закрыть форму')
    button2.handler = js_close_window(window)
    window.buttons.append(button1)
    window.buttons.append(button2)

    form = ExtContainer()
    form.layout = 'absolute'
    form.title = u'Форма заполнения чего-то'

    field = ExtStringField(x=100, y=10,
                           label=u'Заголовок поля',
                           input_type='password')
    form.items.append(field)

    window.form = form
    return http.HttpResponse(window.get_script())


@url(r'^ui/form-jstore')
def form_jstore(request):
    """Загружает data store в форму"""
    window = ExtEditWindow(title=u'Регистрация',
                           template_globals='ui-js/simple-window4.js',
                           maximizable=True)

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    form = ExtForm(title=u'Укажите персональные данные')
    form.url = '/ext/bla-bla-bla'

    fname = ExtStringField(name='fname', label=u'Имя')
    lname = ExtStringField(name='lname', label=u'Фамилия')
    adress = ExtStringField(name='adress', width='200', label=u'Адрес проживания')

    form.items.append(fname)
    form.items.append(lname)
    form.items.append(adress)
    window.form = form

    return http.HttpResponse(window.get_script())


@url(r'^ui/test-json-store')
def simple_window_store_handler(request):
    res = '[{"lname":"Петров","fname":"Иван",adress:"Проспект победы д. 147 кв 15"}]'
    return http.HttpResponse(res)


@url(r'^ui/grid-data-store')
def grid_data_store(request):
    """Загружает грид произвольными данными"""

    window = ExtEditWindow(title=u'Произвольная таблица', layout='fit')
    window.template_globals = 'ui-js/simple-window2-globals.js'
    window.maximizable = True

    grid = ExtGrid(title=u'Произвольный грид', layout='fit')
    grid.add_column(header=u'Имя', data_index='fname')
    grid.add_column(header=u'Фамилия', data_index='lname')
    grid.add_column(header=u'Адрес', data_index='adress')
    grid.set_store(ExtDataStore([[1, u'Юрий', u'Кофтун', u'пр. Мира'],
                                 [2, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                 [3, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                 [4, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                 [5, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                 [6, u'Анатоле', u'Кожемякин', u'пл. Земля '], ]))
    menu = ExtContextMenu()
    menu.add_item(text=u'Тупой пункт на весь грид')
    grid.handler_contextmenu = menu

    menu = ExtContextMenu()
    menu.add_item(text=u'Просто пункт без события')
    menu.add_separator()
    menu.add_item(text=u'Показать имя', handler='get_name')
    #menu.handler_beforeshow = 'button_pressed_handler'
    grid.handler_rowcontextmenu = menu

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    window.form = grid

    return http.HttpResponse(window.get_script())


@url(r'^ui/grid-json-store')
def grid_json_store(request):
    """Загружает грид произвольными данными"""

    window = ExtEditWindow(title=u'Произвольная таблица')
    window.maximizable = True
    window.minimizable = True
    #window.modal = True
    window.layout = 'fit'
    #window.maximized= True

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    grid = ExtGrid()
    grid.add_column(header=u'Имя', data_index='fname')
    grid.add_column(header=u'Фамилия', data_index='lname')
    grid.add_column(header=u'Адрес', data_index='adress')
    grid.add_bool_column(header=u'Муж?', data_index='sx', editor=ExtCheckBox())
    grid.set_store(ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))
    grid.handler_dblclick = 'function(){ console.log(11) }'
    window.form = grid

    return http.HttpResponse(window.get_script())


@url(r'^data/grid-json-store-data')
def grid_json_store_handler(request):
    res = ['{"id":1, "lname":"Смактуновский", "fname":"Махмут",adress:"Проспект победы д. 147 кв 20"}',
           '{"id":2,"lname":"Гете","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":3,"lname":"Квазимовский","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":4,"lname":"Абрамов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":5,"lname":"Куликов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":6,"lname":"Белоногов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":7,"lname":"Харламов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":8,"lname":"Ухтомский","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":9,"lname":"Победилов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":10,"lname":"Свидригайлов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":11,"lname":"Гете1","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":12,"lname":"Кваз1имовский","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":144,"lname":"Абрам1ов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":111,"lname":"Кулико1в","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":121,"lname":"Белоног1ов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":714,"lname":"Харламо1в","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":81,"lname":"Ухтомск1ий","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":91,"lname":"Победил1ов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":110,"lname":"Свидри1гайлов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":21,"lname":"Гет2е","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":31,"lname":"Ква2зимовский","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":41,"lname":"Абр2амов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":51,"lname":"Кул2иков","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":61,"lname":"Бел2оногов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":71,"lname":"Хар2ламов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":81,"lname":"Ухт2омский","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":91,"lname":"Поб2едилов","fname":"Йоган",adress:" Бунден штрассе"}',
           '{"id":1110,"lname":"Св2идригайлов","fname":"Йоган",adress:" Бунден штрассе"}']
    return http.HttpResponse('{"total":121,"rows":[%s]}' % ','.join(res))


@url(r'^ui/dict-select-field')
def dict_select_field(request):
    window = ExtEditWindow()
    window.template_globals = 'ui-js/dict-select-field.js'
    window.title = u'Окно редактирования'
    window.width = 400

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    form = ExtForm(padding=10)
    form.title = u'Форма заполнения чего-то'

    cont = ExtDictSelectField(label=u'Первый участник',
                              url='/ui/tree-dict-window',
                              autocomplete_url='/data/grid-json-store-data',
                              ask_before_deleting=False,
                              anchor='80%',
                              #width=200
    )

    #cont.disabled = True
    cont.ask_before_deleting = True
    btn = ExtButton(text='Меняй режим read_only')
    btn.handler = 'changeReadOnlyMode'

    cont.display_field = 'lname'
    cont.value_field = 'id'
    cont.hide_trigger = False

    form.items.extend([cont, btn])

    window.form = form
    return http.HttpResponse(window.get_script())


@url(r'^ui/text-area-checkbox')
def text_area_checkbox(request):
    window = ExtEditWindow(title=u'Окно')
    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    text_area = ExtTextArea(x=50, y=50, disabled=False, value=u'Большое поле', label='text area')
    style = dict(margin='30px')
    cont = ExtContainer(style=style)
    cont.layout = 'form'
    cont.items.append(text_area)

    check_box = ExtCheckBox(checked=True,
                            box_label='Check box Check box Check box Check box Check box Check box Check box Check box '
                                      'Check box Check box Check box ')
    cont.items.append(check_box)
    window.form = cont

    return http.HttpResponse(window.get_script())


@url(r'^ui/number-date-fields')
def number_date_fields(request):
    window = ExtEditWindow(title=u'Окно')

    field = ExtDateField(format='d-m', label=u'datefield')
    field.value = datetime.now().strftime('%d-%m')

    field2 = ExtNumberField(label=u'numberfield')

    form = ExtForm(title=u'Форма заполнения чего-то')

    form.items.append(field)
    form.items.append(field2)

    time = ExtTimeField(format='H:i', increment=60)
    form.items.append(time)

    window.form = form
    return http.HttpResponse(window.get_script())


@url(r'^ui/grid-column-header-grouping')
def grid_column_header_grouping(request):
    """
    Скопипастил тут все!
    """
    window = ExtEditWindow(title=u'Произвольная таблица', layout='fit')

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    grid = ExtGrid()
    grid.add_column(header=u'Имя', data_index='fname')
    grid.add_column(header=u'Фамилия', data_index='lname')
    grid.add_column(header=u'Адрес', data_index='adress')
    grid.set_store(ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))

    # Бандитские колонки
    grid.add_banded_column(ExtGridColumn(header=u'Мегаколонка', align='center'), 0, 3)
    grid.add_banded_column(ExtGridColumn(header=u'Подколонка1', align='center'), 1, 2)
    grid.add_banded_column(ExtGridColumn(header=u'Подколонка2', align='center'), 1, 1)

    window.form = grid

    return http.HttpResponse(window.get_script())


@url(r'^ui/base-tree')
def base_tree(request):
    """Показывает работу простого колоночного дерева"""

    window = ExtEditWindow()
    window.template_globals = 'ui-js/simple-window2-globals.js'
    window.title = u'Дерево'
    window.width = 700
    window.layout = 'fit'
    #window.maximized = True

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    tree = ExtTree(title='Одноколоночное дерево',
                   url='/data/base-tree-data')  # -- для дерева, подгружаемого с сервера

    menu = ExtContextMenu()
    menu.add_item(text=u'Просто пункт')
    menu.add_separator()
    menu.add_item(text=u'Показать имя', handler='get_node_name')
    #    tree.handler_contextmenu = menu

    menu = ExtContextMenu()
    menu.add_item(text=u'Просто пункт')
    menu.add_item(text=u'Просто пункт')
    menu.add_item(text=u'Просто пункт')
    menu.add_item(text=u'Просто пункт')
    menu.add_item(text=u'Просто пункт')
    menu.add_item(text=u'Просто пункт')
    tree.handler_containercontextmenu = menu

    renderer = u'''function(value, meta, record) {
        console.log(value);
        alert(1);
        return value;
    }'''
    col = ExtGridColumn(header=u'Имя', data_index='fname', width=140)
    col.column_renderer = renderer
    tree.columns.append(col)
    col = ExtGridColumn(header=u'Имя2', data_index='lname', width=140)
    col.column_renderer = renderer
    tree.columns.append(col)
    tree.add_column(header=u'Адрес', data_index='adress', width=140)
    tree.add_number_column(header=u'Зп', data_index='nc', width=60)
    tree.add_date_column(header=u'Др', data_index='dc', width=60)
    tree.add_bool_column(header=u'Муж?',
                         data_index='bc',
                         text_false=u'Нет',
                         text_true=u'Да',
                         width=50)
    handler = u'''function() {
        tree = Ext.getCmp("%s");
        console.log(tree.getChecked());
        alert(tree.getChecked('id'));
    }''' % tree.client_id

    window.buttons.append(ExtButton(text=u'Кто выбран, а?', handler=handler))

    window.form = tree

    return http.HttpResponse(window.get_script())


@url(r'^data/base-tree-data')
def base_tree_data(request):
    res = ''
    if request.POST.get('node') == '-1':
        print 111
        res = '''
        [{
        id: 1,
        fname:'Жора',
        lname:'Жораasdsad',

        checked: true,

        },
        {   id: 3,
            fname:'Потам',
            lname:'Потамasds',
            leaf: true,
            checked: false
        }]'''
    elif request.POST.get('node'):
        print 2
        item = request.POST.get('node')
        res = '[%s]' % ','.join(
            '{id:"%s", checked: true, fname:"%s"}' % ('1' + str(it * 10) + item, str(item) + str(it)) for it in
            range(20))
    elif request.POST.get('id') == '1':
        print 3
        pass
        #res = "[{'id': 5,'lname':'Жора','fname':'1','adress':'ул. Первопроходцев'},{'id': 6,'lname':'Потап','fname':'2','adress':'ул. Первопроходцев'}]"
    elif request.POST.get('list_nodes'):
        print 4
        l = request.POST.get('list_nodes').split(',')
        list_nodes = []
        for item in l:
            sublist = ','.join(
                ['{id:%s,  text:"%s"}' % ('1' + str(it * 10) + item, str(item) + str(it)) for it in range(20)])
            list_nodes.append('{id:%s,  children:[%s]}' % (item, sublist))

        res = '[%s]' % ','.join(list_nodes)
    else:
        print 5
        l = [
            '{"fname":"Главная","_id":1, "_lft":1, "_rgt":200, "_level": 1, "_is_leaf":false, "_is_loaded":true}',
            '{"fname":"Подчиненная", "_id":2, "_lft":2, "_rgt":5, "_level": 2, "_is_leaf":false, "_is_loaded":true, "_parent":1}',
            '{"fname":"Конец2", "_id":500, "_lft":9, "_rgt":10, "_level": 3, "_is_leaf":true, "_is_loaded":true, "_parent":12}',
            '{"fname":"Конец", "_id":12, "_lft":7, "_rgt":30, "_level": 2, "_is_leaf":false, "_is_loaded":true, "_parent":1}',
            '{"fname":"Наверху", "_id":11, "_lft":3, "_rgt":4, "_level": 3, "_is_leaf":true, "_is_loaded":true, "_parent":2}',
        ]
        res = ','.join(l)

        res = '{success:true, total:%d, rows:[%s]}' % (3, res)

        res2 = '''
{"total": 4, "rows": [
{"_level": 1, "fname": "root", "_is_leaf": false, "_lft": 1, "_parent": null, "_rgt": 8, "_id": 663},
{"_level": 3, "fname": "3 level", "_is_leaf": true, "_lft": 3, "_parent": 664, "_rgt": 4, "_id": 666},
{"_level": 2, "fname": "child 1 not empty", "_is_leaf": false, "_lft": 2, "_parent": 663, "_rgt": 5, "_id": 664},
{"_level": 2, "fname": "child 2", "_is_leaf": true, "_lft": 6, "_parent": 663, "_rgt": 7, "_id": 665},

],
"success": true}
'''
        if request.POST.get('anode'):
            res2 = '''
{"total": 1, "rows": [
{"fname": "3 level of 2", "_is_leaf": true, "_parent": 665, "_id": 1},

],
"success": true}
'''
        else:
            res2 = '''
{"total": 4, "rows": [
{"fname": "root", "_is_leaf": false, "_parent": null, "_id": 663},
{"fname": "child 2", "_is_leaf": false, "_parent": 663, "_id": 665},
{"fname": "child 1 not empty", "_is_leaf": false,  "_parent": 663,  "_id": 664},
{"fname": "3 level", "_is_leaf": true, "_parent": 664, "_id": 666},

],
"success": true}

            '''
        return http.HttpResponse(res2, mimetype='application/json')
    return http.HttpResponse(res)


@url(r'^ui/combo-tabpanel-fields')
def combo_tabpanel(request):
    class Proxy(object):
        @staticmethod
        def absolute_url():
            return '/data/base-tree-data'

    window = ExtEditWindow()
    window.title = u'Combo and Tab'
    window.layout = 'fit'
    tab_panel = ExtTabPanel(title=u'Form for combo and tab', )

    panel1 = tab_panel.add_tab(title=u'Панелько1', height=300, layout='form', padding=15)
    panel1.items.append(ExtStringField(label=u'Имя'))

    combo = ExtComboBox(label=u'Combo_local',
                        display_field='type',
                        empty_text='choose',
                        editable=False,
                        trigger_action_all=True)
    combo2 = ExtComboBox(label=u'Combo_remote', display_field='lname', empty_text='choose')
    combo.set_store(ExtDataStore([[1, u'М'], [2, u'Ж']]))
    combo2.set_store(
        ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))

    panel1.items.append(combo)
    panel1.items.append(combo2)
    panel2 = ExtPanel(title=u'Панелько2', height=300, layout='form', padding=15)
    panel2.items.append(ExtDateField(label=u'Дата'))

    tab_panel.tabs.append(panel2)

    grid = ExtGrid()
    grid.add_column(header=u'Имя', data_index='fname', width=140, sortable=True)
    grid.add_column(header=u'Фамилия', data_index='lname', width=140)
    grid.set_store(ExtDataStore([[1, u'М'], [2, u'Ж']]))

    panel3 = ExtPanel(title=u'Grid', layout='fit')
    panel3.items.append(grid)
    tab_panel.tabs.append(panel3)

    person = ExtFieldSet(title=u'Физические лица', checkboxToggle=True)
    person_relation = ExtCheckBox(
        label=u'Родственники',
        name='person_relation'
    )

    cont = ExtDictSelectField(label=u'Первый участник',
                              url='/ui/tree-dict-window',
                              autocomplete_url='/data/grid-json-store-data',
                              ask_before_deleting=False,
                              width=200,
    )

    cont.display_field = 'lname'
    cont.value_field = 'id'
    cont.hide_trigger = True
    cont.anchor = '100%'
    cont.hide_trigger = False
    cont.handler_afterselect = 'function(){ console.log("afterselect")}'
    cont.handler_beforerequest = 'function(){ console.log("handler_beforerequest")}'
    cont.handler_changed = 'function(){ console.log("handler_changed")}'
    cont.handler_afterrender = 'function(){console.log("handler_afterrender")}'

    date_field = ExtDateField(format='d-m', label=u'datefield')

    person_relation2 = ExtStringField(label=u'Родственники2')
    center_person = ExtContainer(
        layout='form',
        style={'padding-left': '5px'}
    )

    center_person.items.extend([person_relation, person_relation2, cont
        , date_field])
    person.items.append(center_person)

    panel4 = ExtPanel(title=u'Field Set')
    panel4.items.append(person)
    tab_panel.tabs.append(panel4)

    window.form = ExtForm('Форма', layout='fit')
    window.form.items.append(tab_panel)
    return http.HttpResponse(window.get_script())


@url(r'^ui/toolbar-panel')
def toolbar_panel(request):
    window = ExtEditWindow(title=u'Toolbar and panel', closable=False)
    window.width = 550
    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    style = dict(border='3px double #9AC0CD', margin='10px')
    label_style = {'margin': '10px', 'font-weight': 'bold'}

    fname = ExtStringField(label=u'Имя', style=style, label_style=label_style)
    lname = ExtStringField(label=u'Фамилия', style=style, label_style=label_style)
    tel = ExtStringField(label=u'Контактный телефон', style=style, label_style=label_style)

    panel = ExtPanel(height=170, layout='form', padding=10)
    panel.items.append(fname)
    panel.items.append(lname)
    panel.items.append(tel)

    toolbar = ExtToolBar()

    button_toolbar = ExtButton(text=u'Удалить/Заблокировать',
                               handler='''function(){
                                        Ext.getCmp("%s").disable();
                                        Ext.getCmp("%s").setVisible(false);
                                        }''' \
                                       % (fname.client_id, tel.client_id))
    toolbar.items.append(button_toolbar)

    button_toolbar = ExtButton(text=u'Показать/Разблокировать',
                               handler='''function(){
                                        Ext.getCmp("%s").enable();
                                        Ext.getCmp("%s").setVisible(true);
                                        }''' \
                                       % (fname.client_id, tel.client_id))
    toolbar.items.append(button_toolbar)

    toolbar.add_spacer(50)
    field = ExtStringField(value=u'Какой-то поиск')
    toolbar.items.append(field)
    toolbar.add_text_item(u'Просто текст справо')

    button_toolbar = ExtButton(text=u'Еще кнопка, которая не залезла на экран')
    toolbar.items.append(button_toolbar)

    cont = ExtContainer()  # Пример работы контейнера
    cont.items.append(toolbar)

    cont_with_html = ExtContainer(
        # html=u'<div align="center"><b> HTML текст</b> </div>' #  FIXME: Разобраться почему не работают тесты
    )

    style = dict(padding='10px')
    label = ExtLabel(text=u'Лэйбл Орандж сода', style=style)

    form = ExtForm()

    form.items.append(cont)
    form.items.append(panel)
    form.items.append(cont_with_html)
    form.items.append(label)

    window.form = form
    return http.HttpResponse(window.get_script())


@url(r'^ui/field_validators')
def field_validators(request):
    win = ExtWindow(title=u'Пример полей с валидаторами')
    form = ExtForm(label_width=150)
    # Поля с проверками
    form.items.append(ExtStringField(max_length=30, label=u'Имя для входа (логин)'))
    form.items.append(ExtStringField(allow_blank=False,
                                     min_length=8,
                                     min_length_text=u'Коротковат парольчик!',
                                     label=u'Пароль',
                                     input_type='password'))
    form.items.append(ExtStringField(name='email', allow_blank=False, vtype='email', label=u'Электронная почта'))
    win.items.append(form)
    return http.HttpResponse(win.get_script())


@url(r'^ui/edit-grid')
def edit_grid(request):
    """Редактируемый грид"""
    window = ExtEditWindow(title=u'Редактируемый грид', layout='fit')
    #window.template_globals = 'ui-js/simple-window2-globals.js'
    #window.maximized = True
    window.width = 500

    grid = ExtGrid(title=u'Произвольный грид', editor=True)
    grid.add_column(header=u'Имя', data_index='fname')
    grid.add_column(header=u'Фамилия', data_index='lname', editor=ExtStringField())
    grid.add_column(header=u'Адрес', data_index='adress', editor=ExtStringField())
    grid.add_number_column(header=u'Зп', data_index='nc', editor=ExtNumberField())
    grid.add_date_column(header=u'Др', data_index='dc', editor=ExtDateField())
    grid.add_bool_column(header=u'Муж?',
                         data_index='bc',
                         text_false=u'Нет',
                         text_true=u'Да',
                         editor=ExtCheckBox())

    combo2 = ExtComboBox(label=u'Combo_remote', display_field='lname', empty_text='choose')
    combo2.set_store(
        ExtJsonStore(url='/data/grid-json-store-data', auto_load=False, total_property='total', root='rows'))
    grid.add_column(header=u'combo', data_index='co', editor=combo2)
    #grid.add_column(header=u'Выбор из справочника', data_index = 'from_dict', editor = field)

    grid.set_store(ExtDataStore([[1, 'Юрий', 'Кофтун', 'пр. Мира', '', '', 'false'],
                                 [2, 'Анатоле', 'Кожемякин', 'пл. Земля ', '', '', 'false']]
    ))
    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    window.form = grid

    return http.HttpResponse(window.get_script())


@url(r'^ui/dictionary-window')
def dictionary_window(request):
    window = ExtDictionaryWindow(title=u'Форма списка и выбора из простого плоского справочника', mode=0)
    window.init_grid_components()
    window.width = 500
    window.height = 400
    window.maximizable = True
    window.grid.add_column(header=u'Имя', data_index='fname')
    window.grid.add_column(header=u'Фамилия', data_index='lname')
    window.grid.add_column(header=u'Адрес', data_index='adress')
    window.grid.set_store(
        ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))
    window.url_new_grid = '/ui/simple-window3'
    window.url_edit_grid = '/ui/simple-window3'
    window.url_delete_grid = '/ui/simple-window3'
    #window.column_name_on_select = 'fname'


    pbar = ExtPagingBar()
    pbar.store = window.grid.get_store()
    window.grid.bottom_bar = pbar

    return http.HttpResponse(window.get_script())


@url(r'^ui/layout-border')
def layout_border(request):
    window = ExtEditWindow(title=u'Layout border', layout='border')

    panel_list_view = ExtPanel(region='south',
                               layout='fit',
                               min_height=100,
                               collapsible=True,
                               split=True)

    tab_panel = ExtTabPanel(title='Центр', region='center')
    tab_panel.add_tab(title=u'Панелько1', layout='form', padding=15)
    tab_panel.add_tab(title=u'Панелько1', layout='form', padding=15)

    window.items.append(panel_list_view)
    window.items.append(tab_panel)

    return http.HttpResponse(window.get_script())


@url(r'^ui/find-by-name')
def find_by_name(request):
    window = ExtEditWindow(title=u'Submit form', width=600)

    iname = ExtStringField(label=u'Значение', name='value',
                           mask_re=u'[а-я]', empty_text=u'Тупо эмпти текст')
    city = ExtStringField(label=u'Атрибут', name='attr')

    adress = ExtStringField(label=u'Свойство', name='property')
    lname = ExtStringField(label=u'Параметр', name='param')

    cont_c1 = ExtContainer(layout='column')
    cont_f2 = ExtContainer(layout='form', style={'padding': '5px'}, name='cont_f2')
    cont_f2.items.append(iname)
    cont_f2.items.append(city)
    cont_f3 = ExtContainer(layout='form', style={'padding': '5px'})
    cont_f3.items.append(adress)
    cont_f3.items.append(lname)

    cont_c1.items.append(cont_f2)
    cont_c1.items.append(cont_f3)

    combo = ExtComboBox(label=u'Combo_local', display_field='text', name='local_id', value_field='id',
                        trigger_action_all=True)
    combo2 = ExtComboBox(label=u'Combo_remote', display_field='lname', name='remote_id', value_field='id')
    combo.value = 2
    combo.set_store(ExtDataStore([[1, u'М'], [2, u'Ж']]))
    combo2.set_store(
        ExtJsonStore(url='/data/grid-json-store-data', total_property='total', root='rows', auto_load=True))
    combo.value = 1
    cont_c1.items.append(combo)
    cont_c1.items.append(combo2)

    form = ExtForm()
    form.items.append(cont_c1)

    search_item = cont_c1.find_by_name('iname')
    if search_item:
        iname.value = search_item.name + ' -- ' + search_item.__class__.__name__

    form.url = '/data/grid-json-store-data'
    window.form = form

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)

    save_btn = ExtButton(text=u'Сохранить')
    save_btn.handler = js_submit_form(window.form,
                                      success_handler=u"function(){ console.log('success') }",
                                      failure_handler=u"function(){ console.log('fail') }")

    window.buttons.append(save_btn)
    window.buttons.append(button)

    return http.HttpResponse(window.get_script())


@url(r'^ui/tree-dict-window')
def tree_dictionary_window(request):
    window = ExtDictionaryWindow(title=u'Форма списка и выбора из связанного иерархического справочника', mode=1)
    window.init_tree_components()
    window.init_grid_components()

    window.width = 700
    window.height = 400
    window.maximizable = True
    window.grid.add_column(header=u'Имя', data_index='fname')
    window.grid.add_column(header=u'Фамилия', data_index='lname')
    window.grid.add_column(header=u'Адрес', data_index='adress')
    window.grid.set_store(
        ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))

    window.url_new_grid = '/ui/simple-window3'
    window.url_edit_grid = '/ui/simple-window3'
    window.url_delete_grid = '/ui/simple-window3'
    window.url_drag_grid = '/ui/simple-window3'

    window.url_new_tree = '/ui/simple-window3'
    window.url_edit_tree = '/ui/simple-window3'
    window.url_delete_tree = '/ui/simple-window3'
    window.url_drag_tree = '/ui/simple-window3'

    window.tree.drag_drop = True
    window.tree.handler_dragdrop = 'function(tree, node, dd, e){console.log(node);console.log(dd);console.log(e);}'
    window.tree.handler_dragover = 'function(dragOver){console.log(dragOver)}'
    window.tree.handler_startdrag = 'function(){console.log("handler_startdrag")}'
    window.tree.handler_enddrag = 'function(){console.log("handler_enddrag")}'
    window.tree.handler_drop = 'function(drop){console.log(drop)}'
    window.tree.handler_beforedrop = 'function(drop){console.log(drop)}'

    window.tree.handler_startdrag = None
    window.tree.handler_dragover = None

    window.tree.custom_load = False
    window.tree.root_text = 'Справчочни'
    window.tree.url = '/data/base-tree-data'
    window.tree.add_column(header=u'Имя', data_index='fname', width=140)
    window.column_name_on_select = 'fname'

    window.url_delete_tree = None
    window.url_delete_grid = None

    window.make_read_only()

    return http.HttpResponse(window.get_script())


@url(r'^ui/search-field')
def search_field(request):
    window = ExtWindow(title=u'Контрол поиска', layout='fit', resizable=False)

    tree = ExtTree(url='/data/base-tree-data')  # -- для дерева, подгружаемого с сервера
    tree.add_column(header=u'Имя', data_index='fname', width=140)
    tree.add_column(header=u'Фамилия', data_index='lname', width=140)
    tree.add_column(header=u'Адрес', data_index='adress', width=140)
    tree.add_number_column(header=u'Зп', data_index='nc', width=60)
    tree.add_date_column(header=u'Др', data_index='dc', width=60)
    tree.add_bool_column(header=u'Муж?',
                         data_index='bc',
                         text_false=u'Нет',
                         text_true=u'Да',
                         width=50)

    grid = ExtGrid()
    grid.add_column(header=u'Имя', data_index='fname')
    grid.add_column(header=u'Фамилия', data_index='lname')
    grid.add_column(header=u'Адрес', data_index='adress')
    grid.set_store(ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))

    window.items.append(tree)

    search = ExtSearchField(component_for_search=tree, empty_text=u'Поиск')

    search_other = ExtSearchField(component_for_search=tree, empty_text=u'Другой поиск')
    menu = ExtContextMenu(style=dict(overflow='visible'))
    menu.items.append(search_other)

    toolbar = ExtToolBar()
    toolbar.items.append(search)
    toolbar.add_fill()
    toolbar.add_menu(text=u'Поиск', menu=menu)

    window.top_bar = toolbar

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    return http.HttpResponse(window.get_script())


@url(r'^ui/table-form')
def table_form(request):
    window = ExtWindow(title=u'Окно табличная форма', layout='fit', width=700)

    form = ExtForm(layout='fit', url='/data/grid-json-store-data')
    form.label_width = 60

    search1 = ExtStringField(label=u'Привет1', empty_text=u'Поиск', style={'margin-left': '50px'})
    search2 = ExtStringField(label=u'Привет2', empty_text=u'Еще поиск')
    search3 = ExtStringField(label=u'Привет3', empty_text=u'+ поиск')
    search4 = ExtStringField(label=u'Привет4', empty_text=u'И еще раз')
    search5 = ExtStringField(label=u'Привет Привет', empty_text=u'И еще раз')
    search6 = ExtStringField(label=u'Привет4', empty_text=u'И еще раз')

    search7 = ExtStringField(label=u'Привет4', empty_text=u'И еще раз')
    search8 = ExtStringField(label=u'Привет Привет', empty_text=u'И еще раз')
    search9 = ExtStringField(label=u'Привет4', empty_text=u'И еще раз')

    cont = ExtDictSelectField(label=u'Первый участник',
                              url='/ui/tree-dict-window',
                              autocomplete_url='/data/grid-json-store-data',
                              ask_before_deleting=False,
    )

    cont.display_field = 'lname'
    cont.value_field = 'id'
    cont.auto_load = True

    tform = ExtContainerTable(title=u'Табличная форма', width=100)
    tform.rows_count = 4
    tform.columns_count = 3
    tform.style = dict(padding="10px")

    tform.set_item(0, 0, search1, colspan=2)
    #tform.set_item(0,1, search2)
    tform.set_item(0, 2, search3, colspan=2)
    tform.set_item(1, 0, search4)
    tform.set_item(1, 1, search5)
    tform.set_item(1, 2, search6)

    tform.set_item(2, 0, search7)
    tform.set_item(2, 1, search8)
    tform.set_item(2, 2, search9)

    tform.set_item(3, 0, cont)

    #tform.set_rows_height(100)
    #tform.set_default_rows_height()
    #tform.set_row_height(6,100)

    form.items.append(tform)
    window.items.append(form)

    menu = ExtContextMenu()
    menu.add_item(text=u'Просто 1')
    menu.add_item(text=u'Просто 2')
    menu.add_item(text=u'Просто 3')
    menu.add_item(text=u'Просто 4')
    menu.add_item(text=u'Просто 5')
    menu.add_item(text=u'Просто 6')

    button = ExtButton(text=u'Split button')
    button.menu = menu
    button.handler = 'function(){Ext.getCmp("%s").getForm().submit() }' % form.client_id
    window.buttons.append(button)

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    print tform.items

    return http.HttpResponse(window.get_script())


@url(r'^ui/selection-model')
def selection_models(request):
    def get_win(title, coords, selModel):
        win = ExtWindow(layout='fit', title=title, x=coords[0], y=coords[1])
        grid = ExtGrid(sm=selModel)
        grid.add_column(header=u'Имя', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname')
        grid.add_column(header=u'Адрес', data_index='adress')
        grid.set_store(ExtDataStore([[1, u'Юрий', u'Кофтун', u'пр. Мира'],
                                     [2, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                     [3, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                     [4, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                     [5, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                     [6, u'Анатоле', u'Кожемякин', u'пл. Земля '],
        ]
        ))
        cont = ExtContainer(layout='fit')
        cont.items.append(grid)
        win.items.append(cont)
        return win

    checkBoxWin = get_win('CheckBoxSelModel', (80, 120,), ExtGridCheckBoxSelModel())
    cellWin = get_win('CellSelModel', (checkBoxWin.x + checkBoxWin.width, 120,), ExtGridCellSelModel())
    return http.HttpResponse(checkBoxWin.get_script() + ';' + cellWin.get_script())


@url(r'^ui/object-tree')
def object_tree(request):
    """
    @return:
    """

    class Proxy(object):
        @staticmethod
        def absolute_url():
            return '/data/base-tree-data'

    win = ExtWindow(layout='fit')

    adv_tree = ExtObjectTree()
    adv_tree.add_column(header=u'Имя', data_index='fname', width=140, sortable=True)
    adv_tree.master_column_id = 'fname'
    adv_tree.auto_expand_column = 'fname'
    adv_tree.add_column(header=u'Фамилия', data_index='lname', width=140)
    adv_tree.top_bar.button_refresh.text = None

    adv_tree.action_data = Proxy
    adv_tree.action_new = Proxy
    adv_tree.action_edit = Proxy
    adv_tree.action_delete = Proxy
    #adv_tree.top_bar.button_new.text = u'Добавить новую роль'
    adv_tree.row_id_name = 'userrole_id'
    adv_tree.use_bbar = True
    adv_tree.sm = ExtGridCheckBoxSelModel()

    win.items.append(adv_tree)

    return http.HttpResponse(win.get_script())


@url(r'^ui/fieldset')
def fieldset(request):
    win = ExtWindow()

    person = ExtFieldSet(title=u'Физические лица', checkboxToggle=True)
    person_relation = ExtCheckBox(
        label=u'Родственники',
        name='person_relation'
    )

    cont = ExtDictSelectField(label=u'Первый участник',
                              url='/ui/tree-dict-window',
                              autocomplete_url='/data/grid-json-store-data',
                              ask_before_deleting=False,
                              width=200)

    cont.display_field = 'lname'
    cont.value_field = 'id'
    cont.hide_trigger = True
    cont.anchor = '100%'
    cont.handler_afterselect = 'function(){ console.log("afterselect")}'
    cont.handler_beforerequest = 'function(){ console.log("handler_beforerequest")}'
    cont.handler_changed = 'function(){ console.log("handler_changed")}'
    cont.handler_afterrender = 'function(){console.log("handler_afterrender")}'

    person_relation2 = ExtStringField(label=u'Родственники2')
    center_person = ExtContainer(
        layout='form',
        style={'padding-left': '5px'}
    )

    center_person.items.extend([person_relation, person_relation2])
    person.items.append(center_person)
    win.items.append(person)

    person = ExtFieldSet(title=u'Юридические лица', collapsible=True)
    person_relation = ExtCheckBox(
        label=u'Собственник',
        name='person_relation'
    )
    person_relation2 = ExtStringField(label=u'Объект')
    center_person = ExtContainer(
        layout='form',
        style={'padding-left': '5px'}
    )

    center_person.items.extend([person_relation, cont])
    center_person.items.extend([person_relation2])
    person.items.extend([center_person])
    win.items.append(person)

    return http.HttpResponse(win.get_script())


@url(r'^ui/grid-locking-column')
def locking_grid(request):
    """
    Пример таблицы с фиксированием
    """
    window = ExtEditWindow(title=u'Произвольная таблица c фиксированием', layout='fit')

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    grid = ExtGrid()
    col1 = ExtGridColumn(header=u'Имя', data_index='fname')
    col1.extra['locked'] = True
    grid.columns.append(col1)
    col2 = ExtGridColumn(header=u'Фамилия', data_index='lname')
    col2.extra['locked'] = True
    grid.columns.append(col2)
    grid.add_column(header=u'Адрес', data_index='adress')
    grid.add_column(header=u'Адрес 2', data_index='adress')
    grid.add_column(header=u'Адрес 3', data_index='adress')
    grid.set_store(ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))
    grid.col_model = ExtGridLockingColumnModel()
    grid.view = ExtGridLockingView()
    window.form = grid

    return http.HttpResponse(window.get_script())


@url(r'^ui/grid-banded-locking-column')
def banded_locking_grid(request):
    """
    Пример таблицы с фиксированием и группировкой
    """
    window = ExtEditWindow(title=u'Произвольная таблица c фиксированием и группировкой', layout='fit')

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    grid = ExtGrid()
    col1 = ExtGridColumn(header=u'Имя', data_index='fname')
    #col1.extra['locked'] = True
    grid.columns.append(col1)
    col2 = ExtGridColumn(header=u'Фамилия', data_index='lname')
    #col2.extra['locked'] = True
    grid.columns.append(col2)
    grid.add_column(header=u'Адрес', data_index='adress')
    grid.add_column(header=u'Адрес 2', data_index='adress')
    grid.add_column(header=u'Адрес 3', data_index='adress')
    grid.set_store(ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))
    # grid.col_model = ExtGridLockingHeaderGroupColumnModel()

    # Бандитские колонки
    grid.add_banded_column(ExtGridColumn(header=u'Мегаколонка 1', align='center'), 0, 2)
    grid.add_banded_column(ExtGridColumn(header=u'Мегаколонка 2', align='center'), 0, 3)
    grid.add_banded_column(ExtGridColumn(header=u'Подколонка1', align='center'), 1, 2)
    grid.add_banded_column(ExtGridColumn(header=u'Подколонка2', align='center'), 1, 1)
    # это обязательно!!!! иначе не будет ничего :)
    grid.show_banded_columns = False

    # grid.view = ExtGridLockingHeaderGroupView(grid=grid)
    window.form = grid

    return http.HttpResponse(window.get_script())


@url(r'^ui/grid-column-filter')
def column_filter_grid(request):
    """
    Пример таблицы с фильтром
    """
    window = ExtEditWindow(title=u'Произвольная таблица c фильтром', layout='fit')

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    grid = ExtGrid()
    grid.columns.append(ExtGridColumn(header=u'Имя', data_index='fname'))
    grid.columns.append(ExtGridColumn(header=u'Фамилия', data_index='lname'))
    grid.add_column(header=u'Адрес', data_index='adress')
    grid.set_store(ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))
    date_f = ExtDateField(label=u'Дата', name='date')
    adress = ExtStringField(name='adress', width='200', label=u'Адрес проживания')

    for col in grid.columns:
        if col.data_index == 'fname':
            #col.extra['filter'] = u'{xtype:"textfield", tooltip:"Имя", filterName:"fname"}'
            #col.extra['filter'] = u'{control:%s}' % date_f.render()
            col.extra['filter'] = adress.render()
        if col.data_index == 'lname':
            #col.extra['filter'] = u'{xtype:"textfield", tooltip:"Фамилия", filterName:"lname"}'
            col.extra['filter'] = date_f.render()
        if col.data_index == 'adress':
            col.extra[
                'filter'] = u'[{xtype:"textfield", tooltip:"Улица", filterName:"street"},{xtype:"textfield", tooltip:"Дом", filterName:"house"}]'
    grid.plugins.append('new Ext.ux.grid.GridHeaderFilters()')
    window.form = grid

    return http.HttpResponse(window.get_script())


@url(r'^data/grid-qtip-data')
def grid_qtip_data(request):
    from m3 import M3JSONEncoder

    enc = M3JSONEncoder()
    str = enc.encode(request.POST)
    return http.HttpResponse(u'{server: "Данные подсказки, пришедшие с сервера!", record: %s}' % str)


@url(r'^data/grid-qtip-mega-data')
def grid_qtip_mega_data(request):
    from m3 import M3JSONEncoder

    enc = M3JSONEncoder()
    vals = [{'score': u'Единица', 'value': 1, 'class': 'ext-color-1-ad'},
            {'score': u'Двойка', 'value': 2, 'class': 'ext-color-2-ad'},
            {'score': u'Тройка', 'value': 3, 'class': 'ext-color-3-ad'},
            {'score': u'Четверка', 'value': 4, 'class': 'ext-color-1-ad'},
            {'score': u'Пятерка', 'value': 5, 'class': 'ext-color-2-ad'}
    ]
    str = enc.encode(vals)
    return http.HttpResponse(u'{server: "Данные подсказки, пришедшие с сервера!", record: %s}' % str)


@url(r'^ui/grid-with-qtip')
def grid_qtip(request):
    """
    Пример таблицы с подсказками
    """
    window = ExtEditWindow(title=u'Таблица с подсказками', layout='fit', width=600)
    window.template_globals = 'ui-js/grid-qtip-globals.js'

    button = ExtButton(text=u'Закрыть')
    button.handler = js_close_window(window)
    window.buttons.append(button)

    grid = ExtGrid()
    col1 = ExtGridColumn(header=u'Имя', data_index='fname')
    grid.columns.append(col1)
    col2 = ExtGridColumn(header=u'Фамилия', data_index='lname')
    grid.columns.append(col2)
    grid.add_column(header=u'Адрес', data_index='adress')
    grid.add_column(header=u'Мега поле', data_index='mega')
    grid.add_column(header=u'Двойной щелчок', data_index='click_me')
    grid.set_store(ExtJsonStore(url='/data/grid-json-store-data', auto_load=True, total_property='total', root='rows'))

    plug = u'''new Ext.ux.plugins.grid.CellToolTips([
        {
            field: 'fname',
            /* tpl: '<b>Полное имя: {fname} {lname}</b><br />Это пример подсказки для строки {id}' */
        },
        {
            field: 'lname',
            /* tpl: '<b>Вычисляемое поле в подсказке:</b></br>{formula} = {calculate}', */
            fn: function(parms) {
                parms.formula = Math.floor(Math.random()*11)+' + '+Math.floor(Math.random()*100)+'*2';
                parms.calculate = eval(parms.formula);
                return parms;
            }
        },
        {
            field: 'adress',
            /* tpl: '<b>Пример запроса подсказки с сервера</b><br/>Поля "adress" уже нет в данных: {adress}</br>Есть только то, что пришло с сервера:</br><u>{server}</u></br>а здесь уже есть адрес:{values.record.adress}</br>Результат постобработки запроса:{new_data}', */
            url: 'data/grid-qtip-data',
            fn: function(parms) {
                parms.formula = Math.floor(Math.random()*11)+' + '+Math.floor(Math.random()*100)+'*2';
                parms.calculate = eval(parms.formula);
                return parms;
            },
            afterFn: function(data) {
                data.new_data = data.record.calculate;
                return data;
            }
        }
        ])'''
    # FIXME: tpl ломается в тестах
    grid.plugins.append(plug)
    # добавим еще один обработчик подсказок - со своим стилем
    plug1 = u'''new Ext.ux.plugins.grid.CellToolTips([
        {
            field: 'mega',
            tipConfig: {anchor: 'left',
                        items: [{
                                xtype: 'displayfield',
                                fieldLabel: 'Field 1',
                                value: 'Value 1'
                            }, {
                                xtype: 'button',
                                text: 'Button 1'
                        }]},
            url: 'data/grid-qtip-mega-data'
            /* tpl: '<b>Мега подсказка с собственным стилем, отличным от других</b><br /><tpl for="values.record"><div class="ext-cal-evr {class}">{score}:{value}</div></tpl>' */
        }
        ])
    '''
    # FIXME: tpl ломается в тестах

    grid.plugins.append(plug1)

    # добавим еще одну
    plug1 = u'''new Ext.ux.plugins.grid.CellToolTips([
        {
            field: 'click_me',
            tipConfig: {anchor: 'left',
                        trackMouse: false,
                        closable: true,
                        autoHide: false,
                        showDelay: 1000000,
                        dismissDelay: 0,
                        hideDelay: 0
                        },
            url: 'data/grid-qtip-mega-data'
            /* tpl: '<b><tpl for="values.record"><div class="ext-cal-evr {class}">{score}:{value}</div></tpl>' */
        }
        ])
    '''
    # FIXME: tpl ломается в тестах
    grid.plugins.append(plug1)

    window.form = grid

    return http.HttpResponse(window.get_script())


@url(r'^data/locking-grouping-grid')
def data_locking_grouping_grid(request):
    """

    """
    res = []
    for j in range(99):
        d = dict(id=j)
        for i, value in enumerate(range(1, 12)):
            d[str(i)] = value

        res.append(d)

    return http.HttpResponse('{"total":100,"rows":%s}' % json.dumps(res))

    #return http.HttpResponse(json.dumps(data), mimetype='application/json')


@url(r'^ui/locking-grouping-grid')
def locking_grouping_grid(request):
    window = ExtWindow(layout='fit', width=1000, height=500)

    grid = ExtGrid(force_fit=False)
    map(lambda i: grid.add_column(data_index=i, header=str(i), extra={'summaryType': '"sum"'}), range(1, 13))

    reader = ExtJsonReader(total_property='total', root='rows')
    reader.set_fields(*grid.columns)

    store = ExtGroupingStore(url='/data/locking-grouping-grid', auto_load=True)
    store.reader = reader

    grid.set_store(store)

    rows = [
        [
            {'header': '1.1', 'colspan': 6, 'align': 'center'},
            {'header': '1.2', 'colspan': 6, 'align': 'center'}
        ],
        [
            {'header': '2.1', 'colspan': 3, 'align': 'center'},
            {'header': '2.2', 'colspan': 3, 'align': 'center'},
            {'header': '2.3', 'colspan': 3, 'align': 'center'},
            {'header': '2.4', 'colspan': 3, 'align': 'center'}
        ],
        [
            {'header': '3.1', 'colspan': 1, 'align': 'center'},
            {'header': '3.2', 'colspan': 1, 'align': 'center'},
            {'header': '3.3', 'colspan': 1, 'align': 'center'},
            {'header': '3.4', 'colspan': 1, 'align': 'center'},
            {'header': '3.5', 'colspan': 2, 'align': 'center'},
            {'header': '3.6', 'colspan': 2, 'align': 'center'},
            {'header': '3.7', 'colspan': 1, 'align': 'center'},
            {'header': '3.8', 'colspan': 2, 'align': 'center'},
            {'header': '3.9', 'colspan': 1, 'align': 'center'}
        ]
    ]
    config = {'columnModelCfg': {'rows': rows, 'lockedCount': 2}, 'viewCfg': {'hideGroupedColumn': True, }}
    grid.plugins.append(ExtGridLockingHeaderGroupPlugin(config))

    window.items.append(grid)

    return http.HttpResponse(window.get_script())


@url(r'^data/object-grid')
def object_grid_with_selection_data(request):
    request_params = get_request_params(request)
    start = int(request_params.get('start', 0))
    limit = int(request_params.get('limit', 50))

    res = []
    for i in xrange(150):
        res.append({'id': i, 'lname': 'A %s' % i, 'fname': 'B %s' % i, 'adress': 'address'})

    return ExtGridDataQueryResult(res, start, limit).get_http_response()


@url(r'^ui/object-grid')
def object_grid_with_selection(request):
    window = ExtWindow(layout="fit", width=600, height=400)

    grid = ExtObjectGrid(region='center')
    grid.url_data = '/data/object-grid'
    grid.add_column(data_index='lname')
    grid.add_column(data_index='fname')
    grid.add_column(data_index='adress')

    tbar = ExtToolBar()
    tbar.add_text_item('123')
    tbar.add_separator()
    tbar.add_text_item('321')
    tbar.items.append(ExtButton(text='123'))

    grid = ExtObjectSelectionPanel(grid=grid,
                                   selection_columns=[
                                       {'data_index': 'lname', 'header': u'Первая'},
                                       {'data_index': 'fname', 'header': u'Вторая'}],
                                   selection_grid_conf={'width': 300,
                                                        #'tbar': tbar,
                                                        'split': True}
    )

    window.items.extend([grid, ])
    return http.HttpResponse(window.get_script())

