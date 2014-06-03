#coding: utf-8
from m3_ext.demo.actions.base import DemoAction, Pack
from m3_ext.ui import all_components as ext

from m3_ext.demo.actions.grids.grid import DataAction


@Pack.register
class EditWindowAction(DemoAction):
    title = u'Окно редактирование с формой'

    def get_ui(self, request, context):
        win = ext.ExtEditWindow(
            xtype='demo-edit-window',
            title=u'Окно с формой',
            layout='form',
            width=250,
            height=150,
            button_align=ext.ExtEditWindow.align_left,
            buttons=[
                ext.ExtButton(text=u'Отобразить'),
                ext.ExtButton(text=u'Отмена')
            ])

        win.form = ext.ExtForm(
            label_width=75,
            width=230,
            height=100,
            frame=True,
            default_type='textfield',
            item_id='form',
            items=[
                ext.ExtStringField(
                    item_id='edit-field-id',
                    name="name",
                    label="Name",
                    anchor="100%"
                )
            ],
        )
        return win

    def get_result(self, request, context):
        data = super(EditWindowAction, self).get_result(request, context)
        data['model'] = {'name': 'Moe'}
        return data


@Pack.register
class ListWindowAction(DemoAction):
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
