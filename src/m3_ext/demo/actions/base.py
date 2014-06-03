#coding: utf-8
import os
import inspect

from m3.actions import ActionPack
from m3_ext import UIAction


class Pack(ActionPack):
    url = '/pack'

    action_classses = set()

    def __init__(self):
        super(Pack, self).__init__()
        for cls in self.action_classses:
            action = cls()
            setattr(self, cls.__name__.lower(), action)
            self.actions.append(action)

    def extend_menu(self, menu):
        return tuple(
            menu.SubMenu(
                a.menu,
                menu.Item(a.title, pack=a)
            )
            for a in self.actions
            if getattr(a, 'title', None)
        )

    @classmethod
    def register(cls, action_clz):
        cls.action_classses.add(action_clz)
        return action_clz


class DemoAction(UIAction):
    """
    Экшн, публикующий себя в меню
    """

    @property
    def url(self):
        return '/' + self.__class__.__name__.lower()

    @property
    def title(self):
        """
        Название пункта меню и умолчательный заголовок окна
        """
        return self.__class__.__name__

    @property
    def menu(self):
        return os.path.basename(
            os.path.dirname(inspect.getsourcefile(self.__class__)))
