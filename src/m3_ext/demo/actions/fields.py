#coding: utf-8
from m3_ext.demo.actions.base import Pack, UIAction
from m3_ext.ui import all_components as ext
from m3_ext.ui.fields.simple import ExtStringField

__author__ = 'prefer'


@Pack.register
class FieldsAction(UIAction):
    """
    Пример ExtStringField
    """

    title = u'Окно с ExtStringField'

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout='fit')

        form = ext.ExtForm(header=False, padding='5px')
        form.items.append(ExtStringField(label='123', anchor='100%'))


        win.items.append(form)
        return win
