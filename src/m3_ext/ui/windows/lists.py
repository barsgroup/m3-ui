#coding: utf-8
"""
Created on 26.05.2010

@author: akvarats
"""

from base import BaseExtWindow
from m3_ext.ui.panels.grids import ExtObjectGrid


class BaseExtListWindow(BaseExtWindow):
    """
    Базовое окно со списком записей.
    """

    def __init__(self, *args, **kwargs):
        super(BaseExtListWindow, self).__init__(*args, **kwargs)
        self.setdefault('width', 800)
        self.setdefault('width', 600)
        self.setdefault('maximized', True)
        self.setdefault('layout', 'border')

        self.grid = ExtObjectGrid(region='center')
        self.items.append(self.grid)
