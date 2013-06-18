#coding:utf-8
import os

VERSION = '0.6'

PROJECT_PATH = os.path.abspath(__file__)
M3_PROJECT_PATH = os.path.dirname(os.path.dirname(PROJECT_PATH))

# Путь до статики m3
STATIC_PATH = os.path.join(M3_PROJECT_PATH, 'src', 'm3', 'static')

# Путь до внешних js
OUTER_JS_FOLDER = os.path.join(STATIC_PATH, 'ext', 'js')

# Путь до своих js
INNER_JS_FOLDER = os.path.join(STATIC_PATH, 'm3', 'js')

# Путь до своих расширений экста
OUR_EXTJS_EXTENSIONS_FOLDER = os.path.join(INNER_JS_FOLDER, 'ext-extensions')

# Путь до своих прочих js файлов
OUR_OTHER_JS_FOLDER = os.path.join(INNER_JS_FOLDER, 'other')

# Какие типы файлов
FILE_EXTENSIONS = ('js', )

# Внешние приоритетные js файлы для загрузки
HIGH_PRIORITY_OUTER = ('Reorderer.js', )

# Приоритетные js файлы для загрузки
HIGH_PRIORITY = ('m3.js', 'ComboBox.js', 'Grid.js', 'TreeGrid.js', 'Window.js',
    'AdvancedTreeGrid.js',)

# Файлы с наименьшим приоритетом
LOW_PRIORITY = ('FileUploadField.js', 'ImageUploadField.js', 
    'containers.js', 'override.js',)

# Название файла
FILE_NAME = 'm3-debug.js'

# Название файла для production'а
FILE_NAME_OPT = 'm3-opt.js'

#Игнорируемые файлы
EXCLUDE = ('calendar-all.js', 'calendar-all-debug.js','Calendar.js',
           FILE_NAME, FILE_NAME_OPT, 'MultiGroupingGrid.js')

