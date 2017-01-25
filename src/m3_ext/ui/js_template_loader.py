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
import os
import sys

from django.conf import settings
from django.template import TemplateDoesNotExist
from django.utils._os import safe_join
from django.core.exceptions import SuspiciousOperation
from m3_django_compat import BaseLoader


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


def get_template_sources(template_name, template_dirs=None):
    """
    Returns the absolute paths to "template_name", when appended to each
    directory in "template_dirs". Any paths that don't lie inside one of the
    template dirs are excluded from the result set, for security reasons.
    """
    if not template_dirs:
        template_dirs = app_template_dirs
    for template_dir in template_dirs:
        try:
            yield safe_join(template_dir, template_name)
        except UnicodeDecodeError:
            # The template dir name was a bytestring that wasn't valid UTF-8.
            raise
        # В Django <1.8.X safe_join выбрасывает ValueError
        # В Django >=1.8.X safe_join выбрасывает SuspiciousOperation
        except (SuspiciousOperation, ValueError):
            # The joined path was located outside of template_dir.
            pass


class Loader(BaseLoader):

    is_usable = True

    def load_template_source(self, template_name, template_dirs=None):
        return load_template_source(template_name, template_dirs)


def load_template_source(template_name, template_dirs=None):
    for filepath in get_template_sources(template_name, template_dirs):
        try:
            return (
                open(filepath).read().decode(settings.FILE_CHARSET), filepath
            )
        except IOError:
            pass
    raise TemplateDoesNotExist(template_name)

load_template_source.is_usable = True
