# coding:utf-8
"""
Базовые окна редактирования
"""

from m3_ext.ui import windows
from m3_ext.ui import panels
from m3_ext.ui import controls


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
            handler='close'
        )

        self.buttons.extend([self.btn_save, self.btn_cancel])

        self._submit_action = None

    def frozen_size(self, width, height):
        """
        Устанавливает размер и заодно делает его минимально допустимым
        """
        self.width, self.height = width, height
        self.min_width, self.min_height = width, height

        # NR: property теперь не работают, надо переписывать submit_action
        # на form.url = urls.get_url(action)
        # в results тоже не получится это использовать, так как там нет окна,
        # там только его дочерние элементы
        # def _set_submit_action(self, value):
        #     """ Из переданного типа экшена пытается получить адрес для формы """
        #     if isinstance(value, str):
        #         self.form.url = ControllerCache.get_action_url(value)
        #
        #     elif isinstance(value, Action):
        #         self.form.url = value.get_absolute_url()
        #
        #     elif issubclass(value, Action):
        #         self.form.url = value.absolute_url()
        #
        # submit_action = property(
        #     lambda self: self._submit_action,
        #     _set_submit_action
        # )

# Удалено GearTableEditWindow. Используется только в закупках
