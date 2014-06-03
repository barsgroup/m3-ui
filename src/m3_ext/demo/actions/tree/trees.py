# -*- coding: utf-8 -*-

from m3.actions import Action
from m3.actions.results import PreJsonResult
from m3_ext.demo.actions.base import DemoAction, Pack

from m3_ext.ui import all_components as ext
from m3_ext.ui.results import UIJsonEncoder


@Pack.register
class TreeAction(DemoAction):
    """
    Пример статических узлов для дерева
    """
    title = u'ExtTree со статичными данными'

    def get_ui(self, request, context):
        win = super(TreeAction, self).get_ui(request, context)
        win.layout = 'fit'
        win.width, win.height = 300, 300

        tree = ext.ExtTree(
            nodes=[
                {"first_name": u"Иван",
                 "second_name": u'Иванов',
                 "load_type": False,
                 "leaf": False,
                 "children": [
                     {"first_name": u"Петр",
                      "second_name": u'Петров',
                      "load_type": False,
                      "leaf": True}
                 ]},
                {"first_name": u"Сидор",
                 "second_name": u'Сидоров',
                 "load_type": False,
                 "leaf": True}
            ],
            columns=[
                ext.ExtGridColumn(header=u"Фамилия", data_index="first_name"),
                ext.ExtGridColumn(header=u"Имя", data_index="second_name"),
                ext.ExtGridBooleanColumn(header=u"Тип загрузки", data_index="load_type")
            ]
        )


        # пример контекстного меню
        # пример контекстного меню
        tree.handler_containercontextmenu = ext.ExtContextMenu(
            items=[
                ext.ExtContextMenuItem(text=u'Да'),
                ext.ExtContextMenuItem(text=u'Нет')
            ]
        )

        tree.handler_contextmenu = ext.ExtContextMenu(
            items=[
                ext.ExtContextMenuItem(text=u'Да'),
                ext.ExtContextMenuItem(text=u'Нет')
            ]
        )

        tree.handler_containercontextmenu.add_separator()
        tree.handler_containercontextmenu.add_item(text=u'Не знаю')

        win.items.append(tree)
        return win


@Pack.register
class TreeRemoteAction(DemoAction):
    """
    Пример загрузки узлов для дерева с сервера
    """
    title = u'ExtTree с данными с сервера'

    def get_ui(self, request, context):
        win = super(TreeRemoteAction, self).get_ui(request, context)
        win.layout = 'fit'
        win.width, win.height = 300, 300
        tree = ext.ExtTree(
            url=self.parent.treedataaction.get_absolute_url(),
            columns=[
                ext.ExtGridColumn(header=u"Фамилия", data_index="first_name"),
                ext.ExtGridColumn(header=u"Имя", data_index="second_name"),
                ext.ExtGridBooleanColumn(header=u"Тип загрузки", data_index="load_type")
            ]
        )


        # пример контекстного меню
        tree.handler_containercontextmenu = ext.ExtContextMenu(
            items=[
                ext.ExtContextMenuItem(text=u'Да'),
                ext.ExtContextMenuItem(text=u'Нет')
            ]
        )

        tree.handler_contextmenu = ext.ExtContextMenu(
            items=[
                ext.ExtContextMenuItem(text=u'Да'),
                ext.ExtContextMenuItem(text=u'Нет')
            ]
        )

        tree.handler_containercontextmenu.add_separator()
        tree.handler_containercontextmenu.add_item(text=u'Не знаю')

        win.items.append(tree)
        return win


@Pack.register
class TreeDataAction(Action):
    url = r'/tree-data'

    def run(self, request, context):
        nodes = [
            {"id": 1,
             "first_name": u"Иван",
             "second_name": u'Иванов',
             "load_type": True,
             "leaf": False,
             "children": [
                 {"id": 2,
                  "first_name": u"Петр",
                  "second_name": u'Петров',
                  "load_type": True,
                  "leaf": True}
             ]},
            {"id": 3,
             "first_name": u"Сидор",
             "second_name": u'Сидоров',
             "load_type": True,
             "leaf": True}
        ]

        result = PreJsonResult(nodes)
        result.encoder_clz = UIJsonEncoder
        return result
