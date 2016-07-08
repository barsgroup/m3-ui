#coding: utf-8
import json
import random
from django import http
from m3 import M3JSONEncoder

from m3_ext.ui.containers import ExtGridColumn, ExtToolBar
from m3_ext.ui.controls import ExtButton
from m3_ext.ui.fields import ExtDateField
from m3_ext.ui.misc.store import ExtMultiGroupingStore
from m3_ext.ui.panels import ExtMultiGroupinGrid
from m3_ext.ui.windows import ExtEditWindow, ExtWindow
from m3_legacy.datagrouping import GroupingRecordDataProvider, RecordProxy

from m3_ext_demo import url

@url(r'^ui/livegrid$')
def livegrid(request):
    """
    Таблица LiveGrid
    """
    win = ExtEditWindow(title=u'Таблица LiveGrid',
                        layout='fit',
                        width=800,
                        height=400) #, maximized = True
    win.layout = 'fit'

    grid = ExtMultiGroupinGrid()
    grid.columns.append(ExtGridColumn(header=u'ИД', data_index='id'))
    grid.columns.append(ExtGridColumn(header=u'Поле 1', data_index='F1',
                                      extra={ 'summaryType': '"count"'},
                                      sortable=True))
    grid.columns.append(ExtGridColumn(header=u'Поле 2', data_index='F2',
                                      extra={}, sortable=True))
    grid.columns.append(ExtGridColumn(header=u'Поле 3', data_index='F3', extra={}))
    grid.columns.append(ExtGridColumn(header=u'Значение 1', data_index='value',
                                      sortable=True, extra={'summaryType': '"sum"'}))
    grid.columns.append(ExtGridColumn(header=u'Значение 2', data_index='value1',
                                      sortable=True, extra={'summaryType': '"sum"'}))
    grid.columns.append(ExtGridColumn(header=u'% различия', data_index='percent',
                                      sortable=True))
    grid.set_store(ExtMultiGroupingStore(url='/ui/livegrid-data',
                                         auto_load=True, total_property='totalCount',
                                         root='data', id_property='index'))

    date_f = ExtDateField(label=u'Дата', name='date')
    for col in grid.columns:
        if col.data_index == 'F1':
            col.extra['filter'] = u'{xtype:"textfield", filterName:"f1"}'


    grid.plugins.extend(['new Ext.ux.grid.GridHeaderFilters()',
                         u'new Ext.ux.grid.MultiGroupingExporter({title:"Таблица",exportUrl: "/ui/livegrid-export"})',
                         'new Ext.ux.grid.MultiGroupingSummary()'])
    win.items.append(grid)

    button = ExtButton(text=u'Закрыть')
    button.handler = 'function(){Ext.getCmp("%s").close();}' % win.client_id

    win.buttons.append(button)
    return http.HttpResponse(win.get_script())


@url(r'^ui/exportgrid$')
def exportgrid(request):
    """
    Таблица LiveGrid
    """
    win = ExtEditWindow(title = u'Экспорт таблицы', layout = 'fit', width = 800, height = 400) #, maximized = True
    win.template_globals = 'ui-js/exportgrid-globals.js'
    button = ExtButton(text = u'Закрыть')
    button.handler = 'function(){Ext.getCmp("%s").close();}' % win.client_id
    win.buttons.append(button)
    return http.HttpResponse(win.get_script())

DATA = []


class Data_Proxy(RecordProxy):
    def __init__(self, *args, **kwargs):
        self.F1 = ''
        self.F2 = ''
        self.F3 = ''
        self.value = 0
        self.value1 = 0
        super(Data_Proxy, self).__init__(*args, **kwargs)
    def load(self, record):

        self.F1 = getattr(record,'F1') if hasattr(record,'F1') else None
        self.F2 = getattr(record,'F2') if hasattr(record,'F2') else None
        self.F3 = getattr(record,'F3') if hasattr(record,'F3') else None
        self.value = getattr(record,'value') if hasattr(record,'value') else 0
        self.value1 = getattr(record,'value1') if hasattr(record,'value1') else 0
        self.id = getattr(record,'id') if hasattr(record,'id') else None
    def calc(self):
        self.percent = (self.value*100/self.value1) if self.value1 else 0
        self.display = u'Значение=%s' % self.id

