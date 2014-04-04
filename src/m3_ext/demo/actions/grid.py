# -*- coding: utf-8 -*-
from m3_ext.ui.misc import ExtDataStore
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
        grid = ExtGrid()
        grid.add_column(header=u'Имя', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname')
        grid.add_column(header=u'Адрес', data_index='adress')
        grid.set_store(ExtDataStore([[1, u'Юрий', u'Кофтун', u'пр. Мира'],
                                 [2, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                 [3, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                 [4, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                 [5, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                 [6, u'Анатоле', u'Кожемякин', u'пл. Земля '],]))
        #grid.handler_dblclick = 'function(){ console.log(11) }'
        win.items.append(grid)
        return win

    def get_result(self, request, context):
        res = super(SimpleGridAction, self).get_result(request, context)
        #res['data']['message'] = u"Кнопка нажата!"
        return res
