# coding:utf-8
"""
Базовые окна редактирования

Created on 14.12.2010

@author: akvarats
"""

from m3_ext.ui import windows
from m3_ext.ui import panels
from m3_ext.ui import controls
from m3_ext.ui import containers
from m3.actions import Action, ControllerCache


class GearEditWindow(windows.ExtEditWindow):
    """
    Окно редактирования, в котором лежит форма
    и в котором есть кнопки OK и Отмена.
    Размеры окна по умолчанию 600x400
    """
    def __init__(self, *args, **kwargs):
        super(GearEditWindow, self).__init__(*args, **kwargs)

        self.frozen_size(600, 400)
        self.title = u'Не забудь написать заголовок'

        self.form = panels.ExtForm()

        self.btn_save = controls.ExtButton(
            text=u'Сохранить',
            handler='submitForm'
        )
        self.btn_cancel = controls.ExtButton(
            name='cancel_btn',
            text=u'Отмена',
            handler='cancelForm'
        )

        self.buttons.extend([self.btn_save, self.btn_cancel])

        self._submit_action = None

    def frozen_size(self, width, height):
        """
        Устанавливает размер и заодно делает его минимально допустимым
        """
        self.width, self.height = width, height
        self.min_width, self.min_height = width, height

    def _set_submit_action(self, value):
        """ Из переданного типа экшена пытается получить адрес для формы """
        if isinstance(value, str):
            self.form.url = ControllerCache.get_action_url(value)
        elif isinstance(value, Action):
            self.form.url = value.get_absolute_url()
        elif issubclass(value, Action):
            self.form.url = value.absolute_url()

    submit_action = property(
        lambda self: self._submit_action,
        _set_submit_action
    )


class GearTableEditWindow(GearEditWindow):
    """
    Окно редактирования с лежащим внутри табличным контейнером.

    Количество строк и столбцов необходимо
    передавать через параметры конструкта:
    * columns: количество столбцов (по умолчаию - 2)
    * rows: количество строк (по умолчанию - 4)
    """
    def __init__(self, columns=2, rows=4, *args, **kwargs):
        super(GearTableEditWindow, self).__init__(*args, **kwargs)

        self.table = containers.ExtContainerTable(columns=columns, rows=rows)
        self.form.items.append(self.table)
