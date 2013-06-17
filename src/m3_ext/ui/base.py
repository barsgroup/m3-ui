#coding:utf-8
'''
Модуль с базовыми классами/интерфейсами, которые необходимы
для работы подсистемы m3.ui.ext

Created on 01.03.2010

@author: akvarats
@author: prefer
'''

import datetime
import decimal
import collections

from django import template as django_template
from django.conf import settings

from m3.ui.ext import render_template, render_component
from m3.helpers import js, generate_client_id, normalize, date2str

class ExtComponentException(Exception):
    """
    Ошибка М3-шного экстового компонента.
    """
    pass

#===============================================================================
class ExtUIScriptRenderer(object):
    '''
    @deprecated: Использовать метод render конечного компонента

    Класс, отвечающий за рендер файла скрипта, который
    будет отправлен клиенту.
    '''
    def __init__(self):
        # шаблон, в который осуществляется вывод содержимого
        # скрипта
        self.template = 'ext-script/ext-ui-script.js'
        # компонент, содержимое которого выводится в шаблон
        self.component = None

    def render(self):
        '''
        '''
        result = ''
        try:
            result = self.component.render()
        except AttributeError:
            result = ''
        return result

    def render_globals(self):
        result = ''
        try:
            result = self.component.render_globals()
        except AttributeError:
            result = ''
        return result

    def get_script(self):
        '''
        Генерация скрипта для отправки на клиентское рабочее место.
        '''
        context = django_template.Context({'renderer': self})
        template = django_template.loader.get_template(self.template)
        script = template.render(context)
        if settings.DEBUG:
            script = js.JSNormalizer().normalize(script)
        return script

