#coding:utf-8
"""
Created on 3.3.2010
"""

from m3_ext.ui.base import BaseExtComponent


class BaseExtStore(BaseExtComponent):
    """
    Базовый класс для Store - компонента хранения данных
    """

    LOCAL = 'local'
    REMOTE = 'remote'

    _xtype = 'store'

    js_attrs = BaseExtComponent.js_attrs.extend(
        'url',  # Ссылка для получения/сохранения данных
        'writer',

        # Данные для reader'a
        'root',
        'fields',

        auto_load='autoLoad',  # Признак автозагрузки
        auto_save='autoSave',  # Признак автосохранения при изменении данных
        base_params='baseParams',  # Свойства, которые будут посылаться на сервер для каждого запроса

        # Данные для reader'a
        id_property='idProperty',
        total_property='totalProperty',
    )

    deprecated_attrs = BaseExtComponent.deprecated_attrs + (
        'handler_beforeload',
    )

    def __init__(self, *args, **kwargs):
        super(BaseExtStore, self).__init__(*args, **kwargs)
        self.setdefault('base_params', {})
        self.setdefault('auto_load', False)
        self.setdefault('auto_save', True)
        self.setdefault('url', '')
        self.setdefault('id_property', 'id')