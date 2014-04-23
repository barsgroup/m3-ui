# coding: utf-8

from m3_ext.ui.windows.base import BaseExtWindow


class ExtDictionaryWindow(BaseExtWindow):
    """
    Базовое окно для линейного, иерархичесого и совмещенного справочника
    """

    # Режим отображения
    LIST_MODE = 0

    # Режим выбора
    SELECT_MODE = 1

    # Режим множественного выбора
    MULTI_SELECT_MODE = 2

    _xtype = 'm3-dictionary-window'