#===============================================================================
class BaseExtComponent(object):
    '''
    Базовый класс для всех компонентов пользовательского интерфейса
    '''
    def __init__(self, *args, **kwargs):
        # Каждый компонент может иметь шаблон, в котором он будет рендериться
        self.template = ''

        # @deprecated: Только окно (наследник BaseExtWindow)
        # может иметь данный атрибут
        self.template_globals = ''

        # Уникальный идентификатор компонента
        self.client_id =  generate_client_id()

        # action context of the component (normally, this is
        # an instance of m3.ui.actions.ActionContext class
        self.action_context = None

        # рендерер, используемый для вывода соответствующего компонента
        self.renderer = ExtUIScriptRenderer()

        # Словарь обработчиков на события
        self._listeners = {}

        # Список словарей с основной конфигурацией компонента
        self._config_list = []

        # Список словарей с дополнительной конфигурацией компонента
        self._param_list = []

        # Если True, то рендерится как функция, без префикса new
        self._is_function_render = False

        # Имя компонента в нотации ExtJs (Например Ext.form.Panel)
        self._ext_name = None

        # квалифицирующее имя контрола (в пределах некоторого базового компонента)
        # формируется путем присоединения к имени текущего компонента квалифицирующих
        # имен родительских контейнеров.
        # квалицирющее имя текущего компонента формируется из наименования атрибута
        self.qname = ''

    def render(self):
        '''
        Возвращает "кусок" javascript кода, который используется для
        отображения самого компонента. За рендер полного javascript
        отвечает метод get_script()
        '''
        self.pre_render()
        return render_component(self)

    def render_globals(self):
        '''
            Рендерит и возвращает js-код, который помещен в template_globals
        '''
        self.pre_render_globals()
        if self.template_globals:
            return render_template(self.template_globals, {'component': self,
                                                           'self' : self})
        return ''

    def pre_render(self):
        '''
        Вызывается перед началом работы метода render
        '''
        pass

    def pre_render_globals(self):
        '''
        Вызывается перед началом работы метода render_globals
        '''
        pass

    def get_script(self):
        '''
        Генерация скрипта для отправки на клиентское рабочее место.
        '''
        return self.renderer.get_script()

    def init_component(self, *args, **kwargs):
        '''
        Заполняет атрибуты экземпляра значениями в kwargs,
        если они проинициализированы ранее
        '''
        for k, v in kwargs.items():
            assert k in dir(self) and not callable(getattr(self,k)), \
                'Instance attribute "%s" should be defined in class "%s"!' \
                % (k, self.__class__.__name__)
            self.__setattr__(k, v)

    #deprecated:
    def t_render_listeners(self):
        '''
        @deprecated: Если рендеринг не в шаблоне,
        то при вызове render_base_config информация о подписчиках на события
        уже будут в конфиге

        Инкапсуляция над _listeners. Используется из шаблонов! '''
        return dict([(k,v) for k, v in self._listeners.items() if v!=None])

    def t_render_simple_listeners(self):
        '''
        @deprecated: Конфиг должен рендериться в render_base_config
        '''
        return '{%s}' % ','.join(['%s:%s' % (k,v) for k, v in self._listeners.items()
               if not isinstance(v, BaseExtComponent) and v!=None])

    def render_base_config(self):
        '''
        Рендерит базовый конфиг (Конфигурация extjs контрола)
        '''
        self._put_config_value('id', self.client_id)
        if self._listeners:
            self._put_config_value('listeners',
                                   self.t_render_simple_listeners )

    def render_params(self):
        '''
        Рендерит дополнительные параметры (Как правило используется для разработки
        собственных контролов на базе контрола extjs)
        '''
        pass

    def __check_unicode(self, string):
        '''
        Проверка на не юникодную строку в которой есть русские символы
        Если есть русские символы необходимо использовать юникод!
        '''
        try:
            unicode(string)
        except UnicodeDecodeError:
            raise Exception('"%s" is not unicode' % string)
        else:
            return string

    def _put_base_value(self, src_list, extjs_name, item, condition=True,
                         depth = 0):
        '''
        Управляет правильной установкой (в зависимости от типа)
        параметров контрола
        '''
        conf_dict = {}
        res = None
        if item is None or not condition:
            return
        elif callable(item):
            res = self.__check_unicode( item() )

        elif isinstance(item, basestring):

            # если в строке уже есть апостроф, то будет очень больно.
            # поэтому replace
            res = "'%s'" % normalize( self.__check_unicode(item))

        elif isinstance(item, bool):
            res = str(item).lower()

        elif isinstance(item, (int, float, decimal.Decimal, long)):
            res = item

        elif isinstance(item, datetime.date):
            res = "'%s'" % date2str(item, settings.DATE_FORMAT or '%d.%m.%Y')

        elif isinstance(item, dict):
            # рекурсивный обход вложенных свойств
            d_tmp = {}
            for k, v in item.items():
                prop = self._put_base_value(src_list = src_list, extjs_name = k,
                                            item = v, depth = depth + 1)
                if prop:
                    d_tmp[k] = prop[k]
            res = d_tmp

        elif hasattr(item, '__unicode__'):
            return self._put_base_value(
                src_list, extjs_name, unicode(item), condition, depth)
        else:
            # Эээээ... Выводится для себя
            raise ExtComponentException(u'Тип переданного параметра не '
                u'поддерживается: "%s":"%s"' % (extjs_name, item))

        if res is not None:
            conf_dict[extjs_name] = res
            if depth == 0:
                src_list.append(conf_dict)

            return conf_dict

    def _put_config_value(self, extjs_name, item, condition=True):
        """
        Добавляет значение в конфиг компонента ExtJs для последующей передачи в конструктор JS
        @param extjs_name: Оригинальное название атрибута в ExtJs
        @param item: Значение атрибута в М3
        @param condition: Условие добавления в конфиг. Бывает полезно чтобы не использовать лишний if
        """
        self._put_base_value(self._config_list, extjs_name, item, condition)

    def _put_params_value(self, extjs_name, item, condition=True):
        '''
        Обертка для упаковки детализированного конфига компонента
        '''
        self._put_base_value(self._param_list, extjs_name, item, condition)

    def _set_base_value(self, src_list, key, value):
        '''
        Устанавливает значение по ключу
        '''
        def set_value_to_dict(src_dict, key, value):
            '''
            Вспомогательная функция, позволяет рекурсивно собрать все вложенные
            структуры-словари
            '''
            for k, v in src_dict.items():
                if isinstance(v, dict):
                    res = set_value_to_dict(v, key, value)
                    if res:
                        return True
                elif k == key:
                    if value:
                        src_dict[k] = value
                    else:
                        src_dict[k] = '""'
                    return True
            return False

        for  item in src_list:
            assert isinstance(item, dict), 'Nested structure must be dict type'
            res = set_value_to_dict(item, key, value)
            if res:
                return True

        return False


    def _set_config_value(self, key, value):
        return self._set_base_value( self._config_list, key, value)

    def _set_params_value(self, key, value):
        return self._set_base_value( self._param_list, key, value)

    def _get_base_str(self, src_list):
        '''
        Возвращает структуру в json-формате
        @param src_list: Список словарей, словари могут быть вложенными
        Пример структуры:
        [
            {...},
            {...},
            {
                {...},
                {...},
            }
        ]
        '''
        def get_str_from_dict(src_dict):
            '''
            Вспомогательная функция, позволяет рекурсивно собрать все вложенные
            структуры-словари
            '''
            tmp_list = []
            for k, v in src_dict.items():
                if isinstance(v, dict):
                    tmp_list.append('%s:{%s}' % (k, get_str_from_dict(v) ) )
                else:
                    tmp_list.append('%s:%s' % (k,v) )
            return ','.join(tmp_list)

        tmp_list = []
        for  item in src_list:
            assert isinstance(item, dict), 'Nested structure must be dict type'
            tmp_list.append( get_str_from_dict(item) )

        return ','.join(tmp_list)

    def _get_config_str(self):
        '''
        Возвращает конфиг в формате json
        '''
        return self._get_base_str(self._config_list)

    def _get_params_str(self):
        '''
        Возрвращает доп. параметры в формате json
        '''
        return self._get_base_str(self._param_list)


    def nested_components(self):
        '''
        Метод получения списка внутренних (по отношению
        к текущему) компонентов.

        Данный метод следует переопределять в унаследованных классах
        '''
        return []


    def prepare_qnames(self):
        '''
        Метод вычисляет квалицицирующие имена контролов.

        Квалифицирующие имена не вычисляются неявно. Т.е. для получения
        qname контрола необходимо явно вызвать данный метод.

        Примеры того, как формируются квалифицирующие имена контролов см. в
        m3/src/tests/ui/ext_tests/tests.py (test case: QNamesTests)
        '''
        if self.qname:
            # квалицицирующие имена этого и вложенных в него контролов
            # типа были вычислены заранееы
            return

        # вычисляем квалицицирующее имя для текущего компонента.
        self.qname = self.__class__.__name__

        # очередь компонентов, для которых необходимо определить qnames
        # очередь состоит из кортежей (компонент, родительский компонент)
        queue = collections.deque([self,])

        # основной цикл, в котором происходит вычисление
        # квалифицирующих имен
        while len(queue) > 0:
            cmp = queue.popleft()
            # проверяем, может быть, квалифицирующее имя
            # уже было вычислено ранее
            if not cmp:
                continue

            if not cmp.qname:
                # формируем имя компонента на основе его типа, qname родительского контрола
                # и индекса внутри компонентов базового контрола
                pass

            # получаем вложенные компоненты
            nested = cmp.nested_components()
            # словарь, в котором в качестве ключей будут классы контролов,
            # а в значениях - количество контролов указанного типа.
            # это необходимо для того, чтобы формировать имена
            # типа ...__ExtButton0
            cmp_indicies = {}
            # формируем транспонированный словарь атрибутов
            # ключом будут вложенные атрибуты BaseExtComponent
            transposed_cmp_dict = {}
            for name, value in cmp.__dict__.iteritems():
                if isinstance(value, BaseExtComponent):
                    transposed_cmp_dict[value] = name

            for nested_cmp in nested:
                if nested_cmp and not nested_cmp.qname:
                    attr_name = transposed_cmp_dict.get(nested_cmp, '')
                    if attr_name:
                        # вложенный компонент присутствует в атрибутах
                        # родительского контейнера.
                        if '__' in attr_name and hasattr(cmp, attr_name + '_qname'):
                            qname = getattr(cmp, attr_name + '_qname')
                        else:
                            qname = attr_name
                        nested_cmp.qname = cmp.qname + '__' + qname
                    else:
                        component_index = cmp_indicies.get(nested_cmp.__class__, -1) + 1
                        nested_cmp.qname = cmp.qname + '__' + nested_cmp.__class__.__name__ + str(component_index)
                        cmp_indicies[nested_cmp.__class__] = component_index

                    # включаем компонент в очередь на дальнейшую обработку
                    queue.append(nested_cmp)

            # теперь мы должны пройтись по необработанным ранее компонентам и
            # выставить у них qname
            for cmp_in_attr, attr_name in transposed_cmp_dict.iteritems():
                if not cmp_in_attr.qname:
                    cmp_in_attr.qname = cmp.qname + '__' + attr_name

            # У ДАННОГО МЕХАНИЗМА ЕСТЬ ОДИН НЕПРИЯТНЫЙ САЙД ЭФФЕКТ.
            # в случае, если в атрибуты этого или одно из вложенных компонентов
            # попадет нечто левое унаследованное от BaseExtComponent, то его qname
            # будет заполнен некоторым значением.
            # чтобы избежать этого, возможно, стоит предусмотреть нечто, что будет
            # описывать именно те компоненты, которые подлежат обработке.
            # но хождение по этому нечту приведет к замедлению времени вычисления
            # квалифицирующих имен компонентов.

