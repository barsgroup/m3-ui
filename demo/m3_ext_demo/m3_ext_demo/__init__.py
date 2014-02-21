
urlpatterns_module = []


def url(u):
    def wrapper(func):
        urlpatterns_module.append((u, func))
        return func
    return wrapper

import controls.components
import controls.ui
import controls.livegrid