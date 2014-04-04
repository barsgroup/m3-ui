#coding: utf-8

from base import Pack, UIAction
from m3_ext.ui import all_components as ext

__author__ = 'prefer'


@Pack.register
class FormAction(UIAction):
    """
    Пример формы
    """
    title = u'Окно с формой'

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout='fit')

        win.items.append(ext.ExtForm(title=u'Заголовок формы'))

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

        win.panel.top_bar = tbar

        win.panel.bottom_bar = ext.ExtPagingBar()

        win.items.append(win.panel)

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