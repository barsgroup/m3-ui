#coding: utf-8

from base import Pack, UIAction
from m3_ext.ui import all_components as ext

__author__ = 'prefer'


@Pack.register
class DictFieldAction(UIAction):
    """
    Пример выбора из справочника
    """
    title = u'ExtDictSelectField'

    def get_ui(self, request, context):

        field = ext.ExtDictSelectField(
            # url=''
        )

        win = ext.ExtWindow(
            layout=ext.ExtForm.FIT,
            width=400,
            height=400,
            maximizable=True,
            minimizable=True,
            buttons=[
                ext.ExtButton(text=u'Закрыть'),
            ],
            items=[
                ext.ExtForm(
                    items=[
                        field,
                    ]
                )
            ]
        )

        return win