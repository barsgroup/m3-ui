# coding: utf-8

from base import Pack, UIAction
from m3_ext.ui import all_components as ext

__author__ = 'prefer'


@Pack.register
class UploadFieldsAction(UIAction):
    """
    Пример контрола для поиска
    """
    title = u'ExtFileUploadField, ExtImageUploadField'

    def get_ui(self, request, context):
        window = ext.ExtWindow(title=u'Контролы загрузки файлов и картинок',
                               layout='form',
                               resizable=False)

        window.items.extend([
            ext.ExtFileUploadField(anchor='99%'),
            ext.ExtImageUploadField(anchor='99%')
        ])

        return window