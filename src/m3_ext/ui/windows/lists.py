#coding: utf-8
"""
"""

from base import ExtWindow
from m3_ext.ui.panels.grids import ExtObjectGrid


class BaseExtListWindow(ExtWindow):
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
