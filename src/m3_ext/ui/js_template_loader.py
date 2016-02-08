#coding: utf-8
"""
Загрузчик шаблонов (темплейтов) для генерации пользовательского интерфейса
для m3_ext_demo.ui.

Необходимость данного шаблона обусловлена спецификой реализации
template-loaders в django.

Для корректной работы загрузчика в settings.py прикладного приложения
необходимо добавить строку 'm3_ext_demo.ui.js_template_loader.load_template_source'
в tuple TEMPLATE_LOADERS

Created on 22.02.2010

@author: akvarats
"""

import os
import sys

from django.conf import settings
from django.template import TemplateDoesNotExist
from django.utils._os import safe_join
from django.template.loaders.base import Loader as BaseLoader
from django.template.loaders.filesystem import Loader as FilesystemLoader

# At compile time, cache the directories to search.
fs_encoding = sys.getfilesystemencoding() or sys.getdefaultencoding()
template_dir_ext = os.path.join(
    os.path.dirname(__file__), 'templates')
template_dir_gears = os.path.join(
    os.path.dirname(__file__), '../gears/templates')
app_template_dirs = (
    template_dir_ext.decode(fs_encoding),
    template_dir_gears.decode(fs_encoding),
)


class Loader(FilesystemLoader):

    def get_dirs(self):
        return app_template_dirs
