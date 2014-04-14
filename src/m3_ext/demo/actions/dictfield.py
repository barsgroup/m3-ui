#coding: utf-8
from m3.actions.urls import get_url

from base import Pack, UIAction
from m3_ext.demo.actions.grid import DataAction
from m3_ext.ui import all_components as ext

__author__ = 'prefer'


@Pack.register
class DictFieldAction(UIAction):
    """
    Пример выбора из справочника
    """
    title = u'ExtDictSelectField'

    def get_ui(self, request, context):
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
                    padding='5px',
                    items=[

                        # FIXME: Пока нет выбора из справочника
                        ext.ExtDictSelectField(
                            label=u'Первый участник',
                            # url='/ui/tree-dict-window',
                            display_field='lname',
                            store=ext.ExtJsonStore(
                                url=get_url(DataAction),
                                total_property='total',
                                root='rows',
                                fields=['id', 'lname', 'fname', 'adress']
                            ),
                            ask_before_deleting=False,
                            anchor='80%',
                        ),

                        ext.ExtMultiSelectField(
                            label=u'Второй участник',
                            # url='/ui/tree-dict-window',
                            display_field='lname',
                            store=ext.ExtJsonStore(
                                url=get_url(DataAction),
                                total_property='total',
                                root='rows',
                                fields=['id', 'lname', 'fname', 'adress']
                            ),
                            ask_before_deleting=False,
                            anchor='80%',
                        )
                    ]
                )
            ]
        )

        return win