#coding:utf-8
"""
"""

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
        'url',
        file_upload='fileUpload',
    )

    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.setdefault('base_cls', 'x-plain')
        self.setdefault('padding', '5px')

        # поле, которое будет под фокусом ввода после рендеринга формы

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

    def to_object(self, obj, exclusions=None):
        fields = self._get_all_fields(self)
        return to_object(obj, fields, exclusions)


class ExtPanel(BaseExtPanel):
    """
    Панель.
    Kак правило этот контрол включает другие компоненты для отображения
    """
    _xtype = 'panel'

    js_attrs = BaseExtPanel.js_attrs.extend(
        'collapsible',  # Возможность сворачивать панель
        'floatable',  # Позволять ли панели быть "плавающей", (см Ext.layout.BorderLayout.Region)
        body_border='bodyBorder',  # Показывать ли внутреннюю границу у элемента
        base_cls='baseCls',  # Базовый CSS класс, по умолчанию 'x-panel'
        body_cls='bodyCssClass',  # Дополнительный CSS класс тела панели
        auto_load='autoLoad',  # Автозагрузка контента
        auto_scroll='autoScroll',  # Скролл появляется автоматически
        title_collapse='titleCollapse',  # Сворачивать панель при щелчке на заголовке?
    )

    def __init__(self, *args, **kwargs):
        super(ExtPanel, self).__init__(*args, **kwargs)
        self.setdefault('collapsible', False)
        self.setdefault('body_border', False)
        self.setdefault('auto_scroll', True)
        self.setdefault('floatable', True)
        self.setdefault('title_collapse', False)


class ExtTitlePanel(ExtPanel):
    """
    Расширенная панель с возможностью добавления контролов в заголовок.
    """
    # TODO: Вернуться к этому контролу и поудалять отсюда методы, после того, как уточнить, что они нигде не используются
    # TODO: Пока код не рабочий, что-то странное надо засовывать в header
    _xtype = 'm3-title-panel'

    js_attrs = ExtPanel.js_attrs.extend(
        title_items='titleItems',
    )

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


class ExtTabPanel(BaseExtPanel):
    """
    Класс, отвечающий за работу TabPanel
    """

    # Возможности размещения табов
    TOP = 'top'
    BOTTOM = 'bottom'

    _xtype = 'tabpanel'
    js_attrs = BaseExtPanel.js_attrs.extend(
        'plain',  # Показывает панель вкладок без фонового изображения
        active_tab='activeTab',  # Активная вкладка
        enable_tab_scroll='enableTabScroll',  # Активный скрол у табов
        body_border='bodyBorder',  # Внутренняя граница
        deferred_render='deferredRender',  # Если True, то применяется lazy рендеринг табов

        # Если False, то TabPanel указывается фиксированная ширина, либо она подчиняется layout родителя
        auto_width='autoWidth',
        tab_position='tabPosition',  # Позиция отображения табов: возможные варианты TOP и BOTTOM
        tabs='items',  # deprecation: use items
    )

    deprecated_attrs = ExtPanel.deprecated_attrs + (
        'tabs',
    )

    def __init__(self, *args, **kwargs):
        super(ExtTabPanel, self).__init__(*args, **kwargs)
        self.setdefault('active_tab', 0)
        self.setdefault('enable_tab_scroll', True)
        self.setdefault('body_border', True)
        self.setdefault('border', True)
        self.setdefault('plain', False)
        self.setdefault('auto_width', True)
        self.setdefault('tab_position', self.TOP)

    def add_tab(self, **kwargs):
        panel = ExtPanel(**kwargs)
        self.tabs.append(panel)
        return panel


class ExtFieldSet(ExtPanel):
    """
    Объеденяет внутренние элементы и создает рамку для остальных контролов
    """

    _xtype = 'fieldset'

    js_attrs = ExtPanel.js_attrs.extend(
        'checkboxToggle',  # deprecation: use checkbox_toggle
        checkbox_toggle='checkboxToggle',
        checkbox_name='checkboxName',
    )

    deprecated_attrs = ExtPanel.deprecated_attrs + (
        'checkboxToggle',
    )

    def __init__(self, *args, **kwargs):
        super(ExtFieldSet, self).__init__(*args, **kwargs)
        self.setdefault('checkbox_toggle', False)
        self.setdefault('border', True)