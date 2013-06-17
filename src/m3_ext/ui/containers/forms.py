#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

import datetime
import decimal
import os
import json

from PIL import Image # require PIL module 

from django.core.files.base import ContentFile
from django.conf import settings

from m3.ui.ext import render_template
from m3.ui.ext.fields.base import BaseExtField
from m3.ui.ext.fields import (ExtNumberField, 
                              ExtStringField, 
                              ExtDateField,
                              ExtCheckBox, ExtComboBox, ExtTimeField, ExtRadio,
                              ExtHiddenField,
                              ExtFileUploadField,ExtImageUploadField,
                              ExtDictSelectField, ExtMultiSelectField)

from base import BaseExtPanel
from m3.ui.ext.base import ExtUIComponent, BaseExtComponent
from m3.helpers import get_img_size, logger
from m3.helpers.datastructures import TypedList
from m3.ui.actions.interfaces import ISelectablePack, IMultiSelectablePack




#===============================================================================
from m3.ui.ext.fields.simple import ExtDateTimeField, ExtAdvTimeField

class ExtForm(BaseExtPanel):
    '''
    Форма, умеющая биндиться и делать сабмит по урлу
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-form.js' # TODO: отрефакторить под внутриклассовый рендеринг
        
        # Свой layout
        self.layout = 'form'
        
        # Отступ от внешнего контрола
        self.padding = None
        
        # url для сабмита
        self.url = None
        
        # Будут ли загружаться файлы
        self.file_upload = False
        
        # поле, которое будет под фокусом ввода после рендеринга формы
        self.focused_field = None               
        
        self.init_component(*args, **kwargs)
    
    def _get_all_fields(self, item, list = None):
        '''
        Возвращает список всех полей формы включая вложенные в контейнеры
        '''
        if list == None:
            list = []   
        if isinstance(item, BaseExtField):
            list.append(item)
            
        elif hasattr(item, 'items'):
            for it in item.items:
                self._get_all_fields(it, list)       
        return list
    
    def bind_to_request(self, request):
        '''
        Извлекает из запроса параметры и присваивает их соответствующим полям 
        формы
        '''
        assert request, 'Request must be define!'

        all_fields = self._get_all_fields(self)
        for field in all_fields:
            name = field.name
            if isinstance(field, ExtFileUploadField) or \
                isinstance(field, ExtImageUploadField):
                # Файлы нужно забирать из request.FILES
                field.memory_file = request.FILES.get(
                                        ExtFileUploadField.PREFIX + field.name)
            # возьмем только то, что есть в запросе
            if name in request.POST:
                value = request.POST.get(name)
                field.value = value
    
    #TODO необходимо добавить проверку на возникновение exception'ов
    def from_object(self, object, exclusion = []):
        '''
        Метод выполнения прямого связывания данных атрибутов объекта object и 
        полей текущей формы
        '''     
        
        def is_secret_token(value):
            ''' 
            Возвращает истину если значение поля содержит секретный ключ с 
            персональной информацией. Он не должен биндится, 
            т.к. предназначен для обработки в personal.middleware 
            '''
            return unicode(value)[:2] == u'##'
        
        def _assign_value(value, item):
            '''
            Конвертирует и присваивает значение value в соответствии типу item.
            '''
            if isinstance(item, ExtStringField):
                if value:
                    item.value = unicode(value)
                else:
                    item.value = u''

            elif isinstance(item, ExtAdvTimeField):
                item.value = '%02d:%02d:%02d' % (value.hour,value.minute, value.second)\
                    if not is_secret_token(value) else unicode(value)

            elif isinstance(item, ExtDateTimeField):
                if isinstance(value, datetime.datetime):
                    item.value = '%02d.%02d.%04d %02d:%02d:%02d' % (value.day,value.month,value.year,value.hour,value.minute,value.second)
                elif isinstance(value, datetime.date):
                    item.value = '%02d.%02d.%04d 00:00:00' % (value.day,value.month,value.year)
                else:
                    item.value = value

            elif isinstance(item, ExtDateField):
                if isinstance(value, (datetime.date, datetime.datetime)):
                    #item.value = value.strftime('%d.%m.%Y') \
                    # для дат, до 1900 года метод выше не работает
                    item.value = '%02d.%02d.%04d' % (value.day,value.month,value.year) \
                        if not is_secret_token(value) else unicode(value)   
                else:
                    item.value = value
                      
            elif isinstance(item, ExtTimeField):
                #item.value = value.strftime('%H:%M') \
                # для дат, до 1900 года метод выше не работает
                if isinstance(value, (datetime.time, datetime.datetime)):
                    item.value = '%02d:%02d' % (value.hour,value.minute) \
                        if not is_secret_token(value) else unicode(value)
                else:
                    item.value = value

            elif isinstance(item, ExtCheckBox):
                item.checked = True if value else False
            elif isinstance(item, ExtRadio):
                item.checked = (value == item.value)
            elif isinstance(item, ExtMultiSelectField):
                # У поля выбора может быть сзязанный с ним пак
                bind_pack = getattr(item, 'pack', None) or getattr(item, 'bind_pack', None)
                if bind_pack:
                    assert isinstance(bind_pack, IMultiSelectablePack), 'Pack %s must provide IMultiSelectablePack interface' % bind_pack
                    item.value = bind_pack.get_display_dict(value, value_field=item.value_field, display_field=item.display_field)
            elif isinstance(item, ExtDictSelectField):
                # У поля выбора может быть сзязанный с ним пак
                # TODO после окончательного удаления метода configure_by_dictpack в ExtDictSelectField
                # нужно удалить проверку на 'bind_pack'
                bind_pack = getattr(item, 'pack', None) or getattr(item, 'bind_pack', None)
                if bind_pack and value:
                    assert isinstance(bind_pack, ISelectablePack), 'Pack %s must provide ISelectablePack interface' % bind_pack
                    if hasattr(bind_pack, 'get_record'):
                        item.set_value_from_model(bind_pack.get_record(value))
                    else:
                        item.default_text = bind_pack.get_display_text(value, item.display_field)
#                    # Нельзя импортировать, будет циклический импорт
#                    #assert isinstance(item.bind_pack, BaseDictionaryActions)
#                    row = bind_pack.get_row(value)
#                    # Может случиться что в источнике данных bind_pack 
#                    # не окажется записи с ключом id
#                    # Потому что источник имеет заведомо неизвестное происхождение
#                    if row != None:
#                        default_text = getattr(row, item.display_field)
#                        # getattr может возвращать метод, например verbose_name
#                        if callable(default_text):
#                            item.default_text = default_text()
#                        else:
#                            item.default_text = default_text
                item.value = value
            elif isinstance(item, ExtComboBox) and hasattr(item, 'bind_rule_reverse'):
                # Комбобокс как правило передает id выбранного значения. 
                #Его не так просто  преобразовать в тип объекта, 
                # Поэтому нужно использовать либо трансляцию значений, 
                #либо вызывать специальную функцию внутри экземпляра комбобокса.
                if callable(item.bind_rule_reverse):
                    item.value = unicode(item.bind_rule_reverse(value))
                elif isinstance(item.bind_rule_reverse, dict):
                    item.value = unicode(item.bind_rule_reverse.get(value))
                else:
                    raise ValueError('Invalid attribute type bind_rule_reverse. \
                        Must be a function or a dict.')
                    
            elif isinstance(item, ExtFileUploadField) or \
                isinstance(item, ExtImageUploadField):
                item.value = unicode(value)
                # Относительную URL ссылку до статики
                
                if hasattr(settings, 'MEDIA_URL'):                    
                    item.file_url = '%s/%s' % (settings.MEDIA_URL,  unicode(value) )
                else:
                    item.file_url = None
                    
                # Прибиндим оригинальные размеры thumbnail
                if isinstance(item, ExtImageUploadField):
                    if hasattr(settings, 'MEDIA_ROOT') and item.thumbnail:
                        ffile = os.path.join(settings.MEDIA_ROOT, unicode(value))
                        dir = os.path.dirname(ffile)
                        file_name = os.path.basename(ffile)
                        
                        thumb_file = os.path.join(dir, 
                            ExtImageUploadField.MIN_THUMBNAIL_PREFIX + file_name)
                        if os.path.exists(thumb_file):
                            thumb = Image.open(thumb_file)
                            item.thumbnail_size = thumb.size
                        
            else:
                item.value = unicode(value)

        def get_value(obj, names):
            '''
            Ищет в объекте obj поле с именем names и возвращает его значение. 
            Если соответствующего поля не оказалось, то возвращает None
            
            names задается в виде списка, т.о. если его длина больше единицы, 
            то имеются вложенные объекты и их надо обработать
            '''

            # hasattr не работает для dict'a
            has_attr = hasattr(obj, names[0]) if not isinstance(obj, dict) else names[0] in obj 
            if has_attr:
                if len(names) == 1:
                    if isinstance(obj, dict):
                        return obj[names[0]], True
                    else:
                        value = getattr(obj, names[0])
                        return value() if callable(value) else value, True
                else:
                    nested = getattr(obj, names[0]) if not isinstance(obj, dict) else obj[names[0]]
                    return get_value(nested, names[1:])
            return None, False

        all_fields = self._get_all_fields(self)
        for field in all_fields:
            if not field.name:
                continue
            assert not isinstance(field.name, unicode), 'The names of all fields \
                must not be instance of unicode'
            assert isinstance(field.name, str) and len(field.name) > 0, \
                  'The names of all fields must be set for a successful \
                      assignment. Check the definition of the form.'
            # заполним атрибуты только те, которые не в списке исключаемых
            if not field.name in exclusion:
                
                names = field.name.split('.')                
                new_val, has_attr = get_value(object, names)
                if has_attr:
                    new_val = new_val if new_val is not None else ''
                    _assign_value(new_val, field)
        

    #TODO необходимо добавить проверку на возникновение exception'ов
    def to_object(self, object, exclusion = []):
        '''
        Метод выполнения обратного связывания данных.
        '''       
        def _save_image(obj, name, field):
            # Работа с изображением или файлом
            if hasattr(obj, name):
                l_field = getattr(obj, name)
                if l_field and os.path.exists(l_field.path) and \
                    (os.path.basename(l_field.file.name)).lower() != (field.value).lower():
                    # Сначало нужно удалить thumbnail картинки
                    if isinstance(field, ExtImageUploadField) and \
                        field.thumbnail:
                        current_dir = os.path.dirname(l_field.path)
                        basename = os.path.basename(l_field.path)
                                                
                        thumb_prefix = (ExtImageUploadField.MIDDLE_THUMBNAIL_PREFIX, 
                                      ExtImageUploadField.MIN_THUMBNAIL_PREFIX, 
                                      ExtImageUploadField.MAX_THUMBNAIL_PREFIX,)
                            
                        for prefix in thumb_prefix:
                            thumb = os.path.join(current_dir, prefix + basename)
                    
                            if os.path.exists(thumb):
                                os.remove(thumb)
                    
                    # Файл изменился, удаляем старый     
                    l_field.delete(save=False)
                        
                if field.memory_file:
                    cont_file = ContentFile(field.memory_file.read())
                    name_file = field.memory_file.name
                    
                    l_field = getattr(obj, name)
                    l_field.save(name_file, cont_file, save = False)
                    
                    if isinstance(field, ExtImageUploadField):
                        try:
                            img = Image.open(l_field.path)
                        except IOError:
                            # Кроме логирования ничего не нужно
                            logger.exception()  
                            return                      
                              
                        width, height = img.size
                        max_width, max_height = field.image_max_size
                        
                        # Обрезаем изображение, если нужно
                        if width > max_width or height > max_height:
                
                            curr_width, curr_height = \
                                get_img_size(field.image_max_size, img.size)
                                
                            new_img = img.resize((curr_width, curr_height),
                                       Image.ANTIALIAS)
                            new_img.save(l_field.path)
                        
                        if isinstance(field, ExtImageUploadField) and \
                            field.thumbnail and field.memory_file:
                            current_dir = os.path.dirname(l_field.path)
                        
                            # А так же нужно сохранять thumbnail картинки
                            # Состовляем лист thumbnail_size'ов
                            thumbnails = [(field.min_thumbnail_size, 
                                           ExtImageUploadField.MIN_THUMBNAIL_PREFIX  )]
                            
                            if field.middle_thumbnail_size:
                                thumbnails.append( (field.middle_thumbnail_size, 
                                                    ExtImageUploadField.MIDDLE_THUMBNAIL_PREFIX   ))
                            
                            if field.max_thumbnail_size:
                                thumbnails.append( (field.max_thumbnail_size, 
                                                    ExtImageUploadField.MAX_THUMBNAIL_PREFIX  ))
                                                        
                            for size, prefix in thumbnails:                            
                                                                                        
                                # Генерируем thumbnails
                                thumb_zise = get_img_size(size, img.size)                                                                                                                                        
                                new_img = img.resize(thumb_zise, Image.ANTIALIAS)
                                
                                base_name = os.path.basename(l_field.path)
                                tmb_path = os.path.join(current_dir, 
                                        prefix + base_name)
                                new_img.save(tmb_path)    

        def set_field(obj, names, value, field=None):
            '''
            Ищет в объекте obj поле с именем names и присваивает значение value. 
            Если соответствующего поля не оказалось, то оно не создается
            
            names задается в виде списка, т.о. если его длина больше единицы, 
            то имеются вложенные объекты
            '''

            # hasattr не работает для dict'a
            has_attr = hasattr(obj, names[0]) if not isinstance(obj, dict) else names[0] in obj 
            if has_attr:
                if len(names) == 1:
                    if isinstance(obj, dict):
                        obj[names[0]] = value        
                    elif isinstance(field, ExtFileUploadField) or \
                        isinstance(field, ExtImageUploadField):
                        _save_image(obj, names[0], field)
                        
                    else:
                        # Для id нельзя присваивать пустое значение! 
                        # Иначе модели не будет сохраняться
                        if names[0] == 'id' and value == '':
                            return

                        setattr(obj, names[0], value)
                else:
                    nested = getattr(obj, names[0]) if not isinstance(obj, dict) else obj[names[0]]
                    set_field(nested, names[1:], value, field)

        def try_to_int(value, default=None):
            ''' Пробует преобразовать value в целое число, 
            иначе возвращает default '''
            if not value:
                return default

            try:
                return int(value)
            except ValueError:
                return value

        def try_to_list(value):
            '''
            Пробует преобразовать value в список
            '''
            if not value:
                return []

            try:
                return json.loads(value)
            except ValueError:
                return value

        def convert_value(item):
            '''Берет значение item.value, 
            и конвертирует его в соответствии с типом item'a
            '''
            val = item.value
            if isinstance(item, ExtNumberField):            
                if val:
                    # для языков, где decimal разделяются не точкой
                    if item.decimal_separator: 
                        val = val.replace(item.decimal_separator, '.')
                    try:
                        val = int(val)
                    except ValueError:
                        try:
                            val = decimal.Decimal(val)
                        except decimal.InvalidOperation:
                            val = None
                else:
                    val = None
            elif isinstance(item, ExtStringField):
                val = unicode(val) if val is not None else None
            elif isinstance(item, ExtAdvTimeField):
                if val and val.strip():
                    d = datetime.datetime.strptime(val, "%H:%M:%S")
                    val = d.time()
                else:
                    val = None
            elif isinstance(item, ExtDateTimeField):
                if val and val.strip():
                    val = datetime.datetime.strptime(val, '%d.%m.%Y %H:%M:%S')
                else:
                    val = None
            elif isinstance(item, ExtDateField):
                #TODO уточнить формат дат
                if val and val.strip():
                    d = datetime.datetime.strptime(val, '%d.%m.%Y')
                    val = d.date()
                else:
                    val = None
            elif isinstance(item, ExtTimeField):
                if val and val.strip():
                    d = datetime.datetime.strptime(val, '%H:%M')
                    val = datetime.time(d.hour, d.minute, 0)
                else:
                    val = None
            elif isinstance(item, ExtCheckBox):
                val = True if val == 'on' else False
            elif isinstance(item, ExtComboBox):
                # Комбобокс как правило передает id выбранного значения. 
                #Его не так просто преобразовать в тип объекта, 
                # т.к. мы ничего не знаем о структуре объекта.
                # Поэтому нужно использовать либо трансляцию значений, 
                # либо вызывать специальную функцию внутри экземпляра комбобокса.
                if hasattr(item, 'bind_rule'):
                    if callable(item.bind_rule):
                        val = item.bind_rule(val)
                    elif isinstance(item.bind_rule, dict):
                        val = item.bind_rule.get(val)
                    else:
                        raise ValueError('Invalid attribute type bind_rule. \
                                Must be a function or a dict.')
                else:
                    val = try_to_int(val)

            elif isinstance(item, ExtMultiSelectField):
                val = try_to_list(val)

            elif isinstance(item, ExtDictSelectField):
                val = try_to_int(val)
                
            elif isinstance(item, ExtHiddenField):
                if item.type == ExtHiddenField.INT:
                    val = try_to_int(val)
                elif item.type == ExtHiddenField.STRING:
                    val = unicode(val)           
            return val

        # список m2m полей модели нужен, чтобы проверить возможность их сохранения
        try:
            list_of_m2m = [x[0].name for x in object._meta.get_m2m_with_model()]
        except AttributeError:
            list_of_m2m = []

        # Присваиваем атрибутам связываемого объекта соответствующие поля формы
        all_fields = self._get_all_fields(self)
        for field in all_fields:
            if not field.name:
                continue
            assert not isinstance(field.name, unicode), 'The names of all fields \
                must not be instance of unicode'
            assert isinstance(field.name, str) and len(field.name) > 0, \
                  'The names of all fields must be set for a successful \
                      assignment. Check the definition of the form.'

            # заполним атрибуты только те, которые не в списке исключаемых
            if not field.name in exclusion:
                # запрещаем пытаться сохранять many2many для объекта без pk
                if hasattr(object, 'pk'):
                    if object.pk is None and field.name in list_of_m2m:
                        raise ValueError(' '.join(
                            ["'%s' instance needs to have a primary" % object.__class__.__name__,
                             "key value before a many-to-many relationship can be used."]))
                
                names = field.name.split('.')
                set_field(object, names, convert_value(field), field)
     
    @property
    def items(self):       
        return self._items
    
    def pre_render(self):
        super(ExtForm, self).pre_render()
        if not self.focused_field:
            childs = self._get_all_fields(self)
            for child in childs:
                if isinstance(child, BaseExtField) and not isinstance(child, ExtHiddenField) and not child.hidden:
                    self.focused_field = child
                    break

#===============================================================================
class ExtPanel(BaseExtPanel):
    '''
    Панель. Kак правило этот контрол включает другие компоненты для отображения
    '''
    def __init__(self, *args, **kwargs):
        super(ExtPanel, self).__init__(*args, **kwargs)
        
        # Отступ от внешних границ
        self.padding = None
        
        # Возможность сворачивать панель
        self.collapsible = False                
        
        # Показывать ли внутреннюю границу у элемента
        self.body_border = True

        # Базовый CSS класс, по умолчанию 'x-panel'
        self.base_cls = ''
        
        # Данное свойства - приватное в контексте extjs
        # Переопределяет стиль панели
        self.body_cls = ''
        
        # Автозагрузка контента
        self.auto_load = None
        
        self.auto_scroll = True
        # Позволять ли панели быть "плавающей" (см Ext.layout.BorderLayout.Region)
        self.floatable = True
        # Сворачивать панель при щелчке на заголовке?
        self.title_collapse = False
        
        self.init_component(*args, **kwargs)
    
    def render_base_config(self):
        """
        Точная имитация рендера из покойного шаблона
        """
        super(ExtPanel, self).render_base_config()
        self._put_config_value('padding', self.padding)
        self._put_config_value('collapsible', self.collapsible, self.collapsible)
        self._put_config_value('bodyBorder', self.body_border, not self.body_border)
        self._put_config_value('baseCls', self.base_cls, self.base_cls)
        self._put_config_value('bodyCfg', {'cls': self.body_cls}, self.body_cls)
        self._put_config_value('autoLoad', self.auto_load)
        self._put_config_value('autoScroll', self.auto_scroll, self.auto_scroll)
        if self._items:
            self._put_config_value('items', self.t_render_items)
        self._put_config_value('floatable', self.floatable, not self.floatable)
        self._put_config_value('titleCollapse', self.title_collapse, self.title_collapse)
        
    def render(self):
        self.pre_render() # Тут рендерится контекст
        self.render_base_config() # Тут конфиги
        self.render_params() # Пусто
        base_config = self._get_config_str()
        return 'new Ext.Panel({%s})' % base_config

    def render_globals(self):
        """
        Рендерит и возвращает js-код, который помещен в template_globals
        """
        self.pre_render_globals()
        if self.template_globals:
            return render_template(self.template_globals,
                    {'component': self, 'self' : self, 'panel': self})

        return ''
    
    @property
    def items(self):
        return self._items

#===============================================================================
class ExtTitlePanel(ExtPanel):
    '''
    Расширенная панель с возможностью добавления контролов в заголовок.    
    '''
    def __init__(self, *args, **kwargs):
        super(ExtTitlePanel, self).__init__(*args, **kwargs)
        self.template = "ext-panels/ext-title-panel.js" #TODO: Отрефакторить под внутриклассовый рендеринг 
        self.__title_items = TypedList(type=ExtUIComponent, on_after_addition=
            self._on_title_after_addition, on_before_deletion=
            self._on_title_before_deletion, on_after_deletion=
            self._on_title_after_deletion)
        self.init_component(*args, **kwargs)

    def _update_header_state(self):
        # Заголовок может быть только в том случае, если есть текстовое значение,
        # либо имеются компоненты
        self.header = self.title or (not self.title and len(self.__title_items))

    def _on_title_after_addition(self, component):
        # Событие вызываемое после добавления элемента в заголовок
        self.items.append(component)
        self._update_header_state() 

    def _on_title_before_deletion(self, component):
        # Событие вызываемое перед удалением элемента из заголовка
        self.items.remove(component)

    def _on_title_after_deletion(self, success):
        # Событие вызываемое после удаления элемента из заголовка
        self._update_header_state()

    def t_render_items(self):
        """Дефолтный рендеринг вложенных объектов."""
        return ",".join([item.render() for item in self._items if
                         item not in self.__title_items])

    def t_render_title_items(self):
        """Дефолтный рендеринг вложенных объектов заголовка."""
        return ",".join([item.render() for item in self.__title_items])

    @property
    def title_items(self):
        return self.__title_items

    def render(self):
        #WARNING!
        # Не удалось перевести этот компонент на полность питонячий рендер
        # Потому что в ЭПК шаблон этого компонента переопределяется
        # И дабы не ломать все их формы, приходится оставлять старый рендер
        # Посылаю им лучи ненависти и поноса!
        return BaseExtComponent.render(self)


#===============================================================================
class ExtTabPanel(BaseExtPanel):
    '''
    Класс, отвечающий за работу TabPanel
    '''
    
    # Возможности размещения табов
    TOP = 'top'
    BOTTOM = 'bottom'
    
    def __init__(self, *args, **kwargs):
        super(ExtTabPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-tab-panel.js' #TODO: Отрефакторить под внутриклассовый рендеринг
        
        # Активная вкладка
        self.active_tab = 0
        
        # Активный скрол у табов
        self.enable_tab_scroll = True       
        
        # Внутренняя граница
        self.body_border = True
        
        # Если True, то применяется lazy рендеринг табов
        self.deferred_render = None
        
        # Показывает панель вкладок без фонового изображения
        self.plain = False
        
        # Если False, то TabPanel указывается фиксированная ширина,
        # либо она подчиняется layout родителя
        self.auto_width = True
        
        # Табы
        self._items = TypedList(type=BaseExtPanel)
        
        # Позиция отображения табов: возможные варианты TOP и BOTTOM
        self.tab_position = self.TOP
        
        self.init_component(*args, **kwargs)

    def add_tab(self, **kwargs):
        panel = ExtPanel(**kwargs)
        self.tabs.append(panel)
        return panel

    @property
    def tabs(self):
        return self._items

    @property
    def items(self):
        return self._items


#===============================================================================    
class ExtFieldSet(ExtPanel):
    '''
    Объеденяет внутренние элементы и создает рамку для остальных контролов
    '''
    def __init__(self, *args, **kwargs):
        self.checkbox_toggle = False
        # имя чекбокса, используется в случае checkboxToggle = True
        self.checkbox_name = None
        super(ExtFieldSet, self).__init__(*args, **kwargs)

    def render_base_config(self):
        super(ExtFieldSet, self).render_base_config()
        self._put_config_value('checkboxToggle', self.checkbox_toggle)
        self._put_config_value('checkboxName', self.checkbox_name)

    def render(self):
        self.pre_render() # Тут рендерится контекст
        self.render_base_config() # Тут конфиги
        self.render_params() # Пусто
        base_config = self._get_config_str()
        return 'new Ext.form.FieldSet({%s})' % base_config

    @property
    def checkboxToggle(self):
        """
        deprecated
        """
        return self.checkbox_toggle

    @checkboxToggle.setter
    def checkboxToggle(self, value):
        """
        deprecated
        """
        self.checkbox_toggle = value
