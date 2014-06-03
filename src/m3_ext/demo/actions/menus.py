#coding: utf-8

from base import Pack, DemoAction
from m3_ext.ui import all_components as ext


@Pack.register
class MenuAction(DemoAction):
    """
    Пример панели
    """
    title = u'Окно с меню'
    menu = 'other'

    def get_js(self, request, context):
        return u"""function(win, data){
            var first_menu = win.getComponent("panel").toolbars[0].getComponent("first-menu").menu;
            var ro_menu = win.getComponent("panel").toolbars[0].getComponent("ro-menu").menu;

            var item = first_menu.getComponent("item");
            var dis = ro_menu.getComponent("disabled-item");
            var toggle = first_menu.getComponent("toggle");

            item.on('click', function(e){
                alert('Здравствуй, мир!');
            });
            toggle.on('click', function(e){
                dis.setDisabled(!dis.disabled);
                alert('Ранее заблокированный пункт теперь ' + (dis.disabled ? 'не' : '') + 'доступен!');
            });

            dis.on('click', function(e){
                alert('Вы не должны были видеть это сообщение.');
            });
        }"""

    def get_ui(self, request, context):
        win = ext.ExtWindow(title=self.title,
                            width=600,
                            height=400,
                            layout='fit')

        win.panel = ext.ExtPanel(
            header=True,
            title=u'Заголовок панели',
            item_id='panel')

        self.test_menu = ext.ExtContextMenu()
        self.test_menu.add_item(
            text=u'Пункт меню',
            item_id='item')
        self.test_menu.add_item(
            text=u'Переключатель доступности',
            item_id='toggle')

        self.ro_menu = ext.ExtContextMenu()
        self.ro_menu.add_item(text=u'Недоступный пункт меню', item_id='disabled-item')

        tbar = ext.ExtToolBar()
        tbar.add_text_item(u'Текст на топбаре')

        tbar.add_spacer(30)
        tbar.add_menu(
            text=u'Меню',
            menu=self.test_menu,
            tooltip_text=u'Привет, мир!',
            item_id='first-menu')

        tbar.add_spacer(60)
        ro_menu = tbar.add_menu(
            text=u'Ещё одно меню',
            menu=self.ro_menu,
            tooltip_text=u'Увы :(',
            item_id='ro-menu')
        ro_menu.make_read_only()

        win.panel.top_bar = tbar
        win.panel.bottom_bar = ext.ExtPagingBar()

        win.items.append(win.panel)

        return win
