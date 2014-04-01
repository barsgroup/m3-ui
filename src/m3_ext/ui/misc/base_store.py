#coding:utf-8
"""
Created on 3.3.2010

@author: prefer
"""

from m3_ext.ui.base import ExtUIComponent


# FIXME: для чего наследуется от ExtUIComponent, а не от BaseExtComponent?
class BaseExtStore(ExtUIComponent):
    """
    Базовый класс для Store - компонента хранения данных
    """
    def __init__(self, *args, **kwargs):
        super(BaseExtStore, self).__init__(*args, **kwargs)

        # Свойства, которые будут посылаться на сервер для каждого запроса
        self._base_params = {}

        # Признак автозагрузки
        self.auto_load = False

        # Признак автосохранения при изменении данных
        self.auto_save = True

        # Ссылка для получения/сохранения данных
        self.url = ''

        # Объект, который отвечает за запись данных
        self.writer = None

    def _set_base_params(self, params):
        self._base_params.update(params)

    def _get_base_params(self):
        return self._base_params

    base_params = property(_get_base_params, _set_base_params)

    @property
    def handler_beforeload(self):
        return self._listeners.get('beforeload')

    @handler_beforeload.setter
    def handler_beforeload(self, function):
        self._listeners['beforeload'] = function
