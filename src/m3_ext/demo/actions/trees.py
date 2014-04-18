# -*- coding: utf-8 -*-

from base import Pack, UIAction
from m3.actions import Action
from m3.actions.results import PreJsonResult

from m3_ext.ui import all_components as ext


@Pack.register
class TreeAction(UIAction):
    """
    Пример оконного экшна
    """
    title = u'ExtTree со статичными данными'

    def get_ui(self, request, context):
        win = super(TreeAction, self).get_ui(request, context)
        win.layout = 'fit'
        win.width, win.height = 300, 300
        tree = ext.ExtTree(
            url=self.parent.treedataaction.get_absolute_url(),
            nodes=[
                ext.ExtTreeNode(text="1", leaf=False, children=[
                    ext.ExtTreeNode(text="1.1", leaf=True)
                ]),
                ext.ExtTreeNode(text="2", leaf=True)
            ],
            root_text="Tree",
        )
        tree.add_column(header="Name", data_index="text")

        # пример контекстного меню
        tree.handler_containercontextmenu = (
            tree.handler_contextmenu
        ) = ext.ExtContextMenu(
            items=[
                ext.ExtContextMenuItem(text=u'Да'),
                ext.ExtContextMenuItem(text=u'Нет')
            ]
        )

        win.items.append(tree)
        return win


@Pack.register
class TreeDataAction(Action):
    url = r'/treedata'

    def run(self, request, context):
        return PreJsonResult(data=[])
