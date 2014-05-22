#coding: utf-8
import os
import inspect

from django import http

from m3.actions import ActionPack, Action
from m3_ext.ui import all_components as ext
from m3_ext.ui.results import UIResult, DataResult


class Pack(ActionPack):
    url = '/pack'

    action_classses = set()

    def __init__(self):
        super(Pack, self).__init__()
        for cls in self.action_classses:
            action = cls()
            setattr(self, cls.__name__.lower(), action)
            self.actions.append(action)

    def extend_menu(self, menu):
        return tuple(
            menu.SubMenu(
                a.menu,
                menu.Item(a.title, pack=a)
            )
            for a in self.actions
            if getattr(a, 'title', None)
        )

    @classmethod
    def register(cls, action_clz):

        if not getattr(action_clz, 'menu', None):
            action_clz.menu = os.path.basename(
                os.path.dirname(
                    inspect.getsourcefile(action_clz)))

        cls.action_classses.add(action_clz)
        return action_clz


class UIAction(Action):

    @property
    def title(self):
        """
        Название пункта меню и умолчательный заголовок окна
        """
        return self.__class__.__name__

    menu = None

    @property
    def url(self):
        return '/' + self.__class__.__name__.lower()

    def context_declaration(self):
        return ('mode', {
            'ui': {},
            None: {}
        })

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
            'ui': self.get_absolute_url(),
            'data': {}
        }

    def run(self, request, context):
        if context._mode == 'ui':
            result = UIResult(self.get_ui(request, context))
        else:
            kwargs = self.get_result(request, context)
            kwargs.setdefault('model', {})
            kwargs.setdefault('context', context)
            result = DataResult(**kwargs)
        return result
