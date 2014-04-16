# -*- coding: utf-8 -*-
"""
Результаты выполнения Action`s
"""
from django import http

from m3 import M3JSONEncoder as _M3JSONEncoder
from m3.actions import (
    ActionResult as _ActionResult,
    BaseContextedResult as _BaseContextedResult,
    ControllerCache,
    urls)

from m3.actions.results import PreJsonResult as _PreJsonResult

import helpers as _helpers


class UIJsonEncoder(_M3JSONEncoder):
    """
    JSONEncoder, совместимый с клиентским рендерингом
    """
    def default(self, obj):
        cfg = getattr(self.make_compatible(obj), '_config')
        if cfg is not None:
            return cfg
        return super(UIJsonEncoder, self).default(obj)

    @staticmethod
    def make_compatible(obj):
        class_name = obj.__class__.__name__

        # ExtContainerTable - это хелпер-класс
        # Для получения extjs-конфига нужно вызвать метод create
        if class_name == 'ExtContainerTable':
            return obj.create()

        # Проверяются наследники класса BaseExtTriggerField
        # и из fields проставляются fields в store
        elif hasattr(obj, 'store') and hasattr(obj, 'fields'):
            obj.store.setdefault('fields', obj.fields)

            if hasattr(obj, 'pack') and obj.pack:

                assert isinstance(obj.pack, basestring) or hasattr(obj.pack, '__bases__'), (
                    'Argument %s must be a basestring or class' % obj.pack)
                pack = ControllerCache.find_pack(obj.pack)
                assert pack, 'Pack %s not found in ControllerCache' % pack

                get_url = getattr(pack, 'get_multi_select_url', None) or getattr(pack, 'get_select_url')

                obj.setdefault('url', get_url())  # url формы выбора
                obj.setdefault('edit_url', pack.get_edit_url())  # url формы редактирования элемента
                obj.setdefault('autocomplete_url', pack.get_autocomplete_url())  # url автокомплита и данных

        elif hasattr(obj, 'columns') and hasattr(obj, 'store'):
            fields = [obj.store.id_property] + [col.data_index for col in obj.columns]
            obj.store.setdefault('fields', fields)

        # для ObjectGrid надо проставлять url из экшенов
        if class_name == 'ExtObjectGrid':
            # Адреса имеют приоритет над экшенами!
            if (not hasattr(obj, 'url_new') or not obj.url_new) and obj.action_new:
                obj.url_new = urls.get_url(obj.action_new)
            if (not hasattr(obj, 'url_edit') or not obj.url_edit) and obj.action_edit:
                obj.url_edit = urls.get_url(obj.action_edit)
            if (not hasattr(obj, 'url_delete') or not obj.url_delete) and obj.action_delete:
                obj.url_delete = urls.get_url(obj.action_delete)
            if (not hasattr(obj, 'url_data') or not obj.url_data) and obj.action_data:
                obj.url_data = urls.get_url(obj.action_data)

        return obj


class UIResult(_PreJsonResult):
    """
    Результат, совместимый с клиентским рендерингом
    """
    def __init__(self, data, *args, **kwargs):
        super(UIResult, self).__init__({
            'success': True,
            'code': data
        })
        self.encoder_clz = UIJsonEncoder


class ExtUIScriptResult(_BaseContextedResult):
    """
    По аналогии с ExtUiComponentResult,
    представляет собой некоторого наследника класса ExtUiComponent.
    Единственное отличие заключается в том,
    что get_http_response должен сформировать
    готовый к отправке javascript.
    .. note::
        Т.е. должен быть вызван метод self.data.get_script()
    """
    def __init__(
            self, data=None, context=None,
            http_params=None, secret_values=False):
        super(ExtUIScriptResult, self).__init__(data, context, http_params)
        self.secret_values = secret_values

    def get_http_response(self):
        self.data.action_context = self.context
        response = http.HttpResponse(self.data.get_script())

        response = self.process_http_params(response)

        if self.secret_values:
            response['secret_values'] = True
        return response


class ExtUIComponentResult(_BaseContextedResult):
    """
    Результат выполнения операции,
    описанный в виде отдельного компонента пользовательского интерфейса.
    В self.data хранится некоторый наследник класса m3_ext_demo.ui.ExtUiComponent.
    Метод get_http_response выполняет метод render у объекта в self.data.
    """
    def get_http_response(self):
        self.data.action_context = self.context
        return http.HttpResponse(self.data.render())


class ExtGridDataQueryResult(_ActionResult):
    """
    Результат выполнения операции,
    который выдает данные в формате, пригодном для
    отображения в гриде
    """
    def __init__(self, data=None, start=-1, limit=-1):
        super(ExtGridDataQueryResult, self).__init__(data)
        self.start = start
        self.limit = limit

    def get_http_response(self):
        return http.HttpResponse(
            _helpers.paginated_json_data(
                self.data, self.start, self.limit))
