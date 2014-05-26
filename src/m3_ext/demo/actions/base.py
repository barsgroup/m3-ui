#coding: utf-8
import os
import inspect

from m3.actions import ActionPack


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

        if not getattr(action_clz, 'menu', None):
            action_clz.menu = os.path.basename(
                os.path.dirname(
                    inspect.getsourcefile(action_clz)))

        cls.action_classses.add(action_clz)
        return action_clz