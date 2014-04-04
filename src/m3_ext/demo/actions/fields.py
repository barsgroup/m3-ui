#coding: utf-8


from base import Pack, UIAction
from m3_ext.ui import all_components as ext


@Pack.register
class FieldsUiAction(UIAction):

    title = u'Окно с формой и полями'

    def __init__(self):
        super(FieldsUiAction, self).__init__()

    def get_js(self, request, context):
        return """
            function(w, d) {
                var fieldList = [%s], field;

                for (var f=0; f < fieldList.length; f++) {
                    field = w.find('itemId', fieldList[f])[0];

                    if (field) {
                        field.on('change', function() {
                            alert('field ' + this.name + ' change!');
                        });
                    }
                }
                return;
            }
        """ % (",".join([
        "\'" + f + "\'"
        for f in [
            'text_field',
            'textarea_field',
            'number_field',
            'checkbox_field',
            'radiobutton_field',
            'date_field',
            'time_field',
            'datetime_field',
            'advtime_field',
            'display_field'
        ]]))

    def get_ui(self, request, context):

        win = super(FieldsUiAction, self).get_ui(request, context)
        _fields = []

        to_fields = lambda x: (x, _fields.append(x))[0]

        win.layout = "fit"
        win.width = 600
        win.height = 430

        win.form = to_fields(ext.ExtForm())

        win.hidden_field = to_fields(ext.ExtHiddenField(
            name="hidden"
        ))

        win.text_field = to_fields(ext.ExtStringField(
            name="string"
        ))

        win.textarea_field = to_fields(ext.ExtTextArea(
            name="textarea",
            height=100
        ))

        win.number_field = to_fields(ext.ExtNumberField(
            name="number"
        ))

        #кривое отображение
        win.checkbox_field = to_fields(ext.ExtCheckBox(
            name="checkbox"
        ))

        win.radiobutton_field = to_fields(ext.ExtRadio(
            name="radio"
        ))

        win.date_field = to_fields(ext.ExtDateField(
            name="date"
        ))

        win.time_field = to_fields(ext.ExtTimeField(
            name="time"
        ))

        #TODO - закончить
        win.datetime_field = to_fields(ext.ExtDateTimeField(
            name="datetime"
        ))

        win.display_field = to_fields(ext.ExtDisplayField(
            name="displayfield"
        ))

        win.advtime_field = to_fields(ext.ExtAdvTimeField(
            name="avdtime"
        ))

        #общие аттрибуты для всех филдов
        general_attributes = [
            ('anchor'   , '100%'),
            ('label'    , lambda x: x.__class__.__name__)
        ]

        for f in _fields[1:]:
            for attr, value in general_attributes:
                if callable(value):
                    value = value(f)

                setattr(f, attr, value)

        win.form.items.extend(_fields[1:])
        win.items.append(win.form)

        return win

