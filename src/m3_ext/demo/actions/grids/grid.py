# -*- coding: utf-8 -*-
import json
from django import http
from django.http import HttpResponse
from m3.actions import Action
from m3.actions.urls import get_url
from m3_ext.demo.actions.base import DemoAction, Pack
from m3_ext.ui import all_components as ext


@Pack.register
class SimpleGridAction(DemoAction):
    """
    Пример простой таблицы
    """
    title = u'Простая таблица с контекстным меню'

    def get_ui(self, request, context):
        win = super(SimpleGridAction, self).get_ui(request, context)
        win.layout = win.FIT
        win.width = 400
        win.height = 400
        win.maximizable = True
        win.minimizable = True
        win.btn = ext.ExtButton(text=u'Закрыть', handler='close')
        win.buttons.append(win.btn)
        grid = ext.ExtGrid(item_id='grid')
        grid.add_column(header=u'Имя', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname')
        grid.add_column(header=u'Адрес', data_index='adress')
        grid.set_store(ext.ExtDataStore([
            [1, u'Юрий', u'Кофтун', u'пр. Мира'],
            [2, u'Анатоле', u'Кожемякин', u'пл. Земля '],
            [3, u'Анатоле', u'Кожемякин', u'пл. Земля '],
            [4, u'Нажми', u'меня', u'два раза'],
            [5, u'Анатоле', u'Кожемякин', u'пл. Земля '],
            [6, u'Анатоле', u'Кожемякин', u'пл. Земля '],
        ]))
        menu = ext.ExtContextMenu()
        menu.add_item(text=u'Тупой пункт на весь грид')
        grid.handler_contextmenu = menu

        row_menu = ext.ExtContextMenu(item_id='row_menu')
        row_menu.add_item(text=u'Просто пункт без события')
        row_menu.add_separator()
        row_menu.add_item(text=u'Показать имя', item_id='get_name')
        grid.handler_rowcontextmenu = row_menu

        win.items.append(grid)
        return win


@Pack.register
class EditGridAction(DemoAction):
    """
    Пример простой редактируемой таблицы
    """
    title = u'Редактируемая таблица (ExtEditorGrid)'

    def get_js(self, request, context):
        return """function(win, data){
            win.buttons[0].on('click', function(){
                win.close(false);
            });
        }"""

    def get_ui(self, request, context):
        window = super(EditGridAction, self).get_ui(request, context)
        window.width = 500
        window.height = 300
        window.layout = 'fit'
        # Теперь вместо этого кода, придется юзать отдельный грид
        #grid = ExtGrid(title=u'Произвольный грид', editor=True)
        grid = ext.ExtEditorGrid(title=u'Редактируемый грид', header=True)
        grid.add_column(header=u'Имя', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname', editor=ext.ExtStringField())
        grid.add_column(header=u'Адрес', data_index='adress', editor=ext.ExtStringField())
        grid.add_number_column(header=u'Зп', data_index='nc', editor=ext.ExtNumberField())
        # FIXME: не редактируется в редакторе
        grid.add_date_column(header=u'Др', data_index='dc', editor=ext.ExtDateField())
        # FIXME: не редактируется
        grid.add_bool_column(header=u'Муж?',
                             data_index='bc',
                             text_false=u'Нет',
                             text_true=u'Да',
                             editor=ext.ExtCheckBox())
        # FIXME: неверно отображает значения. не редактируется
        grid.add_check_column(header=u'Муж?', data_index='bc')
        # FIXME: доделать с комбобоксом
        # combo2 = ext.ExtComboBox(label=u'Combo_remote', display_field='lname', empty_text='choose')
        # combo2.set_store(ExtJsonStore(url='/data/grid-json-store-data', auto_load=False, total_property='total', root='rows'))
        # grid.add_column(header=u'combo', data_index='co', editor=combo2)
        #grid.add_column(header=u'Выбор из справочника', data_index = 'from_dict', editor = field)

        grid.set_store(ext.ExtDataStore([[1, 'Юрий', 'Кофтун', 'пр. Мира', '', '', 'false'],
                                         [2, 'Анатоле', 'Кожемякин', 'пл. Земля ', '', '', 'true']]
        ))

        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть', handler='close')
        window.buttons.append(button)
        return window


@Pack.register
class DataAction(Action):
    """
    Данные для грида
    """
    url = '/data/grid'

    def run(self, request, context):
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
        return HttpResponse('{"total":121,"rows":[%s]}' % ','.join(res), mimetype='application/json')


@Pack.register
class GridRemoteStoreAction(DemoAction):
    """
    Пример таблица с данными с сервера
    """
    title = u'Таблица с серверными данными (ExtJsonStore)'

    def get_js(self, request, context):
        return """function(win, data){
            win.buttons[0].on('click', function(){
                win.close(false);
            });
        }"""

    def get_ui(self, request, context):
        window = super(GridRemoteStoreAction, self).get_ui(request, context)
        window.width = 500
        window.height = 500
        window.layout = 'fit'
        grid = ext.ExtGrid()
        grid.add_column(header=u'Имя1', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname')
        grid.add_column(header=u'Адрес', data_index='adress')
        grid.store = ext.ExtJsonStore(url=get_url(DataAction),
                                      auto_load=True, total_property='total',
                                      root='rows')

        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть', handler='close')
        window.buttons.append(button)
        return window


@Pack.register
class BandedColumnAction(DemoAction):
    """
    Пример таблицы с группировкой колонок
    """
    title = u'Таблица с группировочными ("бандитскими") колонками'

    def get_js(self, request, context):
        return """function(win, data){
            win.buttons[0].on('click', function(){
                win.close(false);
            });
        }"""

    def get_ui(self, request, context):
        window = super(BandedColumnAction, self).get_ui(request, context)
        window.width = 600
        window.height = 500
        window.layout = 'fit'
        grid = ext.ExtGrid()
        grid.add_column(header=u'Имя', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname')
        grid.add_column(header=u'Адрес', data_index='adress')
        grid.add_column(header=u'Адрес 2', data_index='adress')
        grid.add_column(header=u'Адрес 3', data_index='adress')
        grid.store = ext.ExtJsonStore(url=get_url(DataAction),
                                      auto_load=True, total_property='total',
                                      root='rows')
        # Бандитские колонки
        grid.add_banded_column(None, 0, 1)
        grid.add_banded_column(ext.ExtGridColumn(header=u'Мегаколонка', align='center'), 0, 4)
        grid.add_banded_column(None, 1, 1)
        grid.add_banded_column(ext.ExtGridColumn(header=u'Подколонка1', align='center'), 1, 2)
        grid.add_banded_column(ext.ExtGridColumn(header=u'Подколонка2', align='center'), 1, 2)
        grid.add_banded_column(ext.ExtGridColumn(header=u'Под-подколонка 1', align='center'), 2, 2)
        grid.add_banded_column(ext.ExtGridColumn(header=u'Под-подколонка 2', align='center'), 2, 3)

        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть', handler='close')
        window.buttons.append(button)
        return window


@Pack.register
class GridAction(DemoAction):
    """
    Пример ExtGrid и ExtDataStore
    """
    title = u'Еще пример ExtGrid и ExtDataStore'

    def get_ui(self, request, context):
        win = ext.ExtWindow(
            layout=ext.ExtForm.FIT,
            width=400,
            height=400,
            maximizable=True,
            minimizable=True,
            buttons=[
                ext.ExtButton(text=u'Закрыть', handler='close'),
            ]
        )
        win.items.append(
            {
                "itemId": "grid",
                "columnLines": True,
                "fieldLabel": None,
                "xtype": "m3-grid",
                "autoExpandColumn": None,
                "tbar": None,
                "items": [],
                "loadMask": False,
                "header": False,
                "stripeRows": True,
                "stateful": True,
                "bbar": None,
                "store":
                    ext.ExtDataStore(
                        fields=["id", "fname", "lname", "adress"],
                        data=[(i, i * 10, i * 100, i * 1000) for i in range(10)]
                    ),

                "viewConfig": {
                    "showPreview": False,
                    "enableRowBody": False,
                    "forceFit": True},
                "border": True,
                "columns": [
                    {
                        "sortable": False,
                        "xtype": "gridcolumn",
                        "width": 100,
                        "header": "0",
                        "dataIndex": "fname",
                        "fixed": False
                    },
                    {
                        "sortable": False,
                        "xtype": "gridcolumn",
                        "width": 100,
                        "header": "1",
                        "dataIndex": "lname",
                        "fixed": False},
                    {
                        "sortable": False,
                        "xtype": "gridcolumn",
                        "width": 100,
                        "header": "2",
                        "dataIndex": "adress",
                        "fixed": False
                    }],
                "fbar": None
            }
        )

        return win


@Pack.register
class GridAjaxAction(DemoAction):
    """
    Пример ExtGrid и ExtDataStore
    """
    title = u'Еще пример ExtGrid и ExtJsonStore'

    def get_ui(self, request, context):
        win = ext.ExtWindow(
            layout=ext.ExtForm.FIT,
            width=400,
            height=400,
            maximizable=True,
            minimizable=True,
            buttons=[
                ext.ExtButton(text=u'Закрыть', handler='close'),
            ]
        )
        win.items.append(
            {
                "itemId": "grid",
                "columnLines": True,
                "fieldLabel": None,
                "xtype": "m3-grid",
                "autoExpandColumn": None,
                "tbar": None,
                "items": [],
                "loadMask": False,
                "header": False,
                "stripeRows": True,
                "stateful": True,
                "bbar": None,
                "store":
                    ext.ExtJsonStore(
                        fields=["id", "fname", "lname", "adress"],
                        url=get_url(DataAction),
                        auto_load=True,
                        total_property='total',
                        root='rows',
                        # writer=ext.ExtJsonWriter() # - тоже работает, но на него должен быть отдельный пример
                    ),

                "viewConfig": {
                    "showPreview": False,
                    "enableRowBody": False,
                    "forceFit": True},
                "border": True,
                "columns": [
                    {
                        "sortable": False,
                        "xtype": "gridcolumn",
                        "width": 100,
                        "header": "0",
                        "dataIndex": "fname",
                        "fixed": False
                    },
                    {
                        "sortable": False,
                        "xtype": "gridcolumn",
                        "width": 100,
                        "header": "1",
                        "dataIndex": "lname",
                        "fixed": False},
                    {
                        "sortable": False,
                        "xtype": "gridcolumn",
                        "width": 100,
                        "header": "2",
                        "dataIndex": "adress",
                        "fixed": False
                    }],
                "fbar": None
            }
        )

        return win


@Pack.register
class GridCheckSelectionAction(DemoAction):
    """
    Пример таблицы с выбором строк галочками
    """
    title = u'Таблица с галочками (ExtGridCheckBoxSelModel)'

    def get_js(self, request, context):
        return """function(win, data){
            win.buttons[0].on('click', function(){
                win.close(false);
            });
        }"""

    def get_ui(self, request, context):
        window = super(GridCheckSelectionAction, self).get_ui(request, context)
        window.width = 500
        window.height = 500
        window.layout = window.FIT
        grid = ext.ExtGrid(sm=ext.ExtGridCheckBoxSelModel())
        grid.add_column(header=u'Имя', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname')
        grid.add_column(header=u'Адрес', data_index='adress')
        grid.store = ext.ExtJsonStore(url=get_url(DataAction),
                                      auto_load=True, total_property='total',
                                      root='rows')

        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть', handler='close')
        window.buttons.append(button)
        return window


@Pack.register
class GroupingViewSelectionAction(DemoAction):
    """
    Пример таблицы с выбором строк галочками
    """
    title = u'ExtGridGroupingView'

    def get_ui(self, request, context):
        win = ext.ExtWindow(layout=ext.ExtWindow.FIT,
                            title=u'ExtGridGroupingView',
                            # xtype='grouping-window'
        )

        grid = ext.ExtGrid()
        map(lambda i: grid.add_column(data_index=i,
                                      header=str(i),
                                      extra={'summaryType': '"sum"'}),
            range(1, 13))

        store = ext.ExtGroupingStore(url=get_url(GroupingDataAction),
                                     auto_load=True,
                                     total_property='total',
                                     root='rows', )

        store.fields = [dict(name=i, mapping=i) for i in range(12)]

        store.group_field = '1'

        grid.store = store

        grid.view = ext.ExtGridGroupingView()

        win.items.append(grid)

        return win


@Pack.register
class GroupingDataAction(Action):
    """
    Пример таблицы с выбором строк галочками
    """

    url = '/data/locking-grouping-grid'

    def run(self, request, context):
        """

        """
        res = []
        for j in range(99):
            d = dict(id=j)
            for i, value in enumerate(range(1, 12)):
                d[str(i)] = value

            res.append(d)

        return http.HttpResponse('{"total":100,"rows":%s}' % json.dumps(res),
                                 mimetype='application/json')
