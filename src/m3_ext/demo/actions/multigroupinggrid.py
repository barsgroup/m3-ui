# -*- coding: utf-8 -*-
from m3.actions import Action, ACD, PreJsonResult
from m3.actions.urls import get_url
from m3.actions.utils import extract_int
from m3_ext.demo.actions import UIAction, Pack
from m3_ext.ui import all_components as ext
from m3_ext.ui.results import ExtGridDataQueryResult


@Pack.register
class MultiGroupingGridAction(UIAction):
    """
    Пример группировочной таблицы (ObjectGrid)
    """
    title = u'"Живая" таблица с серверной группировкой (LiveGrid, ExtMultiGroupinGrid)'

    def get_js(self, request, context):
        return """function(win, data){
            win.buttons[0].on('click', function(){
                win.close(false);
            });
        }"""

    def get_ui(self, request, context):
        window = super(MultiGroupingGridAction, self).get_ui(request, context)
        window.width = 800
        window.height = 500
        window.layout = 'fit'
        grid = ext.ExtMultiGroupinGrid()
        grid.add_column(header=u'Код', data_index='code')
        grid.add_column(header=u'Наименование', data_index='name')
        grid.add_column(header=u'Категория', data_index='cat', groupable=True)
        grid.action_data = MultiGroupingDataAction
        grid.groupable = True

        window.items.append(grid)
        button = ext.ExtButton(text=u'Закрыть')
        window.buttons.append(button)
        return window


@Pack.register
class MultiGroupingDataAction(Action):
    """
    Данные для грида
    """
    url = '/multigroupinggrid-data'

    cats = [u'Категория А', u'Категория Б', u'Категория В', u'Категория Г']

    def context_declaration(self):
        return [
            ACD(name='start', type=int, required=True, default=0),
            ACD(name='limit', type=int, required=True, default=200),
            ACD(name='exp', type=object, required=True, default=[]),
            ACD(name='grouped', type=object, required=True, default=[]),
            # ACD(name='grouping', required=True, type=int),
            # ACD(name='multisort', required=False, type=object),
        ]

    def run(self, request, context):
        data = [
            {'id': str(i), 'code': u'Код %s' % i,
             'name': u'Наименование %s' % i,
             'cat': u'Категория %s' % self.cats[i%4]}
            for i in xrange(100000)
        ]
        start = context.start
        limit = context.limit
        return ExtGridDataQueryResult(data, start, limit)
        # rows = []
        # return PreJsonResult({
        #     "data": rows,
        #     "count": len(rows),
        #     "totalCount": total[0] if isinstance(total, Iterable) else total,
        #     "totalRow": total[1] if isinstance(total, Iterable) else total,
        #     "exp" : exp
        # })