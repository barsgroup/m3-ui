#coding:utf-8
"""
Created on 02.03.2010

@author: akvarats
"""

from django.template import TemplateSyntaxError
from m3_ext.ui.containers import ExtForm
from base import BaseExtWindow
from m3_ext.ui.windows.base import ExtWindowRenderer


class ExtEditWindow(BaseExtWindow):
    """Базовый класс окна редактрирования"""

    _xtype = 'm3-window'

    def __init__(self, *args, **kwargs):
        super(ExtEditWindow, self).__init__(*args, **kwargs)
        self.form = None