# генерация тестового набора данных
F1_RANGE = [str(random.randint(0,100))*1 for i in range(100)]
F2_RANGE = [str(random.randint(0,100))*1 for i in range(100)]
F3_RANGE = [str(random.randint(0,100))*1 for i in range(100)]

MAX_DATA = 1
for i in range(0,MAX_DATA):
    item = Data_Proxy(index = i, id = random.randint(0,MAX_DATA*100), F1 = random.choice(F1_RANGE), F2 = random.choice(F2_RANGE), F3 = random.choice(F3_RANGE), value = (10*random.randint(0,9)), value1 = (10*random.randint(0,9)))
    DATA.append(item)
    
class TestData_Proxy(RecordProxy):
    
    def __init__(self, *args, **kwargs):
        self.F1 = ''
        self.F2 = ''
        self.F3 = ''
        self.value = 0
        self.value1 = 0
        super(TestData_Proxy, self).__init__(*args, **kwargs)
    def load(self, record):
        self.F1 = getattr(record,'F1') if hasattr(record,'F1') else None
        self.F2 = getattr(record,'F2') if hasattr(record,'F2') else None
        self.F3 = getattr(record,'F3') if hasattr(record,'F3') else None
        self.value = getattr(record,'value') if hasattr(record,'value') else 0
        self.value1 = getattr(record,'value1') if hasattr(record,'value1') else 0
        self.id = getattr(record,'id') if hasattr(record,'id') else None
    def calc(self):
        self.percent = (self.value*100/self.value1) if self.value1 else 0
        self.display = u'Значение=%s' % self.id


@url(r'^ui/livegrid-data$')
def livegrid_data(request):
    offset = int(request.POST.get('start'))
    count = int(request.POST.get('limit'))
    grouped = json.loads(request.POST.get('grouped'))
    exp = json.loads(request.POST.get('exp'))
    direction = request.POST.get('dir')
    sort = request.POST.get('sort')
    sorting = {}
    if sort:
        sorting[sort] = direction
    #if expanding:
        # значит нужно расчитать для этого элемента количество раскрытых дочерних
    #print 'exp = %s' % exp
    #print '---------------------------------------------------------------------'
    prov = GroupingRecordDataProvider(proxy = Data_Proxy, data = DATA, totals = True, aggregates = {'F1':'count','value':'sum','value1':'sum'})
    #prov = GroupingRecordSQLAlchemyProvider(proxy = Data_Proxy, data = session.query(TempData), totals = True, aggregates = {'value':'sum'})
    #prov = GroupingRecordModelProvider(proxy = TestData_Proxy, data = TestData.objects, totals = True, aggregates = {'value':'sum','value1':'sum'})
    list, total = prov.get_elements(offset,count+offset, grouped, exp, sorting)
    #print '---------------------------------------------------------------------'
    count = len(list)
    # если нам вернули число, то значит нет итогов, иначе вернули итоговую строку
    if isinstance(total, (int, long)):
        data = M3JSONEncoder().encode({'data': list, 'count': count, 'totalCount': total})
    else:
        data = M3JSONEncoder().encode({'data': list, 'count': count, 'totalCount': total[0], 'totalRow': total[1]})
    return http.HttpResponse(data,  mimetype='application/json')

