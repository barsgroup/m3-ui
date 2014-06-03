#coding: utf-8
from m3_ext.demo.actions.base import DemoAction, Pack
from m3_ext.ui import all_components as ext


@Pack.register
class FormAction(DemoAction):
    """
    Пример формы
    """
    title = u'Окно с ExtForm'

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout='fit')

        win.items.append(ext.ExtForm(title=u'Заголовок формы'))

        return win


@Pack.register
class PanelAction(DemoAction):
    """
    Пример ExtPanel, ExtToolBar, ExtPagingBar
    """
    title = u'Окно с ExtPanel, ExtToolBar, ExtPagingBar'

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


@Pack.register
class ContainerAction(DemoAction):
    """
    Пример ExtContainer
    """

    title = u'Окно с ExtContainer'

    def get_ui(self, request, context):
        win = super(ContainerAction, self).get_ui(request, context)
        win.container = ext.ExtContainer()
        win.items.append(win.container)
        return win


@Pack.register
class TitlePanelAction(DemoAction):
    """
    Пример Title Panel
    """

    title = u'Окно с ExtTitlePanel'

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout='fit')

        # TODO: Пока код не рабочий, что-то странное надо засовывать в header

        win.title_panel = ext.ExtTitlePanel(
            title_items=[
                ext.ExtButton(text=u'Кнопка')
            ])

        win.items.append(win.title_panel)
        return win


@Pack.register
class TabPanelAction(DemoAction):
    """
    Пример TabPanel
    """

    title = u'Окно с TabPanel'

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout='fit')

        win.tab_panel = ext.ExtTabPanel()
        win.tab_panel.add_tab(title=u'Раз')
        win.tab_panel.add_tab(title=u'Два')
        win.tab_panel.add_tab(title=u'Три')

        win.items.append(win.tab_panel)
        return win


@Pack.register
class FieldSetAction(DemoAction):
    """
    Пример ExtFieldSet
    """

    title = u'Окно с ExtFieldSet'

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout='form')

        win.field_set = ext.ExtFieldSet(
            label=u'Наименование',
            padding='5px',
            items=[
                ext.ExtStringField(label=u'Текстовое поле')
            ]
        )
        win.items.append(win.field_set)
        return win


@Pack.register
class RadioGroupAction(DemoAction):
    """
    Пример ExtRadioGroup
    """

    title = u'Окно с ExtRadioGroup'

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout=ext.ExtForm.FORM)

        win.items.append(
            ext.ExtRadioGroup(
                layout=ext.ExtRadioGroup.FORM,
                label=u'ExtRadioGroup',
                columns=2,
                items=[
                    ext.ExtRadio(name='1', box_label=u'1'),
                    ext.ExtRadio(name='1', box_label=u'2', checked=True),
                    ext.ExtRadio(name='1', box_label=u'3'),
                    ext.ExtRadio(name='1', box_label=u'4'),
                ]
            )
        )

        return win
