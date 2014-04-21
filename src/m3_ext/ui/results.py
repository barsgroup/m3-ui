# -*- coding: utf-8 -*-
"""
Результаты выполнения Action`s
"""
from django.conf import settings
from django import http
from django.utils.html import escapejs

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
            fields = obj.fields
            if obj.display_field not in obj.fields:
                fields = [obj.display_field] + obj.fields

            obj.store.setdefault('fields', fields)

            if hasattr(obj, 'pack') and obj.pack:
                assert isinstance(obj.pack, basestring) or hasattr(obj.pack, '__bases__'), (
                    'Argument %s must be a basestring or class' % obj.pack)
                pack = ControllerCache.find_pack(obj.pack)
                assert pack, 'Pack %s not found in ControllerCache' % pack

                get_url = getattr(pack, 'get_multi_select_url', None) or getattr(pack, 'get_select_url')

                obj.setdefault('url', get_url())  # url формы выбора
                obj.setdefault('edit_url', pack.get_edit_url())  # url формы редактирования элемента
                obj.setdefault('autocomplete_url', pack.get_autocomplete_url())  # url автокомплита и данных

        # Для гридов
        elif hasattr(obj, 'columns') and hasattr(obj, 'store'):
            fields = [obj.store.id_property] + [col.data_index for col in obj.columns]
            obj.store.setdefault('fields', fields)

            # для ObjectGrid и ExtMultiGroupinGrid надо проставлять url из экшенов
            if hasattr(obj, 'GridTopBar') or hasattr(obj, 'LiveGridTopBar'):

                def _set_url(_obj, url, action):
                    # url имеют приоритет над action
                    if not getattr(_obj, url, None) and getattr(_obj, action):
                        setattr(_obj, url, urls.get_url(getattr(_obj, action)))

                _set_url(obj, 'url_new', 'action_new')
                _set_url(obj, 'url_edit', 'action_edit')
                _set_url(obj, 'url_delete', 'action_delete')
                _set_url(obj, 'url_data', 'action_data')

                if hasattr(obj, 'LiveGridTopBar'):
                    _set_url(obj, 'url_export', 'action_export')

                elif hasattr(obj, 'GridTopBar'):
                    # Если store не экземпляр ExtJsonStore,
                    # то у него нет атрибута limit
                    if hasattr(obj.store, 'limit'):
                        obj.store.limit = obj.limit

                    # Настройка постраничного просмотра
                    if obj.allow_paging:
                        obj.paging_bar.page_size = obj.limit
                        obj.bottom_bar = obj.paging_bar

                # store надо обязательно проставить url
                if obj.url_data:
                    obj.store.url = obj.url_data

        # для контролов, которые еще используют extra
        elif hasattr(obj, 'extra') and isinstance(obj.extra, dict):
            obj._config.update(obj.extra)

        # Поля
        if hasattr(obj, 'invalid_class'):
            if getattr(obj, 'read_only', None):
                grey_cls = 'm3-grey-field'
                if getattr(obj, 'cls', None):
                    obj.cls += ' %s' % grey_cls
                obj.cls = grey_cls

            if hasattr(obj, 'regex'):
                obj.regex = '/%s/' % obj.regex

            if getattr(obj, 'max_length', None):
                obj.auto_create.update({"maxlength": obj.max_length})

            if hasattr(obj, 'mask_re'):
                obj.mask_re = '/%s/' % obj.mask_re

            if hasattr(obj, 'value'):
                obj.value = escapejs(obj.value)

        if hasattr(obj, 'help_topic'):
            obj.help_topic = settings.HELP_PREFIX + obj.help_topic[0] + '.html' + (
                '#' + obj.help_topic[1] if len(obj.help_topic) > 1 else '')

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
