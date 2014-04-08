# -*- coding: utf-8 -*-
from django.http import HttpResponse
from m3.actions import Action
from m3.actions.urls import get_url
from m3_ext.ui.containers.grids import ExtEditorGrid
from m3_ext.ui.misc import ExtDataStore, ExtJsonStore
from m3_ext.ui.containers import ExtGrid
from m3_ext.ui import all_components as ext

from base import Pack, UIAction


@Pack.register
class SimpleGridAction(UIAction):
    """
    Пример простой таблицы
    """
    title = u'Простая таблица'

    def get_js(self, request, context):
        return """function(win, data){
            win.buttons[0].on('click', function(){
                win.close(false);
            });
            win.find('itemId', 'grid')[0].on('dblclick', function(){
                alert('Хватит кликать!');
            });
            // вместо handler у пункта меню
            var grid = win.getComponent("grid");
            var item = grid.params.menus.rowContextMenu.getComponent("get_name");
            item.on('click', function(cmp, e){
                Ext.Msg.alert("Проверка", grid.getSelectionModel().getSelected().get("fname"));
            });
        }"""

    def get_ui(self, request, context):
        win = super(SimpleGridAction, self).get_ui(request, context)
        win.layout = 'fit'
        win.width = 400
        win.height = 400
        win.maximizable = True
        win.minimizable = True
        win.btn = ext.ExtButton(text=u'Закрыть')
        win.buttons.append(win.btn)
        grid = ExtGrid(item_id='grid')
        grid.add_column(header=u'Имя', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname')
        grid.add_column(header=u'Адрес', data_index='adress')
        grid.set_store(ExtDataStore([
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

        # FIXME: вот оно злое отсутствие свойств или метода pre_config
        grid.columns_to_store()
        win.items.append(grid)
        return win


@Pack.register
class EditGridAction(UIAction):
    """
    Пример простой редактируемой таблицы
    """
    title = u'Редактируемая таблица'

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
        grid = ExtEditorGrid(title=u'Редактируемый грид', header=True)
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

        grid.set_store(ExtDataStore([[1, 'Юрий', 'Кофтун', 'пр. Мира', '', '', 'false'],
                                     [2, 'Анатоле', 'Кожемякин', 'пл. Земля ', '', '', 'true']]
        ))
        # FIXME: вот оно злое отсутствие свойств или метода pre_config
        grid.columns_to_store()
        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть')
        window.buttons.append(button)
        return window


@Pack.register
class DataAction(Action):
    """
    Данные для грида
    """
    url = '/data'

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
        return HttpResponse('{"total":121,"rows":[%s]}' % ','.join(res))


@Pack.register
class GridRemoteStoreAction(UIAction):
    """
    Пример таблица с данными с сервера
    """
    title = u'Пример ExtGrid и ExtJsonStore'

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
        grid = ExtGrid()
        grid.add_column(header=u'Имя', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname', editor=ext.ExtStringField())
        grid.add_column(header=u'Адрес', data_index='adress', editor=ext.ExtStringField())
        grid.store = ExtJsonStore(url=get_url(DataAction),
                                  auto_load=True,
                                  total_property='total',
                                  root='rows')
        # FIXME: вот оно злое отсутствие свойств или метода pre_config
        grid.columns_to_store()
        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть')
        window.buttons.append(button)
        return window


@Pack.register
class GridAction(UIAction):
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
                ext.ExtButton(text=u'Закрыть'),
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
class GridAjaxAction(UIAction):
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
                ext.ExtButton(text=u'Закрыть'),
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

