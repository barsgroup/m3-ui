#coding: utf-8
from m3.ui.ext.containers.forms import ExtPanel

__author__ = 'daniil-ganiev'

class ExtCodeEditor(ExtPanel):
    '''
    Редактор кода в браузере
    '''

    def __init__(self, *args, **kwargs):
        super(ExtCodeEditor, self).__init__(*args, **kwargs)
        
        # Исходный код  
        self.source_code = '#Put some code here'
        
        # Признак: только чтение
        self.read_only = False

        # Определяет как редактор будет разбирать исходный код
        self.parser = ''

        self.init_component(*args, **kwargs)

    def render_params(self):
        super(ExtCodeEditor, self).render_params()
        self._put_config_value('sourceCode', self.source_code)
        self._put_config_value('readOnly', self.read_only)
        self._put_config_value('parser', self.parser)

    def render(self):
        self.render_base_config()
        self.render_params()
        base_config = self._get_config_str()
        return 'new Ext.m3.CodeEditor({%s})' % base_config