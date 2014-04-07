#coding: utf-8

from base import Pack, UIAction
from m3_ext.ui import all_components as ext, all_components

__author__ = 'prefer'


@Pack.register
class EditWindowAction(UIAction):
    title = u'Окно редактирование с формой'

    def get_js(self, request, context):
        """
        Метод должен вернуть в виде строки js-код для окна
        """
        return """function(w, d) {
            var form = w.find('itemId', 'form')[0];
            var field = w.find('itemId', 'edit-field-id')[0];
            form.buttons[0].on('click', function(b, e){
                alert(field.getValue());
            });
            form.buttons[1].on('click', function(b, e){
                w.close();
            });
        }"""

    def get_ui(self, request, context):
        win = ext.ExtEditWindow(
            title=u'Окно с формой',
            layout='form',
            width=250,
            height=150)

        # FIXME: Заменить на полноценный ExtForm c полями после конвертации
        win.form = {
            'labelWidth': 75,
            'width': 230,
            'height': 100,
            'frame': True,
            'itemId': 'form',
            'xtype': 'form',
            'defaultType': 'textfield',
            'items': [
                {
                    'fieldLabel': u'Поле ввода',
                    'xtype': 'textfield',
                    'itemId': 'edit-field-id'
                },
            ],
            'buttons': [
                ext.ExtButton(text=u'Отобразить'),
                ext.ExtButton(text=u'Отмена')
            ]
        }
        win.items.append(win.form)
        return win


@Pack.register
class ListWindowAction(UIAction):
    """
    Пример оконного экшна со списком (гридом) внутри.
    """
    title = u'Окно со списком'

    def get_js(self, request, context):
        return """function(w, d){
            var grid = w.find('itemId', 'grid')[0];
            grid.store.loadData(d);
        }"""

    def get_ui(self, request, context):
        win = ext.BaseExtListWindow()
        return win

    def get_result(self, request, context):
        res = super(ListWindowAction, self).get_result(request, context)
        res['data']['total'] = 2
        res['data']['rows'] = [
            {'first': u'Первая', 'second': u'Вторая'},
        ]
        return res
