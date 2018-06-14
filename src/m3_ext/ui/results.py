# coding: utf-8
"""
Результаты выполнения Action`s
"""
from __future__ import absolute_import

import json

from django import http
from m3.actions import ActionResult as _ActionResult
from m3.actions import BaseContextedResult as _BaseContextedResult
from m3.actions import OperationResult as _OperationResult
from m3_django_compat import get_request_params

from . import helpers as _helpers
from .windows.window import BaseConfirmWindow


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


class ConfirmWindowResult(_OperationResult):
    """Результат, содержащий запрос на подтверждение выполнения действия.

    Позволяет возвращать результат, который отобразит окно подтверждения
    выполнения действия с последующим выполнением этого действия.

    :param basestring text: Текст сообщения
    :param basestring url: callback url
    :param dict params: словарь дополнительных параметров для передачи
                        в HTTP запросе
    :param bool prevent_escape: не экранировать спец. символы в text
    :param window_id: id родительского окна
    :param request: объект HTTP запроса, для копирования его параметров
    :type request: django.http.HttpRequest
    """

    #: Класс окна, которое увидит пользователь при возврате ConfirmWindowResult
    window_cls = BaseConfirmWindow

    def __init__(
            self, text=None, url=None, params=None, request=None,
            prevent_escape=False, window_id='', *args, **kwargs):
        super(ConfirmWindowResult, self).__init__(*args, **kwargs)

        params = params or {}
        if request:
            params.update(get_request_params(request))

        window = self.window_cls()

        window.set_params(
            text=text, url=url, params=json.dumps(params),
            prevent_escape=prevent_escape,
            m3_window_id=window_id,
        )

        self.code = window.get_script()
