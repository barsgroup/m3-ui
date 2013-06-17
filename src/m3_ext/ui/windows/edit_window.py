#coding:utf-8
'''
Created on 02.03.2010

@author: akvarats
'''

from base import BaseExtWindow
from m3.ui.ext.containers import ExtForm
from django.template import TemplateSyntaxError

#===============================================================================
class ExtEditWindow(BaseExtWindow):
    def __init__(self, *args, **kwargs):
        super(ExtEditWindow, self).__init__(*args, **kwargs)
        self.__form = None
        self.data_url = None # адрес для загрузки данных формы
        self._ext_name = 'Ext.m3.EditWindow'
        self.renderer.template = 'ext-script/ext-editwindowscript.js' 
        self.init_component(*args, **kwargs)
   
    
    #===========================================================================
    # Врапперы над событиями listeners[...]
    #===========================================================================
    @property
    def handler_beforesubmit(self):
        return self._listeners.get('beforesubmit')
    
    @handler_beforesubmit.setter
    def handler_beforesubmit(self, function):
        self._listeners['beforesubmit'] = function

    @property
    def form(self):
        return self.__form
 
    @form.setter
    def form(self, value):
        # self.items = [value,] -- Если с этим окном используется всегда форма, 
        # то небходимо вставить эту строку
        self.items.append(value)
        self.__form = value
        self.__form_qname = 'form' # для формирования более коротких qnames для контролов

    def render_params(self):
        super(ExtEditWindow, self).render_params()
        if self.form:
#            assert isinstance(self.form, ExtForm), \
#                'Form "%s" is not form type' % self.form.__class__.__name__
            if isinstance(self.form, ExtForm):
                self._put_params_value('form', {'id':self.form.client_id,
                                              'url':self.form.url})
        self._put_params_value('dataUrl', self.data_url)

    # Данный код должен находится в базовом классе, но т.к. не вcе шаблоны 
    # переведены на новый рендеринг, остается пока в каждом 
    def render(self):
        assert getattr(self, '_ext_name'), \
            'Class %s is not define "_ext_name"' % (self.__class__.__name__,)
        
        self.pre_render()
        
        try:
            self.render_base_config()
            self.render_params()
        except TemplateSyntaxError as msg:
            raise Exception(msg) 
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        res =  '%(ext_name)s({%(base_config)s},{%(params)s})' \
                            % {'ext_name': self._ext_name,
                            'base_config': base_config,
                            'params': params }
                            
        return 'new %s' % res if not self._is_function_render else res
    
    def nested_components(self):
        '''
        Метод сбора вложенных компонентов
        '''
        nested = super(ExtEditWindow, self).nested_components()
        nested.insert(0, self.form) # форма для этих вложенных компонентов важнее
        return nested
        