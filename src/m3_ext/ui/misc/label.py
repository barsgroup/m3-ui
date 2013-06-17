#coding:utf-8
'''
Created on 23.3.2010

@author: prefer
'''

from m3.ui.ext.base import ExtUIComponent

#===============================================================================  
class ExtLabel(ExtUIComponent):
    '''
    Произвольный текст
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtLabel, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-label.js' # TODO: Отрефакторить под внутриклассовый рендеринг
        
        # Текст для отображения        
        self.text = None
        
        self.init_component(*args, **kwargs)
        
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        pass