#coding:utf-8
'''
Модуль с различными полезными окнами и прочими элементами
пользовательского интерфейса.

Created on 24.02.2011

@author: akvarats
'''

from m3_ext.ui import (windows,
                       fields,
                       controls,
                       containers,)

class ExternalLinkWindow(windows.ExtWindow):
    '''
    Окно, в котором есть внешняя ссылка + некоторое описание
    того, что эта ссылка означает.
    '''
    def __init__(self, title='', link_html='', link_style={}, desc_html='', desc_style={}, *args, **kwargs):
        super(ExternalLinkWindow, self).__init__(*args, **kwargs)

        self.title = title or u'Внешняя ссылка'
        self.width = 400
        self.height = 300

        self.layout = 'form'

        self.container_link = containers.ExtContainer(html=link_html,
                                                      style=link_style)

        self.container_description = containers.ExtContainer(html=desc_html,
                                                             style=desc_style)

        self.items.extend([self.container_link,
                            self.container_description,])

        self.buttons.append(controls.ExtButton(text=u'Закрыть', handler='closeWindow'))
