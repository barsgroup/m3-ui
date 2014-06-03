# -*- coding: utf-8 -*-
from m3.actions import Action, ACD, PreJsonResult
from m3_ext.demo.actions.base import DemoAction, Pack
from m3_ext.ui import all_components as ext
from m3_legacy.datagrouping import GroupingRecordDataProvider


@Pack.register
class MultiGroupingGridAction(DemoAction):
    """
    Пример группировочной таблицы (ObjectGrid)
    """
    title = u'"Живая" таблица с серверной группировкой (LiveGrid, ExtMultiGroupinGrid)'

    def get_ui(self, request, context):
        window = super(MultiGroupingGridAction, self).get_ui(request, context)
        window.width = 800
        window.height = 500
        window.layout = window.FIT
        grid = ext.ExtMultiGroupinGrid(sm=ext.ExtLiveGridCheckBoxSelModel())
        grid.add_column(header=u'Код', data_index='code')
        grid.add_column(header=u'Наименование', data_index='name')
        grid.add_column(header=u'Категория', data_index='cat', groupable=True)
        grid.add_column(header=u'Тип', data_index='type', groupable=True)
        grid.action_data = MultiGroupingDataAction
        grid.groupable = True

        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть', handler='close')
        window.buttons.append(button)
        return window


@Pack.register
class MultiGroupingDataAction(Action):
    """
    Данные для грида
    """
    url = '/multigroupinggrid-data'

    cats = [u'Категория А', u'Категория Б', u'Категория В', u'Категория Г']
    types = [u'Группа 0', u'Группа 1', u'Группа 2']

    def context_declaration(self):
        return [
            ACD(name='start', type=int, required=True, default=0),
            ACD(name='limit', type=int, required=True, default=200),
            ACD(name='exp', type=object, required=True, default=[]),
            ACD(name='grouped', type=object, required=True, default=[]),
        ]

    def run(self, request, context):
        data = [
            {
                'id': str(i), 'code': u'Код %s' % i,
                'name': u'Наименование %s' % i,
                'cat': self.cats[i%4],
                'type': self.types[i%3]
            }
            for i in xrange(1000)
        ]
        start = context.start
        limit = context.limit
        # Пытаемся группировать
        exp = context.exp
        proxy = {'id': None, 'code': None, 'name': None, 'cat': None, 'type': None}
        provider = GroupingRecordDataProvider(proxy=proxy, data=data)
        rows, total = provider.get_elements(
            begin=start,
            end=start+limit,
            grouped=context.grouped,
            expanded=exp,
            sorting=[])
        return PreJsonResult({
            "rows": rows,
            "total": total,
            "exp": exp
        })
