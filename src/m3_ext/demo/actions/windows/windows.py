#coding: utf-8
from m3_ext.demo.actions.grids.grid import DataAction
from m3_ext.ui import all_components as ext

from m3_ext.demo.actions import UIAction, Pack

__author__ = 'prefer'


@Pack.register
class EditWindowAction(UIAction):
    title = u'Окно редактирование с формой'

    def get_ui(self, request, context):
        win = ext.ExtEditWindow(
            xtype='demo-edit-window',
            # title=u'Окно с формой',
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

        return win


@Pack.register
class ListWindowAction(UIAction):
    """
    Пример оконного экшна со списком (гридом) внутри.
    """
    title = u'Окно со списком'

    def get_ui(self, request, context):
        win = ext.BaseExtListWindow()

        win.grid.add_column(header=u'Код', data_index='lname')
        win.grid.add_column(header=u'Наименование', data_index='fname')
        win.grid.action_data = DataAction
        return win

