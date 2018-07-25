# coding: utf-8
from __future__ import absolute_import

from m3_ext.ui.base import ExtUIComponent

from .base import BaseExtContainer


#==============================================================================
class ExtContainer(BaseExtContainer):
    """
    Класс, имитирующий работу Ext.Container
    """
    def __init__(self, *args, **kwargs):
        super(ExtContainer, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.Container'
        self.init_component(*args, **kwargs)

    @property
    def items(self):
        return self._items

    def render_base_config(self):
        super(ExtContainer, self).render_base_config()
        if self._items:
            self._put_config_value('items', self.t_render_items)

    def render(self):
        if 'overflow' not in self.style:
            # делается для хака IE иначе иногда дочерние элементы ведут себя
            # словно у них задано position: fixed т.е. начинаю неадекватничать
            self.style['overflow'] = 'hidden'
        assert getattr(self, '_ext_name'), (
            'Class %s is not define "_ext_name"' %
            self.__class__.__name__
        )

        self.pre_render()

        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')

        base_config = self._get_config_str()
        params = self._get_params_str()
        res = '%(ext_name)s({%(base_config)s},{%(params)s})' % {
            'ext_name': self._ext_name,
            'base_config': base_config,
            'params': params
        }

        return 'new %s' % res if not self._is_function_render else res


class ExtToolBar(BaseExtContainer):
    """
    Класс, имитирующий работу Ext.Toolbar
    """

    class Fill(object):
        def render(self):
            return '"->"'

    class Separator(object):
        def render(self):
            return '"-"'

    class Spacer(object):
        def __init__(self, width=2):
            self.width = width

        def render(self):
            return "{xtype: 'tbspacer', width: %d}" % self.width

    class TextItem(object):
        def __init__(self, text='', handler=None):
            self.text = text
            self.handler = handler

        def render(self):
            if self.handler:
                return '{text:"%s", handler: %s}' % (self.text, self.handler)
            else:
                return '"%s"' % self.text

    def __init__(self, *args, **kwargs):
        super(ExtToolBar, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.Toolbar'
        self._items = []
        self.init_component(*args, **kwargs)

    def t_render_items(self):
        res = []
        for item in self.items:
            # Если объект структуры классов, то пусть сам рендерится,
            # если нет - так как есть.
            if hasattr(item, 'render') and callable(item.render):
                res.append(item.render())
            else:
                res.append(item)
        return '[%s]' % ','.join(res)

    def add_fill(self):
        """
        Переносит все последующие компоненты направо
        """
        self.items.append(ExtToolBar.Fill())

    def add_separator(self):
        """
        Добавляет разделитель
        """
        self.items.append(ExtToolBar.Separator())

    def add_spacer(self, width=2):
        """
        Добавляет дополнительное расстояние с шириной width
        :param width: расстояние
        :type width: int
        """
        self.items.append(ExtToolBar.Spacer(width))

    def add_text_item(self, text_item):
        """
        Добавляет текст
        :param text_item: текст
        :type text_item: unicode
        """
        self.items.append(ExtToolBar.TextItem(text_item))

    def add_menu(self, **kwargs):
        """
        Добавляет меню
        :param **kwargs: конфиг для меню
        """
        self.items.append(ExtToolbarMenu(**kwargs))

    @property
    def items(self):
        """
        Список вложенных компонентов
        """
        return self._items

    def render_base_config(self):
        super(ExtToolBar, self).render_base_config()
        if self.items:
            self._put_config_value('items', self.t_render_items)

    def render(self):
        assert getattr(self, '_ext_name'), (
            'Class %s is not define "_ext_name"' %
            self.__class__.__name__
        )

        self.pre_render()

        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        params = self._get_params_str()
        res = '%(ext_name)s({%(base_config)s},{%(params)s})' % {
            'ext_name': self._ext_name,
            'base_config': base_config,
            'params': params
        }

        return 'new %s' % res if not self._is_function_render else res


class ExtStaticToolBarItem(ExtUIComponent):
    """
    :deprecated: Нужно использовать встроенные подклассы в качестве элементов

    Преднастроенные элементы в тулбаре
    @TODO: Для чего нужнен отдельный класс, если задача может решится методами
    тулбара?
    """
    def __init__(self, static_value='', *args, **kwargs):
        super(ExtStaticToolBarItem, self).__init__(*args, **kwargs)
        self.static_value = static_value
        self.init_component(*args, **kwargs)

    def render(self):
        return self.static_value

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        pass


class ExtTextToolBarItem(ExtUIComponent):
    """
    :deprecated: Нужно использовать встроенные подклассы в качестве элементов

    Текстовый элемент в тулбаре
    @TODO: Для чего нужнен отдельный класс, если задача может решится методами
    тулбара?
    """
    def __init__(self, static_value='', *args, **kwargs):
        super(ExtTextToolBarItem, self).__init__(*args, **kwargs)
        self.text = None
        self.init_component(*args, **kwargs)

    def render(self):
        return "{xtype: 'tbtext', text: '%s'}" % self.text

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        pass


class ExtPagingBar(BaseExtContainer):
    """
    Класс, имитирующий работу Ext.PagingToolbar
    """
    def __init__(self, *args, **kwargs):
        super(ExtPagingBar, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.PagingToolbar'

        self.page_size = 25
        self.display_message = u'Показано записей {0} - {1} из {2}'
        self.display_info = True
        self.empty_message = u'Нет записей'
        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(ExtPagingBar, self).render_base_config()
        self._put_config_value('pageSize', self.page_size)
        self._put_config_value('displayInfo', self.display_info)
        self._put_config_value('displayMsg', self.display_message)
        self._put_config_value('emptyMsg', self.empty_message)

    def render(self):
        assert getattr(self, '_ext_name'), (
            'Class %s is not define "_ext_name"' %
            self.__class__.__name__
        )

        self.pre_render()

        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        params = self._get_params_str()
        res = '%(ext_name)s({%(base_config)s},{%(params)s})' % {
            'ext_name': self._ext_name,
            'base_config': base_config,
            'params': params
        }

        return 'new %s' % res if not self._is_function_render else res


class ExtCountFreePagingBar(ExtPagingBar):
    """ Пагинатор не требующий общего количества записей """

    def __init__(self, *args, **kwargs):
        super(ExtCountFreePagingBar, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.m3.CountFreePagingToolbar'
        self.display_message = u'Показано записей {0} - {1}'


class ExtToolbarMenu(ExtUIComponent):
    """
    Класс, позволяющий легко вставлять меню в ToolBar
    """
    def __init__(self, *args, **kwargs):
        super(ExtToolbarMenu, self).__init__(*args, **kwargs)
        self.text = None
        self.icon_cls = None
        self.tooltip_text = None
        self.menu = None
        self.init_component(*args, **kwargs)

    def render(self):
        res = 'id:"%s"' % self.client_id
        if self.text:
            res += ',text: "%s"' % self.text
        if self.icon_cls:
            res += ',iconCls: "%s"' % self.icon_cls
        if self.tooltip_text:
            res += ',tooltip: "%s"' % self.tooltip_text
        if self.menu:
            res += ',menu: %s' % self.menu.render()

        return '{%s}' % res

    def _make_read_only(
            self, access_off=True, exclude_list=(), *args, **kwargs):
        if self.menu:
            self.menu.make_read_only(
                access_off, exclude_list, *args, **kwargs)


class ExtRadioGroup(BaseExtContainer):
    """
    Компонент-контейнер для радио-полей
    """

    def __init__(self, *args, **kwargs):
        super(ExtRadioGroup, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.form.RadioGroup'

        # количество колонок в контейнере
        self.columns = None
        self.label = None

        self.init_component(*args, **kwargs)

    @property
    def items(self):
        return self._items

    def render_base_config(self):
        super(ExtRadioGroup, self).render_base_config()
        if self.items:
            self._put_config_value('items', self.t_render_items)
        if self.columns:
            self._put_config_value('columns', self.columns)

    def render(self):
        try:
            self.render_base_config()
        except Exception as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        return 'new %s({%s})' % (self._ext_name, base_config)
