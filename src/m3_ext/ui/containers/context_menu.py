#coding: utf-8
'''
Created on 15.03.2010

@author: prefer
'''
from m3.ui.ext.base import ExtUIComponent
from base import BaseExtContainer
from m3.ui.ext.misc import ExtConnection

#===============================================================================
class ExtContextMenu(BaseExtContainer):
    '''
    Контекстное меню 
    '''
    __SEPARATOR = '"-"'

    def __init__(self, *args, **kwargs):
        super(ExtContextMenu, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-context-menu.js' #FIXME: Отрефакторить под внутриклассовый рендеринг

        # Список элементов меню
        self._items = []

        # TODO: В методе ExtContextMenuItem.render параметр container не используется
        # Но может передоваться
        self.container = None

        self.init_component(*args, **kwargs)

    def add_item(self, **kwargs):
        '''
        Добавляет элемент с параметрами **kwargs
        '''
        item = ExtContextMenuItem(**kwargs)
        self.items.append(item)
        return item

    def add_separator(self):
        '''
        Добавляет разделитель
        '''
        self.items.append(ExtContextMenuSeparator())

    def t_render_items(self):
        # FIXME: После отрефакторевания шаблона необходимо убрать префикс t_*
        res = []
        for item in self.items:
            if item == ExtContextMenu.__SEPARATOR:
                res.append(item)
            elif self.container:
                res.append(item.render(container=self.container))
            else:
                res.append(item.render())
        return '[%s]' % ','.join(res)

    @property
    def items(self):
        return self._items

    #---------------------------------------------------------------------------
    # Врапперы над событиями listeners[...]
    @property
    def handler_beforeshow(self):
        return self._listeners.get('beforeshow')

    @handler_beforeshow.setter
    def handler_beforeshow(self, value):
        self._listeners['beforeshow'] = value

#===============================================================================        
class ExtContextMenuItem(ExtUIComponent):
    '''
    Элементы контекстного меню     
    '''
    def __init__(self, *args, **kwargs):
        super(ExtContextMenuItem, self).__init__(*args, **kwargs)

        # Текст для отображения
        self.text = None

        # Идентификатор внутри меню
        self.item_id = None

        # Функция-обработчик
        self.handler = None

        # CSS класс иконок 
        self.icon_cls = None

        # Ссылка на меню, если имеется вложенное меню
        self.menu = None

        # FIXME: Что-то сомнительное. См. функцию render
        self.custom_handler = False

        # TODO: Написать и использовать отдельные классы: menucheckitem, etc.
        # этим параметром можно задавать тип элемента меню: menucheckitem, 
        # menutextitem, datemenu и т.п. В конфиге это задается через xtype. 
        # Если задать неправильно, то может быть ошибка!
        self.custom_itemtype = None

        self.init_component(*args, **kwargs)

    def render(self, container=None):
        # FIXME: container не используется
        res = ['text:"%s"' % self.text.replace('"', "&quot;")]
        if self.custom_itemtype:
            res.append('xtype: "%s"' % self.custom_itemtype)
        if self.icon_cls:
            res.append('iconCls: "%s"' % self.icon_cls)
        if self.disabled:
            res.append('disabled: true')
        if self.hidden:
            res.append('hidden: true')
        if self.item_id:
            res.append('itemId: "%s"' %self.item_id)
        if self.menu:
            res.append('menu: ' + self.menu.render())
        if self.handler:
            if self.custom_handler:
                res.append('handler: %s' % self.handler)
            else:
                if isinstance(self.handler, ExtConnection):
                    res.append('handler: function(){%s} ' % self.handler.render())
                else:
                    res.append('handler: %s' % self.handler)
        return '{%s}' % ','.join(res)


    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, *args, **kwargs)
        # Выключаем\включаем компоненты.
        self.disabled = access_off


#===============================================================================    
class ExtContextMenuSeparator(ExtUIComponent):
    '''
    Разделитель элементов в меню
    @deprecated: В контекстном меню есть специальный метод и отдельный класс 
    в данном случае не нужен
    '''
    def __init__(self, *args, **kwargs):
        super(ExtContextMenuSeparator, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)

    def render(self, *args, **kwargs):
        return '"-"'

    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Заглшука.
        pass
