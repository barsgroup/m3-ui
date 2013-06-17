#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from base import BaseExtControl
from m3.ui.ext.misc import ExtConnection

#===============================================================================
class ExtButton(BaseExtControl):
    '''
    Кнопка
    '''
    def __init__(self, *args, **kwargs):
        super(ExtButton, self).__init__(self, *args, **kwargs)
        self.template = 'ext-controls/ext-button.js' # TODO: отрефакторить под внутриклассовый рендеринг
        
        # Текст на кнопке
        self.text = None
        
        # Обработчик
        self.handler = None
        
        # Путь до иконки
        self.icon = None
        
        # CSS класс для иконки
        self.icon_cls = None
        
        # Заголовок всплывающей подсказки
        self.tooltip_title = None
        
        # Текст всплывающей подсказки
        self.tooltip_text = None
        
        # Ссылка на меню
        self.menu = None
        
        # Индекс обхода кнопки
        self.tab_index = None
        
        #
        self.margins = None
        
        # Признак того, что при нажатии кнопка визуально будет нажата до следующего нажатия
        self.enable_toggle = False
        
        # Группы кнопок, учавствующие в визуальном нажатии
        self.toggle_group = None
        
        # Если False, то не позваляет нажимать на кнопку, если она продавлена
        # аткуально, если enable_toggle = True
        self.allow_depress = False
        
        # Кнопка будет нажата, если enable_toggle = True
        self.pressed = False
        
        self.init_component(*args, **kwargs)
    
    def t_render_handler(self):
        if isinstance(self.handler, ExtConnection):
            return 'function(){%s}'% self.handler.render()
        else:
            return self.handler
        
    def t_render_tooltip(self):
        res = ''
        if self.tooltip_text:
            res += 'text: "%s"' % self.tooltip_text 
        if self.tooltip_title:
            res += ',title: "%s"' % self.tooltip_title 
        return '{%s}' % res

    def render_base_config(self):
        super(ExtButton, self).render_base_config()
        self._put_config_value('text', self.text)
        self._put_config_value('icon', self.icon)
        self._put_config_value('iconCls', self.icon_cls)
        self._put_config_value('region', self.region)
        self._put_config_value('flex', self.flex)
        self._put_config_value('tooltip', self.t_render_tooltip, 
                                                self.tooltip_text)
        
        self._put_config_value('enableToggle', self.enable_toggle)
        self._put_config_value('toggleGroup', self.toggle_group)
        self._put_config_value('allowDepress', self.allow_depress)

        self._put_config_value('tabIndex', self.tab_index)
        self._put_config_value('handler', self.t_render_handler, self.handler)
        if self.menu:
            self._put_config_value('menu', self.menu.render)
        if self.margins:
            self._put_config_value('margins', self.margins)

    def render(self):
        self._ext_name = 'Ext.SplitButton' if self.menu and self.handler else 'Ext.Button'
        return super(ExtButton, self).render()
    
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, *args, **kwargs)
        # Выключаем\включаем компоненты.
        self.disabled = access_off