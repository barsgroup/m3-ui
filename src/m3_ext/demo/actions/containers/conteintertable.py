#coding: utf-8

from m3.actions.urls import get_url
from m3_ext.demo.actions.base import DemoAction, Pack
from m3_ext.demo.actions.grids.grid import DataAction
from m3_ext.ui import all_components as ext

@Pack.register
class ContainerTableAction(DemoAction):
    """
    Пример ContainerTable
    """
    title = u'ContainerTable'

    def get_ui(self, request, context):
        window = ext.ExtWindow(title=u'Окно табличная форма', layout='fit', width=700)

        form = ext.ExtForm(layout='fit', url=get_url(DataAction))
        form.label_width = 60

        search1 = ext.ExtStringField(label=u'Привет1', empty_text=u'Поиск', style={'margin-left': '50px'})
        search2 = ext.ExtStringField(label=u'Привет2', empty_text=u'Еще поиск')
        search3 = ext.ExtStringField(label=u'Привет3', empty_text=u'+ поиск')
        search4 = ext.ExtStringField(label=u'Привет4', empty_text=u'И еще раз')
        search5 = ext.ExtStringField(label=u'Привет Привет', empty_text=u'И еще раз')
        search6 = ext.ExtStringField(label=u'Привет4', empty_text=u'И еще раз')

        search7 = ext.ExtStringField(label=u'Привет4', empty_text=u'И еще раз')
        search8 = ext.ExtStringField(label=u'Привет Привет', empty_text=u'И еще раз')
        search9 = ext.ExtStringField(label=u'Привет4', empty_text=u'И еще раз')

        cont = ext.ExtDictSelectField(label=u'Первый участник',
                                  # url='/ui/tree-dict-window',
                                  autocomplete_url=get_url(DataAction),
                                  ask_before_deleting=False,
        )

        cont.display_field = 'lname'
        cont.value_field = 'id'
        cont.auto_load = True

        tform = ext.ExtContainerTable(title=u'Табличная форма', width=100)
        tform.rows_count = 4
        tform.columns_count = 3
        tform.style = dict(padding="10px")

        tform.set_item(0, 0, search1, colspan=2)
        #tform.set_item(0,1, search2)
        tform.set_item(0, 2, search3, colspan=2)
        tform.set_item(1, 0, search4)
        tform.set_item(1, 1, search5)
        tform.set_item(1, 2, search6)

        tform.set_item(2, 0, search7)
        tform.set_item(2, 1, search8)
        tform.set_item(2, 2, search9)

        tform.set_item(3, 0, cont)

        form.items.append(tform)
        window.items.append(form)

        menu = ext.ExtContextMenu()
        menu.add_item(text=u'Просто 1')
        menu.add_item(text=u'Просто 2')
        menu.add_item(text=u'Просто 3')
        menu.add_item(text=u'Просто 4')
        menu.add_item(text=u'Просто 5')
        menu.add_item(text=u'Просто 6')

        button = ext.ExtButton(text=u'Split button')
        button.menu = menu
        window.buttons.append(button)

        button = ext.ExtButton(text=u'Закрыть', handler='close')
        window.buttons.append(button)

        return window
