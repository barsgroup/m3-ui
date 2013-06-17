#coding: utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from django.conf import settings

from m3.ui.ext.base import ExtUIComponent
from m3.ui.actions import ActionContext
from m3.ui.ext.renderers import ExtWindowRenderer
from m3.ui.ext import render_template

from m3.helpers.datastructures import TypedList
# В качестве значений списка TypedList атрибутов могут выступать объекты:
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.containers.base import BaseExtContainer
from m3.ui.ext.controls.base import BaseExtControl

class BaseExtWindow(ExtUIComponent):
    '''
    Базовый класс для всех окон
    '''
    
    #deprecated: Использовать атрибуты с верхним регистром
    align_left = 'left'
    align_center = 'center'
    align_right = 'right'
    
    ALIGN_LEFT = align_left
    ALIGN_CENTER = align_center
    ALIGN_RIGHT = align_right

    def __init__(self, *args, **kwargs):
        super(BaseExtWindow, self).__init__(*args, **kwargs)
        self.template = 'ext-windows/ext-window.js' # FIXME: Закомментить
        
        # Шаблон, который будет отрендерен после основного
        self.template_globals = ''

        self.renderer = ExtWindowRenderer()
        self.renderer.window = self

        # Название 
        self._ext_name = 'Ext.m3.Window'

        # Шрина окна
        self.width = 400
        
        # Высота окна
        self.height = 300
        
        # Заголовок
        self.title = None
        
        # Типизированный список вложенных компонентов
        self.__items = TypedList(type=ExtUIComponent)
        
        # Типизированный список кнопок
        self.__buttons = TypedList(type=ExtButton)

        # layout extjs. См. документацию
        self.layout = None
        
        # Признаки модальности, Окно развернуто на весь экран, Окно свернуто
        self.modal = self.maximized = self.minimized = False
        
        # Возможность закрывать, разворачивать, сворачивать окно
        self.closable = self.maximizable = self.minimizable = None
        
        # По умолчанию отсту внутри границ 5 px
        self.body_style = 'padding:5px;'
        
        # CSS класс для иконки в вершине окна
        self.icon_cls = None
        
        # Набор тулбаров
        self.top_bar = None
        self.bottom_bar = None
        self.footer_bar = None
        
        # Признак границы
        self.border = True
        
        # Возможность перетаскивать окно
        self.draggable = True
        
        # Возможность изменять размеры окна
        self.resizable = True
        
        # Ссылка на родительское окно
        self.parent_window_id = ''
        
        # Список обработчиков на клавиши 
        self.keys = []
        
        # Признак автоматической загрузки содержимого после рендеринга
        self.auto_load = None
        
        # Рендерить компонент скрытом, чтобы показать нужно вызвать метод show
        self.hidden = True
        
        # Конфигурация layout
        self.layout_config = {}
        
        # Расположение кнопок (слева, по центру, справа)
        self.button_align = None
        
        # Ссылка на документацию
        self.help_topic = None
        
        # Признак только чтения
        self.read_only = False
        
        # Экшен на закрытие окна
        self.close_action = None

        # Атрибуты специфичные для form layout
        self.label_width = self.label_align = self.label_pad = None

    def t_render_layout_config(self):
        '''
        Рендерит конфиг, если указан layout
        '''
        return '{%s}' % ','.join(['%s:"%s"' % (k, v)
            for k, v in self.layout_config.items()])

    def render_base_config(self):
        super(BaseExtWindow, self).render_base_config()
        self._put_config_value('title', self.title)
        self._put_config_value('modal', self.modal)
        self._put_config_value('maximized', self.maximized)
        self._put_config_value('minimized', self.minimized)
        self._put_config_value('minimizable', self.minimizable)
        self._put_config_value('maximizable', self.maximizable)
        self._put_config_value('closable', self.closable)
        self._put_config_value('iconCls', self.icon_cls)
        self._put_config_value('bodyStyle', self.body_style)
        self._put_config_value('layout', self.layout)
        self._put_config_value('tbar', self.t_render_top_bar, self.top_bar)
        self._put_config_value('bbar', self.t_render_bottom_bar, self.bottom_bar)
        self._put_config_value('fbar', self.t_render_footer_bar, self.footer_bar)
        self._put_config_value('items', self.t_render_items)
        self._put_config_value('buttons', self.t_render_buttons, self.buttons)
        self._put_config_value('border', self.border)
        self._put_config_value('resizable', self.resizable)
        self._put_config_value('draggable', self.draggable)        
        self._put_config_value('keys', self.t_render_keys, self.keys)
        self._put_config_value('buttonAlign', self.button_align)
        self._put_config_value('labelWidth', self.label_width)
        self._put_config_value('labelAlign', self.label_align)
        self._put_config_value('labelPad', self.label_pad)

        if self.layout_config:
            self._put_config_value('layoutConfig', self.t_render_layout_config)

        if self.close_action:
            self._put_config_value('closeAction', self.close_action)

    def render_params(self):
        super(BaseExtWindow, self).render_params()
        self._put_params_value('parentWindowID', self.parent_window_id)
        if self.help_topic:
            self._put_params_value('helpTopic', settings.HELP_PREFIX + self._help_topic_full_path())
        if self.action_context:
            self._put_params_value('contextJson', self.action_context.json )

    @property
    def buttons(self):
        return self.__buttons

    @property
    def items(self):
        return self.__items

    def t_render_items(self):
        return '[%s]' % ','.join([item.render() for item in self.items])

    def t_render_buttons(self):
        return '[%s]' % ','.join([button.render() for button in self.buttons])

    def t_render_top_bar(self):
        return self.top_bar.render()

    def t_render_bottom_bar(self):
        return self.bottom_bar.render()

    def t_render_footer_bar(self):
        return self.footer_bar.render()

    def pre_render(self):
        super(BaseExtWindow, self).pre_render()
        if hasattr(self.action_context,'m3_window_id'):
            self.parent_window_id = self.action_context.m3_window_id
            # теперь m3_window_id должно быть единое для всех дочерних контролов
            self.action_context.m3_window_id = self.client_id

        children = []
        children.extend(self.items)
        children.extend(self.buttons)
        children.append(self.top_bar)
        children.append(self.footer_bar)
        # выставление контекста всем элементам окна
        for item in children:
            if item:
                # объединим личный и общий контексты. личный важнее!
                # поэтому его накатим его первым
                # если у объекта небыло контекста, то будет!
                item.action_context = ActionContext().combine(getattr(item,'action_context',None)).combine(getattr(self,'action_context',None))
                # укажем кто у него окно-папа
                item.action_context.m3_window_id = self.client_id

    def render_globals(self):
        if self.template_globals:
            return render_template(self.template_globals, {'component': self,
                                                           'window': self})
        return ''

    def find_by_name(self, name):
        '''Осуществляет поиск экземпляра во вложенных объектах по имени экземпляра'''
        for item in self._items:
            if hasattr(item, 'name') and name == getattr(item, 'name'):
                return item

            if hasattr(item, '_items'):
                res = item.find_by_name(name)
                if res:
                    return res

    # A prefer 9.04.10
    # Следующие магические методы, которые вызываются из шаблона, нужны для:
    # Кнопки по-умолчанию в эксте: (maximizable=False, minimizable=False, closable=True)
    # Т.к. в различных проектах могут быть определена начальная конфигурация, например, для всех окон определены maximizable=True, minimizable=True
    # то возникает проблема: как в некоторых окнах принудительно убрать эти кнопки, при  этом не менять код m3
    # Соответсвенно булевые типы возвращать нельзя, возвращаем строки и в шаблоне проверяем строки с значение None.
    # По-умолчанию у таких атрибутов значение None.
    # ps: Надеемся, что этот прицедент последний
    def t_get_maximizable(self):
        # @deprecated: Не используется
        return str(self.maximizable)

    def t_get_minimizable(self):
        # @deprecated: Не используется
        return str(self.minimizable)

    def t_get_closable(self):
        # @deprecated: Не используется
        return str(self.closable)

    def t_render_keys(self):
        '''
        Биндинг множества кнопок к их действиям 
        '''
        return '[%s]' % ','.join(['{%s}' % ','.join(['%s:%s' % (k,v) for k, v in key.items()]) for key in self.keys])

    def _help_topic_full_path(self):
        '''
        Возвращает квалицифирующее имя топика помощи
        '''
        if not self.help_topic:
            return ''
        assert isinstance(self.help_topic, tuple)
        assert len(self.help_topic) > 0
        return self.help_topic[0] + '.html' + ('#' + self.help_topic[1] if len(self.help_topic) > 1 else '')

    def nested_components(self):
        '''
        Возвращает список вложенных компонентов
        '''
        nested = super(BaseExtWindow, self).nested_components()

        nested.extend(self.items)   # произвольные вложенные элементы
        nested.extend(self.buttons) # кнопки
        nested.extend([self.top_bar, self.footer_bar]) # топ и футтер бары как контейнет

        return nested

    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, *args, **kwargs)
        # Выключаем\включаем компоненты.
        # Задаем собственный атрибут окна.
        self.read_only = access_off
        # Перебираем итемы.
        for item in self.__items:
            item.make_read_only(self.read_only, exclude_list, *args, **kwargs)
        # Перебираем бары.
        bar_typle = (self.footer_bar, self.bottom_bar, self.top_bar)
        for bar in bar_typle:
            if bar and bar._items:
                # Обязательно проверяем, что пришел контейнер.
                assert isinstance(bar, BaseExtContainer)
                for item in bar._items:
                    if hasattr(item, 'make_read_only'):
                        item.make_read_only(self.read_only, exclude_list, *args, **kwargs)
        # Перебираем кнопки.
        if self.__buttons and self.__buttons:
            for button in self.__buttons:
                assert isinstance(button, BaseExtControl)
                button.make_read_only(self.read_only, exclude_list, *args, **kwargs)


    @property
    def buttom_bar(self):
        '''@deprecated: Использовать bottom_bar'''
        return self.bottom_bar

    @buttom_bar.setter
    def buttom_bar(self, value):
        '''@deprecated: Использовать bottom_bar'''
        self.bottom_bar = value
