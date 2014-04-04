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
                debugger;
                for (var f=0; f < fieldList.length; f++) {
                    field = w.find('itemId', fieldList[f])[0];
                    field.on('change', function() {
                        alert('field' + field.name + 'change');
                    });
                }
                return;
            }
        """ % (",".join([
        "\'" + f + "\'"
        for f in [
            'text_field',
            'number_field',
            'checkbox_field',
#            'radiobutton_field',
#            'date_field',
            #'time_field',
        ]]))

    def get_ui(self, request, context):

        win = super(FieldsUiAction, self).get_ui(request, context)
        _fields = []

        to_fields = lambda x: (x, _fields.append(x))[0]

        win.layout = "fit"
        win.width = 600
        win.height = 400

        win.form = to_fields(ext.ExtForm())

        win.text_field = to_fields(ext.ExtStringField(
            name="string"
        ))

        win.number_field = to_fields(ext.ExtNumberField(
            name="number"
        ))

        #кривое отображение
        win.checkbox_field = to_fields(ext.ExtCheckBox(
            name="checkbox"
        ))

        #        win.radiobutton_field = to_fields(ext.ExtRadio(
        #            name="radio"
        #        ))

        #        win.date_field = to_fields(ext.ExtDateField(
        #            name="date"
        #        ))

        #        win.time_field = to_fields(ext.ExtTimeField(
        #            name="time"
        #        ))

        # win.combobox_field = to_fields(fields.ExtComboBox())

        #TODO - закончить
        # win.datetime_field = to_fields(fields.ExtDateTimeField())
        # win.display_field = to_fields(fields.ExtDisplayField())
        # win.advtime_field = to_fields(fields.ExtAdvTimeField())

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

