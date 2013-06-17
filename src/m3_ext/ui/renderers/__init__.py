#coding:utf-8
'''
Пакет для классов, отвечающих за отрисовку конечных клиентских javascript'ов
'''
from django.conf import settings
from m3.helpers import js

from m3.ui.ext.base import ExtUIScriptRenderer
from m3.ui.ext import render_template

class ExtWindowRenderer(ExtUIScriptRenderer):
    '''
    Рендерер для скрипта на показ окна
    '''
    def __init__(self):
        self.template = 'ext-script/ext-windowscript.js'
        self.window = None
        
    def get_script(self):
        script = render_template(self.template, {'renderer': self, 'window': self.window})
        if settings.DEBUG:
            script = js.JSNormalizer().normalize(script)
        return script