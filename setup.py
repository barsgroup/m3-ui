# coding: utf-8
from os.path import dirname
from os.path import join

from setuptools import find_packages
from setuptools import setup


def _read(file_name):
    with open(join(dirname(__file__), file_name)) as f:
        return f.read()


setup(
    name='m3-ui',
    url='https://bitbucket.org/barsgroup/m3-ext',
    license='MIT',
    author='BARS Group',
    author_email='bars@bars-open.ru',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    description=_read('DESCRIPTION'),
    long_description=_read('README'),
    include_package_data=True,
    classifiers=[
        'Intended Audience :: Developers',
        'Environment :: Web Environment',
        'Natural Language :: Russian',
        'Natural Language :: English',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'License :: OSI Approved :: MIT License',
        'Development Status :: 5 - Production/Stable',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3.6',
        'Framework :: Django :: 1.4',
        'Framework :: Django :: 1.5',
        'Framework :: Django :: 1.6',
        'Framework :: Django :: 1.7',
        'Framework :: Django :: 1.8',
        'Framework :: Django :: 1.9',
        'Framework :: Django :: 1.10',
        'Framework :: Django :: 1.11',
    ],
    dependency_links=(
        'http://pypi.bars-open.ru/simple/m3-builder',
    ),
    setup_requires=(
        'm3-builder>=1.2.0,<2',
    ),
    install_requires=(
        'six>=1.11,<2',
        'm3-builder>=1.2.0,<2',
        'm3-django-compat>=1.5.1,<2',
        'django>=1.4,<2',
        'm3-core>=2.2.16,<3',
    ),
    set_build_info=dirname(__file__),
)
