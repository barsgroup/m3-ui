#coding:utf-8
'''
Created on 26.11.2010

@author: airat
'''

from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.containers.grids import ExtGridColumn

class ExtDataView(ExtUIComponent):
    '''
    Компонента для отображения данных в специально заданном пользовательском 
    шаблон. Для описания шаблона обычно используется html.
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtDataView, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.DataView'
        
        # шаблон, при помощи которого будут отображаться данные
        self.tpl = None
        
        # css-селектор узла(атома) DataView 
        self.item_selector = None
        
        # multi_select сильнее чем single_select(если оба равны True)
        
        # Позволяет выбирать только один элемент        
        self.single_select = True
        
        # Позволяет выбирать несколько элементов 
        self.multi_select = True
        
        # колонки стора
        self.columns = []
        
        # css-класс, который будет применяться для выделенных элементов
        self.selected_class = None
        
        # css-класс используемый при наведении мышки
        self.over_class = None
        
        # стор, из которого будут дергаться данные
        self.__store = None
        self.init_component(*args, **kwargs)
        
    def set_store(self, store):
        self.__store = store
        
    def t_render_store(self):
        assert self.__store, 'Store is not define'
        return self.__store.render([column.data_index for column in self.columns])
    
    def add_column(self, **kwargs):
        self.columns.append(ExtGridColumn(**kwargs))

    def render_base_config(self):
        super(ExtDataView, self).render_base_config()
        
        assert self.tpl, 'tpl is not define'
        assert self.item_selector, 'item_selector is not define'
        
        self._put_config_value('tpl', self.tpl)    
        self._put_config_value('itemSelector', self.item_selector)    
        self._put_config_value('singleSelect', self.single_select)    
        self._put_config_value('multiSelect', self.multi_select)    
        self._put_config_value('selectedClass', self.selected_class)    
        self._put_config_value('overClass', self.over_class)    
        self._put_config_value('store', self.t_render_store, self.__store)   


    # Данный код должен находится в базовом классе, но т.к. не вcе шаблоны 
    # переведены на новый рендеринг, остается пока в каждом 
    def render(self):
        assert getattr(self, '_ext_name'), \
            'Class %s is not define "_ext_name"' % self.__class__.__name__
        
        self.pre_render()
        
        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg) 
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        res =  '%(ext_name)s({%(base_config)s},{%(params)s})' \
                            % {'ext_name': self._ext_name,
                            'base_config': base_config,
                            'params': params }
                            
        return 'new %s' % res if not self._is_function_render else res