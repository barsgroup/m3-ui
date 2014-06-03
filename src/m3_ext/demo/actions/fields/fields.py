#coding: utf-8
from m3_ext.demo.actions.base import DemoAction, Pack

from m3_ext.ui import all_components as ext
from m3_ext.ui.fields.simple import ExtStringField


@Pack.register
class FieldsUiAction(DemoAction):
    title = u'Окно с формой и полями'

    def __init__(self):
        super(FieldsUiAction, self).__init__()

    def get_ui(self, request, context):

        win = super(FieldsUiAction, self).get_ui(request, context)

        win.layout = "fit"
        win.width = 600
        win.height = 430

        win.form = ext.ExtForm(padding='5px')

        win.form.items.extend([
            ext.ExtHiddenField(name="hidden", label=u'ExtHiddenField'),
            ext.ExtStringField(name="string", label=u'ExtStringField'),
            ext.ExtTextArea(name="textarea", height=100, label=u'ExtTextArea'),
            ext.ExtNumberField(name="number", label=u'ExtNumberField'),
            ext.ExtCheckBox(name="checkbox", label=u'ExtCheckBox'),
            ext.ExtRadio(name="radio", label=u'ExtRadio'),
            ext.ExtDateField(name="date", label=u'ExtDateField'),
            ext.ExtTimeField(name="time", label=u'ExtTimeField'),
            ext.ExtDateTimeField(name="datetime", label=u'ExtDateTimeField'),
            ext.ExtDisplayField(name="displayfield", label=u'ExtDisplayField'),
            ext.ExtAdvTimeField(name="avdtime", label=u'ExtAdvTimeField'),

        ])

        win.items.append(win.form)

        return win


@Pack.register
class FieldsAction(DemoAction):
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
