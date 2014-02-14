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
    def __init__(self, *args, **kwargs):
        super(BaseExtControl, self).__init__(*args, **kwargs)

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        # TODO: Нахера тут переопределение, если в базовом классе тоже самое?
        # Описание в базовом классе ExtUiComponent.
        raise NotImplementedError()
