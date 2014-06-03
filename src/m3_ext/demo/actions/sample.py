# -*- coding: utf-8 -*-

from base import Pack, DemoAction

from m3_ext.ui import all_components as ext


@Pack.register
class SampleAction(DemoAction):
    """
    Пример оконного экшна
    """
    title = u'Простое окно с кнопкой'
    menu = 'other'

    def get_js(self, request, context):
        return """function(w, d){
            w.find('itemId', 'btn')[0].on('click', function(){
                alert(d.message);
            });
        }"""

    def get_ui(self, request, context):
        win = super(SampleAction, self).get_ui(request, context)
        win.btn = ext.ExtButton(text=u'Кнопка')
        win.items.append(win.btn)
        return win

    def get_result(self, request, context):
        res = super(SampleAction, self).get_result(request, context)
        res['data']['message'] = u"Кнопка нажата!"
        return res
