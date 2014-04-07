#coding: utf-8
"""
Created on 26.05.2010

@author: akvarats
"""
from base import BaseExtWindow

from m3_ext.ui.containers.grids import ExtGrid
from m3_ext.ui.misc import ExtJsonStore

class BaseExtListWindow(BaseExtWindow):
    """
    Базовое окно со списком записей.
    """
    _xtype = BaseExtWindow._xtype

    js_attrs = BaseExtWindow.js_attrs.extend(
        'layout', 'width', 'height', 'items', 'maximizable'
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtListWindow, self).__init__(*args, **kwargs)
        self.setdefault('width', 800)
        self.setdefault('width', 600)
        self.setdefault('maximized', True)
        self.setdefault('layout', 'border')

        # FIXME: заменить на полноценный ExtObjectGrid, как только его адаптируют
        grid = ExtGrid(region="center")
        grid.add_column(header=u'Первая колонка', data_index='first', width=400)
        grid.add_column(header=u'Вторая колонка', data_index='second', width=400)
        grid.store = ExtJsonStore(root='rows', total_property='total')

        self.grid = grid
        self.items.append(self.grid)
