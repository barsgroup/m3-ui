#coding: utf-8
"""
Created on 26.05.2010

@author: akvarats
"""
from base import BaseExtWindow


#==============================================================================
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
        self.grid = {
            'xtype': 'panel',
            'layout': 'fit',
            'region': 'center',
            'items': [{
                'xtype': 'grid',
                'columns': [
                    {'header': u'Первая колонка', 'width': 400, 'data_index': 'first'},
                    {'header': u'Вторая колонка', 'width': 400, 'data_index': 'second'}
                ],
                'layout': 'fit',
                'itemId': 'grid',
                'store': {
                        'xtype': 'jsonstore',
                        'fields': [
                            {'type': 'string', 'name': 'first'},
                            {'type': 'string', 'name': 'second'}
                        ]
                    }
                }]
        }
        self.items.append(self.grid)
