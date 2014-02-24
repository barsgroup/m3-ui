#coding: utf-8

from m3_ext.ui.windows.complex import ExtDictionaryWindow


class CatalogueWindow(ExtDictionaryWindow):

    width = 800
    height = 200

    def __init__(self, *args, **kwargs):
        super(CatalogueWindow, self).__init__(*args, **kwargs)
        self.template_globals = 'ext-script/ext-catalogue-window-globals.js'
        self.maximized = True



