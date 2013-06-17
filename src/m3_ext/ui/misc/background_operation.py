#coding:utf-8
__author__ = 'ZIgi'

from uuid import uuid4

from m3.ui.ext.base import BaseExtComponent,ExtUIComponent
from m3.ui.ext.misc.progress_bar import ExtProgressBar

class BackgroundOperationBar(ExtProgressBar):
    '''
    Прогресс бар с привязаной к нему серверной фоновой операцией.

    self.foo_bar = BackgroundOperationBar(url = urls.get_action_url('some_async_action'), interval = 5000)

    На клиенте управляется функциями start(), stop() и ping()
    '''
    def __init__(self, *args, **kwargs):
        super(BackgroundOperationBar, self).__init__()

        self._ext_name = 'Ext.m3.BackgroundOperationBar'

        #промежуток опроса сервера в мс. По умолчанию 5000
        self.interval = None

        #адрес экшена
        self.url = ''

        self.boundary = ''
        
        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(BackgroundOperationBar, self).render_base_config()
        self._put_config_value('interval', self.interval)
        self._put_config_value('url', self.url)
        self._put_config_value('boundary', self.boundary or str(uuid4())[0:8])