@url(r'^ui/exportgrid-export$')
def exportgrid_export(request):
    import os
    import uuid
    import xlwt

    from django.conf import settings

    w = xlwt.Workbook()
    request_params = get_request_params(request)
    ws = w.add_sheet(request_params.get('title'))
    columns = json.loads(request_params.get('columns'))
    data = json.loads(request_params.get('data'))

    title_style = xlwt.easyxf(
        "font: bold on, height 400;"
    )

    header_style = xlwt.easyxf(
        "font: bold on, color-index white;"
        "borders: left thick, right thick, top thick, bottom thick;"
        "pattern: pattern solid, fore_colour gray80;"
    )

    data_style = xlwt.easyxf(
        "borders: left thin, right thin, top thin, bottom thin;"
    )

    ws.write_merge(0,0,0,len(columns),request_params.get('title'),title_style)
    ws.row(0).height = 500
    columns_cash = {}
    for idx,column in enumerate(columns):
        print column
        ws.write(1,idx,column.get('header'),header_style)
        ws.col(idx).width = 0x0d00 + column.get("width")*50
        columns_cash[column["data_index"]] = idx

    for idx,item in enumerate(data,2):
        for k,v in item.items():
            ws.write(idx,columns_cash[k],v,data_style)



    base_name = str(uuid.uuid4())[0:16]
    xls_file_abs = os.path.join(settings.MEDIA_ROOT, base_name+'.xls')
    w.save(xls_file_abs)
    #url = '/'
    url = '%s/%s.xls' % (settings.MEDIA_URL, base_name)
    return http.HttpResponse(url)


@url(r'^ui/livegrid-export$')
def livegrid_export(request):
    request_params = get_request_params(request)
    title = request_params.get('title')
    columns = json.loads(request_params.get('columns'))
    total = int(request_params.get('totalLength'))
    grouped = json.loads(request_params.get('grouped'))
    exp = json.loads(request_params.get('exp'))
    direction = request_params.get('dir')
    sort = request_params.get('sort')
    sorting = {}
    if sort:
        sorting[sort] = direction
    export_type = request_params.get('exportType')
    prov = GroupingRecordDataProvider(proxy = Data_Proxy, data = DATA, totals = True, aggregates = {'F1':'count','value':'sum'})
    url = prov.export_to_file(title, columns, total, grouped, exp, sorting, export_type)
    return http.HttpResponse(url)


def get_fields():
    """
    Набор колонок для ЖГ
    """
    class SimpleColumn(object):
        def __init__(self, field_name, verbose_name=None):
            self.field_name = field_name
            self.verbose_name = verbose_name
    
    return [SimpleColumn('a1'), SimpleColumn('a2'), 
            SimpleColumn('a3'), SimpleColumn('a4')]
      

@url(r'^ui/livegrid-bug$')
def livegrid_bug(request):
    """
    Живой грид не корректно отображает строки, если они не влазят в него
    """
    class ReportData(ExtWindow):
        """
        Копия окна, в котором грид работает некорректно
        """
        
        def __init__(self, params, *args, **kwargs):
            super(ReportData, self).__init__(*args, **kwargs)
            self.initialize()
    
            grid = ExtMultiGroupinGrid()
            grid.action_data = params['data_action']
            self.grid = grid
            
            self.items.append(grid)        
    
        def initialize(self):
            """AUTOGENERATED"""
            self.layout = 'fit'
            self.height = 500
            self.width = 600
            
            tb_buttons = ExtToolBar()
            tb_buttons.layout = 'toolbar'
            
            btn_close = ExtButton()
            btn_close.text = u'Закрыть'
            btn_close.handler = 'function(){ win.close();}'
            
            self.footer_bar = tb_buttons
            
            tb_buttons.items.extend([btn_close])
            
            self.tb_buttons = tb_buttons
            self.btn_close = btn_close

    win = ReportData(params={'data_action': None})
    win.title = u'Отладочный лайвгрид'
    win.grid.store.url = '/ui/livegrid_bug_data'
    
    for field in get_fields():
        win.grid.add_column(data_index=field.field_name, 
                            header=field.verbose_name or field.field_name)  
    
    return http.HttpResponse(win.get_script())


@url(r'^ui/livegrid_bug_data$')
def livegrid_bug_data(request):
    """
    Тестовый набор данных для грида
    """
    
    import uuid
    
    data = []
    for row in xrange(5):
        d = {}
        for item in get_fields():
            d[item.field_name] = str(uuid.uuid4())[:8]
        data.append(d)
    
    return http.HttpResponse(json.dumps({'rows': data[:25], 
                                      #'total': len(data)
                                      }))