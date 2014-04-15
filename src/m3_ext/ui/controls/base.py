#coding:utf-8
"""
Created on 27.02.2010

@author: akvarats
"""
from m3_ext.ui.base import ExtUIComponent


class BaseExtControl(ExtUIComponent):
    """
    Базовый класс для кнопочных контролов
    """
    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        raise NotImplementedError()
