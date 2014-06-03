#coding: utf-8
from m3_ext.demo.actions.base import DemoAction, Pack

from m3_ext.ui import all_components as ext
from m3.actions.urls import get_url

from m3_ext.demo.actions.grids.grid import DataAction


@Pack.register
class DictFieldAction(DemoAction):
    """
    Пример выбора из справочника
    """
    title = u'ExtDictSelectField, ExtMultiSelectField'

    def get_ui(self, request, context):
        win = ext.ExtWindow(
            layout=ext.ExtForm.FIT,
            width=400,
            height=400,
            maximizable=True,
            minimizable=True,
            buttons=[
                ext.ExtButton(text=u'Закрыть',
                              handler='close'),
            ],
            items=[
                ext.ExtForm(
                    padding='5px',
                    items=[

                        # FIXME: Пока нет выбора из справочника
                        ext.ExtDictSelectField(
                            label=u'Первый участник',
                            # url='/ui/tree-dict-window',
                            display_field='lname',
                            autocomplete_url=get_url(DataAction),
                            fields=['id', 'lname', 'fname', 'adress'],
                            ask_before_deleting=False,
                            anchor='80%',

                        ),

                        ext.ExtMultiSelectField(
                            label=u'Второй участник',
                            # url='/ui/tree-dict-window',
                            display_field='lname',
                            autocomplete_url=get_url(DataAction),
                            fields=['id', 'lname', 'fname', 'adress'],
                            ask_before_deleting=False,
                            anchor='80%',
                        )
                    ]
                )
            ]
        )

        return win
