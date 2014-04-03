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
    title = u'Простое окно с кнопкой'

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


@Pack.register
class ListWindowAction(UIAction):
    """
    Пример оконного экшна со списком (гридом) внутри.
    """
    title = u'Окно со списком'

    def get_js(self, request, context):
        return """function(w, d){
            var grid = w.find('itemId', 'grid')[0];
            grid.store.loadData(d.rows);
        }"""

    def get_ui(self, request, context):
        win = ext.BaseExtListWindow()
        return win

    def get_result(self, request, context):
        res = super(ListWindowAction, self).get_result(request, context)
        res['data']['rows'] = [
            {'first': u'Первая', 'second': u'Вторая'},
        ]
        return res

@Pack.register
<<<<<<< local
class EditWindowAction(UIAction):
    title = u'Окно с формой'

    def get_js(self, request, context):
        """
        Метод должен вернуть в виде строки js-код для окна
        """
        return """function(w, d) { 
            var form = w.find('itemId', 'form')[0];
            var field = w.find('itemId', 'edit-field-id')[0];
            form.buttons[0].on('click', function(b, e){
                alert(field.getValue());
            });
            form.buttons[1].on('click', function(b, e){
                w.close();
            });
        }"""

    def get_ui(self, request, context):
        win = ext.ExtEditWindow(
            title=u'Окно с формой',
            layout='form',
            width=250,
            height=150)
        
        # FIXME: Заменить на полноценный ExtForm c полями после конвертации
        win.form = {
            'labelWidth': 75,
            'width': 230,
            'height': 100,
            'frame': True,
            'itemId': 'form',
            'xtype': 'form',            
            'defaultType': 'textfield',
            'items': [
                {
                    'fieldLabel': u'Поле ввода',
                    'xtype': 'textfield',
                    'itemId': 'edit-field-id'
                },
            ],
            'buttons': [    
                ext.ExtButton(text=u'Отобразить'),
                ext.ExtButton(text=u'Отмена')
            ]
        }
        win.items.append(win.form)
        return win


class ContainerAction(UIAction):
    """
    Пример контейнера
    """

    title = u'Окно с контейнером'

    def get_ui(self, request, context):
        win = super(ContainerAction, self).get_ui(request, context)
        win.container = ext.ExtContainer()
        win.items.append(win.container)
        return win


@Pack.register
class PanelAction(UIAction):
    """
    Пример панели
    """
    title = u'Окно с панелью'

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout='fit')

        win.panel = ext.ExtPanel(header=True, title=u'Заголовок панели')

        tbar = ext.ExtToolBar()
        tbar.add_text_item(u'Текст на топбаре')
        tbar.add_spacer(10)
        tbar.items.append(ext.ExtButton(text=u'Кнопка на топбаре'))

        tbar.add_separator()
        tbar.items.append(ext.ExtButton(text=u'Еще одна кнопка'))
        tbar.add_fill()
        tbar.items.append(ext.ExtButton(text=u'Кнопка в дальнем конце'))


        print tbar.items[0]._config

        win.panel.top_bar = tbar

        win.items.append(win.panel)
