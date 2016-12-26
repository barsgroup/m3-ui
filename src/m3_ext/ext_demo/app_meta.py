# -*- coding: utf-8 -*-

from django.conf.urls import url

from m3.actions import ActionController
from m3_ext.ui.desktop import uificate_the_controller
from .actions.base import Pack


controller = ActionController(url='actions')


def register_actions():
    controller.packs.append(Pack())


def register_desktop_menu():
    uificate_the_controller(
        controller,
        # menu_root=MainMenu.SubMenu(u'M3_Ext Demo')
    )


def register_urlpatterns():
    """
    Регистрация конфигурации урлов для приложения
    """
    return [url(*controller.urlpattern)]
