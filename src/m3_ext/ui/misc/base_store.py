#coding:utf-8
"""
Created on 3.3.2010

@author: prefer
"""

from m3_ext.ui.base import BaseExtComponent


# FIXME: для чего наследуется от ExtUIComponent, а не от BaseExtComponent?
class BaseExtStore(BaseExtComponent):
    """
    Базовый класс для Store - компонента хранения данных
    """

    _xtype = 'store'

    js_attrs = BaseExtComponent.js_attrs.extend(
        'url',
        auto_load='autoLoad',
        auto_save='autoSave',
        _base_params='baseParams',
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtStore, self).__init__(*args, **kwargs)

        # Свойства, которые будут посылаться на сервер для каждого запроса
        self._base_params = {}

        # Признак автозагрузки
        self.setdefault('auto_load', False)

        # Признак автосохранения при изменении данных
        self.setdefault('auto_save', True)

        # Ссылка для получения/сохранения данных
        self.setdefault('url', '')

        # Объект, который отвечает за запись данных
        #self.setdefault('writer', None)
        #self.setdefault('reader', None)

    # FIXME: интересное поведение у нас раньше было
    # нельзя было удалить параметры, можно только обновить значения
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
