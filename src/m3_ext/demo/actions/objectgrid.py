# -*- coding: utf-8 -*-
from m3.actions import Action
from m3.actions.urls import get_url
from m3_ext.demo.actions import UIAction, Pack
from m3_ext.ui import all_components as ext
from m3_ext.ui.results import ExtGridDataQueryResult


@Pack.register
class ObjectGridAction(UIAction):
    """
    Пример объектной таблицы (ObjectGrid)
    """
    title = u'Объектная таблица (ObjectGrid)'

    def get_js(self, request, context):
        return """function(win, data){
            win.buttons[0].on('click', function(){
                win.close(false);
            });
        }"""

    def get_ui(self, request, context):
        window = super(ObjectGridAction, self).get_ui(request, context)
        window.width = 500
        window.height = 500
        window.layout = 'fit'
        grid = ext.ExtObjectGrid()
        grid.add_column(header=u'Код', data_index='code')
        grid.add_column(header=u'Наименование', data_index='name')
        #grid.url_data = get_url(DataAction)
        grid.action_data = DataAction
        grid.url_new = get_url(ObjectGridNewAction)
        grid.url_edit = get_url(ObjectGridEditAction)

        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть')
        window.buttons.append(button)
        return window


@Pack.register
class DataAction(Action):
    """
    Данные для грида
    """
    url = '/objgrid-data'

    def run(self, request, context):
        data = [
            {'id': '1', 'code': u'Код 1', 'name': u'Наименование 1'}
        ]
        return ExtGridDataQueryResult(data)


@Pack.register
class ObjectGridNewAction(UIAction):
    """
    Окно добавления в грид
    """
    title = None

    def get_js(self, request, context):
        return """function(win, data){
            win.buttons[0].on('click', function(){
                win.close(false);
            });
        }"""

    def get_ui(self, request, context):
        #window = ext.ExtEditWindow(title=u'Добавление записи в грид')
        window = super(ObjectGridNewAction, self).get_ui(request, context)
        window.title = u'Добавление записи в грид'
        window.width = 200
        window.height = 200
        window.layout = 'fit'
        button = ext.ExtButton(text=u'Закрыть')
        window.buttons.append(button)
        return window


@Pack.register
class ObjectGridEditAction(UIAction):
    """
    Окно редактирования грида
    """
    title = None

    def get_js(self, request, context):
        return """function(win, data){
            win.buttons[0].on('click', function(){
                win.close(false);
            });
        }"""

    def get_ui(self, request, context):
        #window = ext.ExtEditWindow(title=u'Добавление записи в грид')
        window = super(ObjectGridEditAction, self).get_ui(request, context)
        window.title = u'Редактирование записи в гриде'
        window.width = 200
        window.height = 200
        window.layout = 'fit'
        button = ext.ExtButton(text=u'Закрыть')
        window.buttons.append(button)
        return window