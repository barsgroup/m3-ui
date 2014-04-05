# -*- coding: utf-8 -*-
from m3_ext.ui.containers.grids import ExtEditorGrid
from m3_ext.ui.fields import ExtComboBox
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
            win.find('itemId', 'grid')[0].on('dblclick', function(){
                alert('Хватит кликать!');
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
                                 [4, u'Нажми', u'меня', u'два раза'],
                                 [5, u'Анатоле', u'Кожемякин', u'пл. Земля '],
                                 [6, u'Анатоле', u'Кожемякин', u'пл. Земля '],]))
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
        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть')
        window.buttons.append(button)
        return window