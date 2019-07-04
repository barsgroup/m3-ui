# coding: utf-8
"""
Загрузчик шаблонов (темплейтов) для генерации пользовательского интерфейса
для m3_ext_demo.ui.

Необходимость данного шаблона обусловлена спецификой реализации
template-loaders в django.

Для корректной работы загрузчика в settings.py прикладного приложения
необходимо добавить строку 'm3_ext_demo.ui.js_template_loader.load_template_source'
в tuple TEMPLATE_LOADERS
"""
from __future__ import absolute_import

import os
import sys

from django.template.loaders.filesystem import Loader as BaseLoader
import six


# At compile time, cache the directories to search.
template_dir_ext = os.path.join(
    os.path.dirname(__file__), 'templates')
template_dir_gears = os.path.join(
    os.path.dirname(__file__), '../gears/templates')
if six.PY2:
    fs_encoding = sys.getfilesystemencoding() or sys.getdefaultencoding()
    app_template_dirs = (
        template_dir_ext.decode(fs_encoding),
        template_dir_gears.decode(fs_encoding),
    )
else:
    app_template_dirs = (
        template_dir_ext,
        template_dir_gears,
    )


class Loader(BaseLoader):

    def __init__(self, engine, dirs=None):
        # если нам не передали конкретный источник шаблонов
        if dirs is None:
            dirs = app_template_dirs
        super().__init__(engine, dirs)
