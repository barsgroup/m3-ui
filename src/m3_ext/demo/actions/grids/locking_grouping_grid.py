# coding: utf-8

import json
from django import http
from django.http import HttpResponse
from m3.actions import Action
from m3.actions.urls import get_url
from m3_ext.demo.actions.base import DemoAction, Pack
from m3_ext.demo.actions.grids.grid import GroupingDataAction
from m3_ext.ui import all_components as ext


@Pack.register
class ExtGridLockingHeaderGroupPluginAction(DemoAction):
    """
    Пример простой таблицы
    """
    title = u'ExtGridLockingHeaderGroupPlugin'

    def get_ui(self, request, context):
        window = ext.ExtWindow(layout='fit',
                               # xtype='m3-locking-header-group',
                               width=1000,
                               height=500)

        grid = ext.ExtGrid(force_fit=False)
        map(lambda i: grid.add_column(data_index=i,
                                      header=str(i),
                                      extra={'summaryType': 'sum'}),
            range(1, 13))

        grid.store = store = ext.ExtGroupingStore(url=get_url(GroupingDataAction),
                                                  auto_load=True)
        # reader = ext.ExtJsonReader(total_property='total', root='rows')
        # reader.set_fields(*grid.columns)

        grid.banded_columns = [
            [ext.ExtGridColumn(header='1.1', colspan=6, align='center'),
             ext.ExtGridColumn(header='1.2', colspan=6, align='center'),
             ext.ExtGridColumn(header='1.1', colspan=6, align='center')],
            [ext.ExtGridColumn(header='2.1', colspan=3, align='center'),
             ext.ExtGridColumn(header='2.2', colspan=3, align='center'),
             ext.ExtGridColumn(header='2.3', colspan=3, align='center'),
             ext.ExtGridColumn(header='2.4', colspan=3, align='center')],
            [ext.ExtGridColumn(header='3.1', colspan=1, align='center'),
             ext.ExtGridColumn(header='3.2', colspan=1, align='center'),
             ext.ExtGridColumn(header='3.3', colspan=1, align='center'),
             ext.ExtGridColumn(header='3.4', colspan=1, align='center'),
             ext.ExtGridColumn(header='3.5', colspan=2, align='center'),
             ext.ExtGridColumn(header='3.6', colspan=2, align='center'),
             ext.ExtGridColumn(header='3.7', colspan=1, align='center'),
             ext.ExtGridColumn(header='3.8', colspan=2, align='center'),
             ext.ExtGridColumn(header='3.9', colspan=1, align='center')
            ]
        ]

        ext.ExtGridLockingHeaderGroupPlugin.configure_grid(
            grid,
            locked_count=2,
            config={
                'hide_group_column': True
            })

        window.items.append(grid)

        return window
