# -*- coding: utf-8 -*-

import abc
from django import http

from m3.actions import ActionPack, Action

from m3_ext.ui import all_components as ext
from m3_ext.ui.results import UIResult


class Pack(ActionPack):

    url = '/pack'

    action_classses = set()

    def __init__(self):
        super(Pack, self).__init__()
        for a in self.action_classses:
            self.actions.append(a())

    def extend_menu(self, menu):
        return tuple(
            menu.Item(a.title, pack=a)
            for a in self.actions
        )

    @classmethod
    def register(cls, action_clz):
        # экшны должны иметь атрибут title
        assert hasattr(action_clz, 'title')
        cls.action_classses.add(action_clz)
        return action_clz


class UIAction(Action):

    @property
    def title(self):
        """
        Название пункта меню и умолчательный заголовок окна
        """
        return self.__class__.__name__

    @property
    def url(self):
        return '/' + self.__class__.__name__.lower()

    def context_declaration(self):
        return {
            'ui': {'type': 'boolean', 'default': False},
            'js': {'type': 'boolean', 'default': False}
        }

    def get_js(self, request, context):
        """
        Метод должен вернуть в виде строки js-код для окна
        """
        return "function(w, d) { return; }"

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
            "config": :: dict - конфиг для конкретного окна
            "data":   :: dict - данные для конкретного окна
        }
        """
        return {
            'ui': self.get_absolute_url(),
            'config': {},
            'data': {}
        }

    def run(self, request, context):
        if context.ui:
            result = self.get_ui(request, context)
            if hasattr(result, '_config'):
                result = {
                    'config': result._config,
                    'data': result._data,
                }
        elif context.js:
            result = self.get_js(request, context)
            return http.HttpResponse(result, mimetype='application/javascript')
        else:
            result = self.get_result(request, context)
        assert result
        return UIResult(result)


#------------------------------------------------------------------------------
@Pack.register
class SampleAction(UIAction):
    """
    Пример оконного экшна
    """
    title = u'Простое окно'

    def get_js(self, request, context):
        return """function(w, d){
            w.find('itemId', 'btn')[0].on('click', function(){
                alert(d.message);
            });
        }"""

    def get_ui(self, request, context):
        win = super(SampleAction, self).get_ui(request, context)
        win.btn = ext.ExtButton(text=u'Кнопка')
        win.items.append(win.btn)
        return win

    def get_result(self, request, context):
        res = super(SampleAction, self).get_result(request, context)
        res['data']['message'] = u"Кнопка нажата!"
        return res
