# coding: utf-8
from __future__ import absolute_import

from m3_ext.ui import panels

from .base import BaseExtWindow


#==============================================================================
class BaseExtListWindow(BaseExtWindow):
    """
    Базовое окно со списком записей.
    """
    def __init__(self, *args, **kwargs):
        super(BaseExtListWindow, self).__init__(*args, **kwargs)

        #self.template = 'ext-windows/ext-window.js'

        self.layout = 'border'
        self.width = 800
        self.height = 600
        self.maximized = True

        # грид, который будем все для нас делать
        self.grid = panels.ExtObjectGrid(region='center')
        self.items.append(self.grid)

    # Данный код должен находится в базовом классе, но т.к. не вcе шаблоны
    # переведены на новый рендеринг, остается пока в каждом
    def render(self):
        assert getattr(self, '_ext_name'), (
            'Class %s is not define "_ext_name"' % self.__class__.__name__
        )

        self.pre_render()

        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        params = self._get_params_str()
        res = '%(ext_name)s({%(base_config)s},{%(params)s})' % {
            'ext_name': self._ext_name,
            'base_config': base_config,
            'params': params
        }

        return 'new %s' % res if not self._is_function_render else res
