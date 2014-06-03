#coding: utf-8
from m3.actions.urls import get_url
from m3_ext.demo.actions.base import DemoAction, Pack

from m3_ext.demo.actions.grids.grid import DataAction
from m3_ext.ui import all_components as ext


@Pack.register
class SearchFieldAction(DemoAction):
    """
    Пример контрола для поиска
    """
    title = u'ExtSearchField'

    def get_ui(self, request, context):
        window = ext.ExtWindow(title=u'Контрол поиска',
                               layout='fit', resizable=False)


        grid = ext.ExtGrid(item_id='grid')
        grid.add_column(header=u'Имя', data_index='fname')
        grid.add_column(header=u'Фамилия', data_index='lname')
        grid.add_column(header=u'Адрес', data_index='adress')
        grid.store = ext.ExtJsonStore(url=get_url(DataAction),
                                        auto_load=True,
                                        total_property='total',
                                        root='rows',
                                        fields = ['id', 'fname', 'lname', 'adress']
                                        )

        window.items.append(grid)

        search = ext.ExtSearchField(component_item_id=grid.item_id,
                                    empty_text=u'Поиск')

        search_other = ext.ExtSearchField(component_item_id=grid.item_id,
                                          empty_text=u'Другой поиск')
        menu = ext.ExtContextMenu(style=dict(overflow='visible'))
        menu.items.append(search_other)

        toolbar = ext.ExtToolBar()
        toolbar.items.append(search)
        toolbar.add_fill()
        toolbar.add_menu(text=u'Поиск', menu=menu)


        grid.top_bar = toolbar

        button = ext.ExtButton(text=u'Закрыть',
                               handler='close')
        window.buttons.append(button)

        return window