#===============================================================================
class ExtUIComponent(BaseExtComponent):
    '''
    Базовый класс для компонентов визуального интерфейса
    Наиболее походит на BoxComponent в ExtJS
    '''

    def __init__(self, *args, **kwargs):
        super(ExtUIComponent, self).__init__(*args, **kwargs)

        # Произвольные css стили для контрола
        self.style = {}

        # Будет ли отображаться
        self.hidden = False

        # Будет ли активен
        self.disabled = False

        # Высота и ширина
        self.height = self.width = None

        # Координаты по оси Х и Y для абсолютного позиционирования
        self.x = self.y = None

        # html содержимое
        self.html = None

        # Расположение компонента при использовании layout=border
        self.region = None

        # Количество занимаемых ячеек для layout=*box (vbox или hbox)
        self.flex = None

        # Максимальные и минимальные ширины и высоты
        self.max_height = self.min_height = self.max_width = self.min_width = None

        # Наименование
        self.name = None

        # Якорь
        self.anchor = None

        # CSS класс, который будет добавлен к компоненту
        self.cls = None

        # Использовать ли автоскрол
        self.auto_scroll = False

        # Включение автовысоты. Аналог height='auto'
        self.auto_height = False

        # Включение автоширины. Аналог width='auto'
        self.auto_width = False

        # Метка поля
        self.label = None

        # Скрыть label
        self.hide_label = False

        # CSS стиль для label
        self.label_style = {}

    def t_render_style(self):
        '''
        @deprecated: Использовать рендеринг в render_base_config
        '''
        return '{%s}' % ','.join(['"%s":"%s"' % (k, v) for k, v in self.style.items()])

    def render_base_config(self):
        '''
        Рендер базового конфига объекта
        '''
        super(ExtUIComponent, self).render_base_config()
        self._put_config_value('style', self.t_render_style, self.style)
        self._put_config_value('hidden', self.hidden, self.hidden)
        self._put_config_value('disabled', self.disabled, self.disabled)
        self._put_config_value('height', self.height)
        self._put_config_value('width', self.width)
        self._put_config_value('x', self.x)
        self._put_config_value('y', self.y)
        self._put_config_value('html', self.html)
        self._put_config_value('region', self.region)
        self._put_config_value('flex', self.flex)
        self._put_config_value('maxHeight', self.max_height)
        self._put_config_value('minHeight', self.min_height)
        self._put_config_value('maxWidth', self.max_width)
        self._put_config_value('minWidth', self.min_width)
        self._put_config_value('name', self.name)
        self._put_config_value('anchor', self.anchor)
        self._put_config_value('cls', self.cls)
        self._put_config_value('autoScroll', self.auto_scroll, self.auto_scroll)
        self._put_config_value('autoHeight', self.auto_height, self.auto_height)
        self._put_config_value('autoWidth', self.auto_width, self.auto_width)
        self._put_config_value('fieldLabel', self.label)
        if  self.label_style:
            self._put_config_value('labelStyle', self.t_render_label_style())
        self._put_config_value('hideLabel', self.hide_label, self.hide_label)

    def pre_make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        '''
        Выполняется перед методом make_read_only, определяет находится ли
        данный компонент в списке исключений(в список может передаваться имя объекта,
        или даже сам объект). Если компонент в списке исключенний, то
        действие метода становится противопложным.
        Т.е. если вызывали make_read_only - компонент не будет отключаться, и
        наоборот, если вызывали make_read_only(False) объект будет отключен.
        '''
        if ((self in exclude_list) or
            (hasattr(self,'name') and
             self.name and
             self.name in exclude_list)):
            access_off = not access_off
        return access_off

    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        '''
        @access_off - переменная регулирует вкл\выкл режима для чтения.
        @exclude_list - список, содержит в себе имена элементов,
        которые не надо выключать.
        Позволяет сделать компонент недоступным для изменения.
        Обязательно должен быть переопределен в наследуемых классах.
        При вызове метода без параметров, используется параметр по-умолчанию
        access_off=True, в этом случае метод делает компонент, и все контролы
        расположенные на нем неизменяемыми.
        make_read_only(False) соответственно делает компонент доступным для
        изменения, так же как и все контролы на нем.
        '''
        excp_name = self.__class__.__name__
        raise NotImplementedError(u'В компоненте %s не переопределен базовый метод.' % excp_name)
