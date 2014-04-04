#coding: utf-8

from base import Pack, UIAction
from m3_ext.ui import all_components as ext


@Pack.register
class MenuAction(UIAction):
    """
    Пример панели
    """
    title = u'Окно с меню'

    def get_js(self, request, context):
        return """function(win, data){
            debugger;
        }"""

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout='fit')

        win.panel = ext.ExtPanel(header=True, title=u'Заголовок панели')

        self.test_menu = ext.ExtContextMenu()
        self.test_menu.add_item(text=u'Пункт меню', item_id='item')

        self.ro_menu = ext.ExtContextMenu()
        self.ro_menu.add_item(text=u'Недоступный пункт меню')

        tbar = ext.ExtToolBar()
        tbar.add_text_item(u'Текст на топбаре')
        
        tbar.add_spacer(30)
        tbar.add_menu(text=u'Меню',
                      menu=self.test_menu,
                      tooltip_text=u'Привет, мир!')
        
        tbar.add_spacer(60)
        ro_menu = tbar.add_menu(text=u'Ещё одно меню',
                      menu=self.ro_menu,
                      tooltip_text=u'Увы :(')
        ro_menu.make_read_only()

        win.panel.top_bar = tbar
        win.panel.bottom_bar = ext.ExtPagingBar()

        win.items.append(win.panel)

        return win
