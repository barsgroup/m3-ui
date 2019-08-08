# coding: utf-8
"""
Загрузчик шаблонов (темплейтов) для генерации пользовательского интерфейса
для m3_ext_demo.ui.

Необходимость данного шаблона обусловлена спецификой реализации
template-loaders в django.
"""

from os.path import join as join_path, dirname

from django.conf import settings
from django.template import TemplateDoesNotExist
from django.utils._os import safe_join
from django.core.exceptions import SuspiciousOperation
from m3_django_compat import BaseLoader
import six


# At compile time, cache the directories to search.
module_dir = dirname(__file__)

if six.PY2:
    # Пути должны быть закодированы в UTF-8
    # Во втором питоне module_dir содержит str в системной кодировке,
    # поэтому ее надо правильно декодировать
    import sys

    fs_encoding = sys.getfilesystemencoding() or sys.getdefaultencoding()
    template_dir_ext = join_path(module_dir, 'templates')
    template_dir_gears = join_path(dirname(module_dir), 'gears', 'templates')
    app_template_dirs = (
        template_dir_ext.decode(fs_encoding),
        template_dir_gears.decode(fs_encoding),
    )
else:
    # В третьем питоне str сразу содержит текст в нужной кодировке
    app_template_dirs = (
        join_path(module_dir, 'templates'),
        join_path(dirname(module_dir), 'gears', 'templates'),
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
            if six.PY2:
                # Во втором питоне read() считает строку в байтовом виде,
                # и декодирует ее в unicode, с кодировкой из
                # settings.FILE_CHARSET
                template = open(filepath).read().decode(settings.FILE_CHARSET)
            else:
                # В третьем питоне можно указать кодировку файла до открытия,
                # метод read() вернет уже декодированную str
                template = open(filepath, encoding=settings.FILE_CHARSET).read()

                # В Django 2.2 settings.FILE_CHARSET вообще устарело,
                # все файлы, которые Django считывает с диска, сразу
                # должны быть в UTF-8.
                # При обновлении надо будет это все выкинуть
            return (template, filepath)
        except IOError:
            pass
    raise TemplateDoesNotExist(template_name)

load_template_source.is_usable = True

