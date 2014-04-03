#coding:utf-8
"""
Created on 25.02.2010

@author: akvarats
"""

from m3_ext.ui.base import BaseExtComponent
from m3_ext.ui.containers.base import BaseExtPanel
from m3_ext.ui.helpers import bind_to_request, from_object, to_object


def _is_field(obj):
    from m3_ext.ui.fields.base import BaseExtField

    return isinstance(obj, BaseExtField)


class ExtForm(BaseExtPanel):
    """
    Форма, умеющая биндиться и делать сабмит по урлу
    """

    _xtype = 'form'

    js_attrs = BaseExtPanel.js_attrs.extend(
        'padding',
        'url',
        ('file_upload', 'fileUpload'),
    )

    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.setdefault('layout', self.FORM)

        # поле, которое будет под фокусом ввода после рендеринга формы
        # TODO: focused_field - удалено

    def _get_all_fields(self, item, lst=None):
        """
        Возвращает список всех полей формы включая вложенные в контейнеры
        """
        if lst is None:
            lst = []
        if _is_field(item):
            lst.append(item)

        elif hasattr(item, 'items'):
            for it in item.items:
                self._get_all_fields(it, lst)
        return lst

    def bind_to_request(self, request):
        fields = self._get_all_fields(self)
        return bind_to_request(request, fields)

    def from_object(self, obj, exclusion=None):
        fields = self._get_all_fields(self)
        return from_object(obj, fields, exclusion)

    def to_object(self, obj, exclusion=None):
        fields = self._get_all_fields(self)
        return to_object(obj, fields, exclusion)


class ExtPanel(BaseExtPanel):
    """
    Панель.
    Kак правило этот контрол включает другие компоненты для отображения
    """
    _xtype = 'panel'

    js_attrs = BaseExtPanel.js_attrs.extend(
        'title',
        'padding',  # Отступ от внешних границ
        'collapsible',  # Возможность сворачивать панель
        ('body_border', 'bodyBorder'),  # Показывать ли внутреннюю границу у элемента
        ('base_cls', 'baseCls'),  # Базовый CSS класс, по умолчанию 'x-panel'
        ('body_cls', 'bodyCls'),  # Данное свойства - приватное в контексте extjs, переопределяет стиль панели
        ('auto_load', 'autoLoad'),  # Автозагрузка контента
        ('auto_scroll', 'autoScroll'),  # Скролл появляется автоматически
        'floatable',  # Позволять ли панели быть "плавающей", (см Ext.layout.BorderLayout.Region)
        ('title_collapse', 'titleCollapse'),  # Сворачивать панель при щелчке на заголовке?
    )

    def __init__(self, *args, **kwargs):
        super(ExtPanel, self).__init__(*args, **kwargs)
        self.setdefault('collapsible', False)
        self.setdefault('body_border', True)
        self.setdefault('base_cls', '')
        self.setdefault('body_cls', '')
        self.setdefault('auto_scroll', True)
        self.setdefault('floatable', True)
        self.setdefault('title_collapse', False)


class ExtTitlePanel(ExtPanel):
    """
    Расширенная панель с возможностью добавления контролов в заголовок.
    """

    def __init__(self, *args, **kwargs):
        super(ExtTitlePanel, self).__init__(*args, **kwargs)
        self.template = "ext-panels/ext-title-panel.js"
        self.__title_items = []
        self.init_component(*args, **kwargs)

    def _update_header_state(self):
        # Заголовок может быть только в том случае,
        # если есть текстовое значение,
        # либо имеются компоненты
        self.header = self.title or (
            not self.title and len(self.__title_items))

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


class ExtTabPanel(BaseExtPanel):
    """
    Класс, отвечающий за работу TabPanel
    """

    # Возможности размещения табов
    TOP = 'top'
    BOTTOM = 'bottom'

    def __init__(self, *args, **kwargs):
        super(ExtTabPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-tab-panel.js'

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
        self._items = []

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


class ExtFieldSet(ExtPanel):
    """
    Объеденяет внутренние элементы и создает рамку для остальных контролов
    """

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
        self.pre_render()  # Тут рендерится контекст
        self.render_base_config()  # Тут конфиги
        self.render_params()  # Пусто
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
