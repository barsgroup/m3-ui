# coding: utf-8
# pylint: disable=relative-import
from __future__ import absolute_import
from __future__ import print_function
from __future__ import unicode_literals

from os.path import dirname
from os.path import isdir
from os.path import join
import sys

from fabric.api import local
from fabric.colors import green
from fabric.context_managers import lcd
from fabric.context_managers import settings
from fabric.decorators import task
from fabric.tasks import execute
from fabric.utils import abort

from ._settings import PROJECT_DIR
from ._settings import PROJECT_PACKAGE
from ._settings import SRC_DIR
from ._utils import nested


@task
def isort():
    """Сортировка импортов в модулях проекта."""
    with lcd(PROJECT_DIR):
        print(green(u'isort', bold=True))

        RC_PATH = join(PROJECT_DIR, '.isort.cfg')
        ISORT = 'isort --skip= --settings-path "{}"'.format(RC_PATH)
        local('{} -rc "{}"'.format(ISORT, SRC_DIR))
        local('{} -rc "{}"'.format(ISORT, dirname(__file__)))


@task
def style():
    """Проверка стилевого оформления кода проекта."""
    with nested(
        settings(ok_ret_codes=(0, 1)),
        lcd(PROJECT_DIR)
    ):
        print(green(u'PEP-8', bold=True))

        local('pycodestyle "{}"'.format(join(SRC_DIR, PROJECT_PACKAGE)))


@task
def pylint():
    """Проверка кода проекта с помощью PyLint."""
    with nested(
        settings(ok_ret_codes=(0, 1, 4, 30)),
        lcd(SRC_DIR),
    ):
        print(green(u'PyLint (compartibility mode)', bold=True))
        if sys.version_info.major == 2:
            cmd = 'python -3 -Werror -m compileall ' + PROJECT_PACKAGE
        else:
            cmd = 'python -m compileall ' + PROJECT_PACKAGE
        if local(cmd).return_code != 0:
            abort('Python 3 incompartible')
        if local(
            'pylint --py3k "{}"'
            .format(join(SRC_DIR, PROJECT_PACKAGE))
        ).return_code != 0:
            abort('Python 3 incompartible')

        print(green(u'PyLint', bold=True))
        if local(
            'pylint "--rcfile={}/pylint.rc" "{}"'
            .format(PROJECT_DIR, PROJECT_PACKAGE)
        ).return_code != 0:
            abort('Pylint checks failed')


@task
def clean():
    """Удаление файлов, созданных во время компиляции искодного кода."""
    for dir_path in (
        join(PROJECT_DIR, 'src'),
        join(PROJECT_DIR, 'fabfile'),
    ):
        if isdir(dir_path):
            for pattern in ('*.pyc', '__pycache__'):
                local('find "{}" -name {} -delete'.format(dir_path, pattern))


@task(default=True)
def run_all():
    """Запуск всех проверок src.*."""
    execute(isort)
    execute(style)
    execute(pylint)
