# -*- coding: utf-8 -*-
"""
Результаты выполнения Action`s
"""
from django import http

from m3 import M3JSONEncoder as _M3JSONEncoder
from m3.actions import (
    ActionResult as _ActionResult,
    BaseContextedResult as _BaseContextedResult,
)
from m3.actions.results import PreJsonResult as _PreJsonResult

import helpers as _helpers


class UIJsonEncoder(_M3JSONEncoder):
    """
    JSONEncoder, совместимый с клиентским рендерингом
    """
    def default(self, obj):
        cfg = getattr(obj, '_config')
        if cfg is not None:
            return cfg
        return super(UIJsonEncoder, self).default(obj)


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
