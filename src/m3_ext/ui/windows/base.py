# coding: utf-8
from __future__ import absolute_import

import weakref

from django.conf import settings
from m3.actions import ActionContext

from m3_ext.ui import render_template
from m3_ext.ui.base import ExtUIComponent
from m3_ext.ui.containers.base import BaseExtContainer
from m3_ext.ui.controls.base import BaseExtControl

from ..helpers import _render_globals
import six


class ExtWindowRenderer(object):
    """
    Рендерер для скрипта на показ окна
    """
    def __init__(self, common_template):
        self.common_template = common_template

    def get_script(self, window):
        return render_template(
            self.common_template, {'window': window}
        )


class BaseExtWindow(ExtUIComponent):
    """
    Базовый класс для всех окон
    """

    #deprecated: Использовать атрибуты с верхним регистром
    ALIGN_LEFT = align_left = 'left'
    ALIGN_CENTER = align_center = 'center'
    ALIGN_RIGHT = align_right = 'right'

    def __init__(self, *args, **kwargs):
        super(BaseExtWindow, self).__init__(*args, **kwargs)
        self.template = 'ext-windows/ext-window.js'  # FIXME: Закомментить

        # Шаблон, который будет отрендерен после основного
        self.template_globals = ''

        self.renderer = ExtWindowRenderer('ext-script/ext-windowscript.js')

        # Название
        self._ext_name = 'Ext.m3.Window'

        # Шрина окна
        self.width = 400

        # Высота окна
        self.height = 300

        # Заголовок
        self.title = None

        # Типизированный список вложенных компонентов
        self.__items = []

        # Типизированный список кнопок
        self.__buttons = []

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

        # Id контейнера окна
        self.render_to = None

    def t_render_layout_config(self):
        """
        Рендерит конфиг, если указан layout
        :rtype: str
        """
        return '{%s}' % ','.join([
            '%s:"%s"' % (k, v)
            for k, v in six.iteritems(self.layout_config)
        ])

    def render_base_config(self):
        super(BaseExtWindow, self).render_base_config()
        for args in (
            ('title', self.title),
            ('modal', self.modal),
            ('maximized', self.maximized),
            ('minimized', self.minimized),
            ('minimizable', self.minimizable),
            ('maximizable', self.maximizable),
            ('closable', self.closable),
            ('iconCls', self.icon_cls),
            ('bodyStyle', self.body_style),
            ('layout', self.layout),
            ('tbar', self.t_render_top_bar, self.top_bar),
            ('bbar', self.t_render_bottom_bar, self.bottom_bar),
            ('fbar', self.t_render_footer_bar, self.footer_bar),
            ('items', self.t_render_items),
            ('buttons', self.t_render_buttons, self.buttons),
            ('border', self.border),
            ('resizable', self.resizable),
            ('draggable', self.draggable),
            ('keys', self.t_render_keys, self.keys),
            ('buttonAlign', self.button_align),
            ('labelWidth', self.label_width),
            ('labelAlign', self.label_align),
            ('labelPad', self.label_pad),
            ('renderTo', self.render_to),
        ):
            self._put_config_value(*args)

        if self.layout_config:
            self._put_config_value('layoutConfig', self.t_render_layout_config)

        if self.close_action:
            self._put_config_value('closeAction', self.close_action)

    def render_params(self):
        super(BaseExtWindow, self).render_params()
        self._put_params_value('parentWindowID', self.parent_window_id)
        if self.help_topic:
            self._put_params_value(
                'helpTopic',
                settings.HELP_PREFIX + self._help_topic_full_path()
            )
        if self.action_context:
            self._put_params_value(
                'contextJson',
                self.action_context.json
            )

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
        if hasattr(self.action_context, 'm3_window_id'):
            self.parent_window_id = self.action_context.m3_window_id
            # теперь m3_window_id должно быть
            # единое для всех дочерних контролов
            self.action_context.m3_window_id = self.client_id

        children = (
            list(self.items) +
            list(self.buttons) +
            [self.top_bar, self.footer_bar]
        )
        # выставление контекста всем элементам окна
        for item in children:
            if item:
                # объединим личный и общий контексты. личный важнее!
                # поэтому его накатим его первым
                # если у объекта небыло контекста, то будет!
                item.action_context = ActionContext().combine(
                    getattr(item, 'action_context', None)
                ).combine(
                    getattr(self, 'action_context', None)
                )
                # укажем кто у него окно-папа
                item.action_context.m3_window_id = self.client_id

    def render_globals(self):
        return _render_globals(self)

    def find_by_name(self, name):
        """
        Осуществляет поиск экземпляра
        во вложенных объектах по имени экземпляра
        :param name: имя экземпляра
        :type name: str
        """
        for item in self.items:
            if hasattr(item, 'name') and name == getattr(item, 'name'):
                return item

            if hasattr(item, 'find_by_name'):
                res = item.find_by_name(name)
                if res:
                    return res

    # A prefer 9.04.10
    # Следующие магические методы, которые вызываются из шаблона, нужны для:
    # Кнопки по-умолчанию в эксте:
    # (maximizable=False, minimizable=False, closable=True)
    # Т.к. в различных проектах могут быть определена начальная конфигурация,
    # например, для всех окон определены maximizable=True, minimizable=True
    # то возникает проблема: как в некоторых окнах принудительно убрать
    # эти кнопки, при этом не менять код m3
    # Соответсвенно булевые типы возвращать нельзя,
    # возвращаем строки и в шаблоне проверяем строки с значение None.
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
        """
        Биндинг множества кнопок к их действиям
        :rtype: str
        """
        return '[%s]' % ','.join([
            '{%s}' % ','.join([
                '%s:%s' % i for i in key.items()
            ])
            for key in self.keys
        ])

    def _help_topic_full_path(self):
        """
        Возвращает квалицифирующее имя топика помощи
        :rtype: str
        """
        if not self.help_topic:
            return ''
        assert isinstance(self.help_topic, tuple)
        assert len(self.help_topic) > 0
        return self.help_topic[0] + '.html' + (
            '#' + self.help_topic[1] if len(self.help_topic) > 1 else ''
        )

    def _make_read_only(
            self, access_off=True, exclude_list=None, *args, **kwargs):
        exclude_list = exclude_list or []
        self.read_only = access_off
        # Перебираем итемы.
        for item in self.__items:
            item.make_read_only(
                self.read_only, exclude_list, *args, **kwargs)
        # Перебираем бары.
        bar_typle = (self.footer_bar, self.bottom_bar, self.top_bar)
        for bar in bar_typle:
            if bar and bar._items:
                # Обязательно проверяем, что пришел контейнер.
                assert isinstance(bar, BaseExtContainer)
                for item in bar._items:
                    if hasattr(item, 'make_read_only'):
                        item.make_read_only(
                            self.read_only, exclude_list, *args, **kwargs)
        # Перебираем кнопки.
        if self.__buttons and self.__buttons:
            for button in self.__buttons:
                assert isinstance(button, BaseExtControl)
                button.make_read_only(
                    self.read_only, exclude_list, *args, **kwargs)

    def get_script(self):
        return self.renderer.get_script(self)
