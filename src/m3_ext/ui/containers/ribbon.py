#coding:utf-8

from base import BaseExtPanel, BaseExtContainer
from m3.helpers.datastructures import TypedList

# Данный набор контролов не используется

#===============================================================================
class ExtElementGroup(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtElementGroup, self).__init__(*args, **kwargs)
        self.title = ''
        self.topTitle = False
        self.onTitleClick = None
        self.init_component(*args, **kwargs)

    @property
    def items(self):
        return self._items
            
    def render_base_config(self):
        super(ExtElementGroup, self).render_base_config()
        self._put_config_value('title', self.title)
        self._put_config_value('onTitleClick', self.onTitleClick)
        self._put_config_value('topTitle', self.topTitle)
        self._put_config_value('items', self.t_render_items, self.items)
        
    def render(self):
        self.pre_render()
        
        try:
            self.render_base_config()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg) 
        
        base_config = self._get_config_str()
        res =  '{%(base_config)s}' % {'base_config': base_config}
                            
        return '%s' % res if not self._is_function_render else res

#===============================================================================
class ExtRibbonTab(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtRibbonTab, self).__init__(*args, **kwargs)
        self.title = ''
        self.init_component(*args, **kwargs)
        
    def add_group(self, **kwargs):
        panel = ExtElementGroup(**kwargs)
        self._items.append(panel)
        return panel
    
    @property
    def items(self):
        return self._items
    
    def render_base_config(self):
        super(ExtRibbonTab, self).render_base_config()
        self._put_config_value('title', self.title)
        self._put_config_value('ribbon', self.t_render_items, self.items)
    
    def render(self):
        self.pre_render()
        
        try:
            self.render_base_config()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg) 
        
        base_config = self._get_config_str()
        res =  '{%(base_config)s}' % {'base_config': base_config}
                            
        return '%s' % res if not self._is_function_render else res
        
#===============================================================================
class ExtRibbon(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtRibbon, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.ux.Ribbon'
        self.enable_tab_scroll = True
        self.activeTab = 0
        self._items = TypedList(type=ExtRibbonTab)
        self.init_component(*args, **kwargs)
    
    def add_tab(self, **kwargs):
        panel = ExtRibbonTab(**kwargs)
        self.tabs.append(panel)
        return panel

    @property
    def tabs(self):
        return self._items

    @property
    def items(self):
        return self._items

    def render_base_config(self):
        super(ExtRibbon, self).render_base_config()
        self._put_config_value('activeTab', self.activeTab)
        self._put_config_value('items', self.t_render_items, self.items)
#        self._put_config_value('layoutConfig', 
#                                      self.t_render_layout_config,
#                                      self.layout)
#        self._put_config_value('layout', self.layout)
        
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