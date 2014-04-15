#coding:utf-8
"""
Created on 02.03.2010

@author: akvarats
"""

from base import BaseExtWindow


class ExtEditWindow(BaseExtWindow):
    """Базовый класс окна редактрирования"""

    _xtype = 'm3-edit-window'

    def __init__(self, *args, **kwargs):
        super(ExtEditWindow, self).__init__(*args, **kwargs)
        self.form = None
