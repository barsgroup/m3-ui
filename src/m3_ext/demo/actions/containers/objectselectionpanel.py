# coding: utf-8

from m3.actions.urls import get_url
from m3_ext.demo.actions.base import DemoAction, Pack
from m3_ext.demo.actions.grids.grid import DataAction
from m3_ext.ui import all_components as ext


@Pack.register
class ExtObjectSelectionPanelAction(DemoAction):
    """
    Пример простой таблицы
    """
    title = u'ExtObjectSelectionPanel'

    def get_ui(self, request, context):
        window = ext.ExtWindow(layout="fit", width=600, height=400)

        grid = ext.ExtObjectGrid(region='center')
        grid.url_data = get_url(DataAction)
        grid.add_column(data_index='lname')
        grid.add_column(data_index='fname')
        grid.add_column(data_index='adress')

        tbar = ext.ExtToolBar()
        tbar.add_text_item(u'123')
        tbar.add_separator()
        tbar.add_text_item(u'321')
        tbar.items.append(ext.ExtButton(text='123'))

        container = ext.ExtObjectSelectionPanel(grid=grid,
                                                selection_columns=[
                                                    {'data_index': 'lname', 'header': u'Первая'},
                                                    {'data_index': 'fname', 'header': u'Вторая'}],
                                                selection_grid_conf={'width': 300,
                                                                     #'tbar': tbar,
                                                                     'split': True}
        )

        window.items.append(container)

        return window
