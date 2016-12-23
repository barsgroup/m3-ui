# coding: utf-8

from m3_ext.ui import all_components as ext
from m3_ext.ext_demo.actions.base import DemoAction, Pack


@Pack.register
class UploadFieldsAction(DemoAction):
    """
    Пример контрола для поиска
    """
    title = u'ExtFileUploadField, ExtImageUploadField'

    def get_ui(self, request, context):
        window = ext.ExtWindow(title=u'Контролы загрузки файлов и картинок',
                               layout='form',
                               resizable=False,
                               padding=5)

        window.items.extend([
            ext.ExtFileUploadField(label=u'Выбор файла', anchor='99%'),
            ext.ExtImageUploadField(label=u'Выбор картинки', anchor='99%')
        ])

        return window
