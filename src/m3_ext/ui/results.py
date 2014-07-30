# -*- coding: utf-8 -*-
"""
Результаты выполнения Action`s
"""
import datetime
from django import http
from django.utils.html import escapejs

from m3 import M3JSONEncoder as _M3JSONEncoder
from m3.actions import (
    ActionResult as _ActionResult,
    ControllerCache,
    urls)

from m3.actions.results import PreJsonResult as _PreJsonResult
from m3.actions.context import ActionContext as _ActionContext

from helpers import paginated_json_data as _paginated_json_data


def _set_action_url(obj, url, action):
    """
    Проставляет в объект url если его нет и он есть в соответсвующем экшене
    """
    if getattr(obj, action, None) and not getattr(obj, url, None):
        setattr(obj, url, urls.get_url(getattr(obj, action)))


class UIJsonEncoder(_M3JSONEncoder):
    """
    JSONEncoder, совместимый с клиентским рендерингом
    """

    def default(self, obj):
        if isinstance(obj, _ActionContext):
            return dict(
                kv for kv in obj.__dict__.iteritems()
                if not kv[0].startswith('_')
            )
        cfg = getattr(self.make_compatible(obj), '_config', None)
        if cfg is not None:
            return cfg
        return super(UIJsonEncoder, self).default(obj)

    @staticmethod
    def make_compatible(obj):
        # TODO: obj.setdefault - нельзя использовать
        # так как будет перекрыто первоначальное значение

        class_name = obj.__class__.__name__

        # ExtContainerTable - это хелпер-класс
        # Для получения extjs-конфига нужно вызвать метод create
        if class_name == 'ExtContainerTable':
            return obj.create()

        # Проверяются наследники класса BaseExtTriggerField
        # и из fields проставляются fields в store
        elif hasattr(obj, 'store') and hasattr(obj, 'fields'):

            if not getattr(obj.store, 'fields', None):
                fields = obj.fields
                if obj.display_field not in obj.fields:
                    fields = [obj.store.id_property, obj.display_field] + obj.fields
                obj.store.fields = fields

            if hasattr(obj, 'pack') and obj.pack:
                assert isinstance(obj.pack, basestring) or hasattr(obj.pack, '__bases__'), (
                    'Argument %s must be a basestring or class' % obj.pack)
                pack = ControllerCache.find_pack(obj.pack)
                assert pack, 'Pack %s not found in ControllerCache' % pack

                get_url = getattr(pack, 'get_multi_select_url', None) or getattr(pack, 'get_select_url')

                # url формы выбора
                if not getattr(obj, 'url', None):
                    obj.url = get_url()

                # url формы редактирования элемента
                if not getattr(obj, 'edit_url', None):
                    obj.edit_url = pack.get_edit_url()

                # url автокомплита и данных
                if not getattr(obj, 'autocomplete_url', None):
                    obj.autocomplete_url = pack.get_autocomplete_url()

        # Для гридов
        elif hasattr(obj, 'columns') and hasattr(obj, 'store'):

            if not getattr(obj.store, 'fields', None):
                fields = [obj.store.id_property] + [col.data_index for col in obj.columns
                                                    if hasattr(col, 'data_index')]
                obj.store.fields = fields

            # для ObjectGrid и ExtMultiGroupinGrid надо проставлять url из экшенов
            if hasattr(obj, 'GridTopBar') or hasattr(obj, 'LiveGridTopBar'):

                _set_action_url(obj, 'url_new', 'action_new')
                _set_action_url(obj, 'url_edit', 'action_edit')
                _set_action_url(obj, 'url_delete', 'action_delete')
                _set_action_url(obj, 'url_data', 'action_data')
                _set_action_url(obj, 'url_export', 'action_export')

                if hasattr(obj, 'GridTopBar'):

                    # Настройка постраничного просмотра
                    if obj.allow_paging:
                        obj.paging_bar.page_size = obj.limit
                        obj.bottom_bar = obj.paging_bar

                        if hasattr(obj.store, 'limit'):
                            obj.store.limit = obj.limit

                # store надо обязательно проставить url
                if hasattr(obj, 'url_data'):
                    obj.store.url = getattr(obj, 'url_data')

        # Для контролов, которые еще используют extra
        elif hasattr(obj, 'extra') and isinstance(obj.extra, dict):
            obj._config.update(obj.extra)

        # Для object-tree
        elif hasattr(obj, 'columns') and hasattr(obj, 'row_id_name'):
            _set_action_url(obj, 'url_new', 'action_new')
            _set_action_url(obj, 'url_edit', 'action_edit')
            _set_action_url(obj, 'url_delete', 'action_delete')
            _set_action_url(obj, 'url', 'action_data')

        # для BaseExtTriggerField, нужно поменять режим если указан DataStore
        if hasattr(obj, 'store') and hasattr(obj, 'hide_trigger') \
                and obj.store and obj.store._xtype == 'arraystore':
            obj.mode = 'local'

        # Поля
        if hasattr(obj, 'invalid_class'):
            if getattr(obj, 'read_only', None):
                grey_cls = 'm3-grey-field'
                if getattr(obj, 'cls', None):
                    obj.cls += ' %s' % grey_cls
                obj.cls = grey_cls

            if hasattr(obj, 'regex'):
                obj.regex = '/%s/' % obj.regex

            if hasattr(obj, 'value'):
                # значения типа date и datetime не надо эскейпить
                if not isinstance(obj.value, datetime.date):
                    obj.value = escapejs(obj.value)

        # адресный компонент
        if class_name == 'ExtAddrComponent':
            kladr_pack = urls.get_pack_instance('KLADRPack')
            if kladr_pack:
                obj.get_addr_url = kladr_pack.get_addr_action.absolute_url() if kladr_pack.get_addr_action else ''
                obj.kladr_url = kladr_pack.get_places_action.absolute_url() if kladr_pack.get_places_action else ''
                obj.street_url = kladr_pack.get_streets_action.absolute_url() if kladr_pack.get_streets_action else ''

        return obj


class UIResult(_PreJsonResult):
    """
    Результат, возвращающий виджет в виде конфигурации и данных
    """

    def __init__(self, ui):
        """
        :ui object: либо dict с config+data, либо ExtComponent
        """
        if isinstance(ui, dict):
            assert set(ui.keys()) == set(('config', 'data'))
            code = ui
        else:
            code = {
                'config': ui._config,
                'data': ui._data,
            }
        super(UIResult, self).__init__({
            'success': True,
            'code': code
        })
        self.encoder_clz = UIJsonEncoder


class DataResult(_PreJsonResult):
    """
    Результат запроса, возвращающий объект данных
    и доп.настройки для виджета лтображения
    """

    def __init__(self, model, ui, context=None, data=None):
        """
        :model object: объект данных
        :ui string: ключ, идентифицирующий виджет для отображения
        :context object: объект контекста выполнения запроса
        :data dict: доп.данные для инициализации виджета
        """
        data = data or {}
        data['model'] = model
        data['context'] = context or {}
        super(DataResult, self).__init__({
            'success': True,
            'code': {
                'data': data,
                'ui': ui,
            }
        })


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
            _paginated_json_data(
                self.data, self.start, self.limit))
