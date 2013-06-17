#coding:utf-8
'''
Created on 5.3.2010

@author: prefer
'''
from m3.ui.ext.base import ExtUIComponent

# FIXME: для чего наследуется от ExtUIComponent, а не от BaseExtComponent?
class ExtConnection(ExtUIComponent):
    '''
    Объект, генерирующий запрос на сервер
    '''
    def __init__(self, *args, **kwargs):
        super(ExtConnection, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-connection.js' # TODO: Отрефакторить под внутриклассовый рендеринг 
        
        # url для запроса на сервер 
        self.url = ''
        
        # Метод запроса (GET, POST, PUT, DETETE, HEAD)
        self.method = None
        
        # Параметры, которые будут переданы в запросе
        self.parameters = {}
        
        # Ссылка на функцию, которая будет выполнены в случае успешного ответа
        self.function_success = None
        
        # Ссылка на функцию, которая будет выполнены в случае неудачного ответа
        self.function_failure = None
        self.init_component(*args, **kwargs)