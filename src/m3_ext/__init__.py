# -*- coding: utf-8 -*-
"""
Пакет, упрощающий генерацию Browser-UI на основе ExtJS
с помошью python-кода
"""
from m3.actions import Action as _Action, DeclarativeActionContext as _DAC
from m3.actions.results import OperationResult as _OperationResult
from m3_ext.ui import all_components as ext
from m3_ext.ui.results import UIResult, DataResult

from views import workspace, desktop_items


class UIAction(_Action):

    suffixes = ('ui',)

    def build_context(self, request, suffix=None):
        if suffix == 'ui':
            return _DAC()
        else:
            return super(UIAction, self).build_context(request, suffix)

    def get_ui(self, request, context):
        """
        Метод должен вернуть либо экземпляр ExtUIComponent,
        либо словарь вида {
            "config" :: dict - базовый конфиг окна
            "data"   :: dict - базовые данные для инициализации окна
        }
        """
        return ext.ExtWindow(title=self.title, width=200, height=200)

    def get_result(self, request, context):
        """
        Метод должен вернуть словарь вида {
            "ui":     :: str  - url для получения базового конфига окна
            "model"   :: dict - объект данных
            "data":   :: dict - данные для конкретного окна
        }
        """
        return {
            'ui': self.get_absolute_url() + ":ui",
            'data': {}
        }

    def run(self, request, context, suffix=None):
        if suffix == 'ui':
            result = UIResult(self.get_ui(request, context))
        else:
            kwargs = self.get_result(request, context)
            kwargs.setdefault('model', {})
            kwargs.setdefault('context', context)
            result = DataResult(**kwargs)
        return result


class FrozenDict(dict):
    """
    Словарь, допускающий изменение только через копирование
    """
    def __setitem__(self, *args):
        raise TypeError("Frozen dict can not be updated!")
    __pop__ = __popitem__ = __setitem__

    def extend(self, *kwargs):
        """
        Возвращает собственную копию, дополненную аргументами
        """
        res = self.copy()
        for k, v in kwargs.iteritems():
            dict.__setitem__(res, k, v)
        return res

    def exclude(self, *args):
        """
        Возвращает копию без указанных ключей
        """
        res = self.copy()
        for k in args:
            dict.pop(res, k)
        return res


class BaseFormAction(_Action):
    """
    Экшн, позволяющий работать с моделью с помощью GET/POST запросов,
    также позволяющий получить конфигурацию view (окна)
    для отображения модели
    """

    suffixes = ('ui',)

    _MODES = {
        # (http-method, suffix) -> (метод-обработчик, декларация, ResultClz)
        ('GET', None): ('get', 'acd_get', DataResult),
        ('POST', None): ('post', 'acd_post', lambda d: _OperationResult(**d)),
        ('GET', 'ui'): ('get_ui', 'acd_get_ui', UIResult),
    }

    acd_get_ui = FrozenDict()
    acd_get = FrozenDict()
    acd_post = FrozenDict()

    model = None

    ui_clz = None

    def build_context(self, request, suffix=None):
        context = _DAC()
        # получаем правила и метод-обработчик
        method, rules, result_clz = self._MODES[(request.method, suffix)]
        context.build(getattr(self, rules))
        # метод и формирователь результата положим в контекст,
        # чтобы взять в run
        context._method = getattr(self, method)
        context._result_clz = result_clz
        return context

    def run(self, request, context, suffix=None):
        # вызываем метод, указанный в контексте
        return context._result_clz(context._method(request, context))

    #=========================================================================
    # методы, отвечающие за (де)сериализацию модели
    #=========================================================================
    def serialize(self, request, context):
        """
        Возвращает сериализованное представление модели
        """
        raise NotImplementedError(
            "No default serialization provided!")

    def deserialize(self, request, context):
        """
        Преобразует сериализованное представление в модель
        """
        raise NotImplementedError(
            "No default deserialization provided!")

    #=========================================================================
    # методы - обработчики запросов в разных режимах
    #=========================================================================
    def get_ui(self):
        """
        Обработчик GET-запроса на получение окна,
        пригодного для отображения модели
        """
        if self.ui_clz:
            return self.ui_clz()
        raise NotImplementedError(
            "UI class not specified and"
            " no \"get_ui\" implementaion provided!")

    def get(self, request, context):
        """
        Обработчик GET-запроса, выполняющий "отгрузку" модели
        вместе с ключом, обозначающим view (окно)
        """
        return {
            'ui': self.get_absolute_url() + "#ui",
            'model': getattr(self.model, 'serialize', self.serialize)(
                request, context
            )
        }

    def post(self, request, context):
        """
        Обработчик POST-запроса, выполняющий сохранение объекта
        """
        return {
            'success': getattr(self.model, 'deserialize', self.serialize)(
                request, context
            )
        }
