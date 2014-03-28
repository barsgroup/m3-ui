#coding: utf-8
"""
Created on 25.02.2010

@author: akvarats
"""

from m3_ext.ui.base import renderable
from base import BaseExtWindow


class ExtWindow(BaseExtWindow):
    """
    Окно
    """
    __metaclass__ = renderable

    _xtype = 'window'
