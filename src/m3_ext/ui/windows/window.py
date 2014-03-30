#coding: utf-8
"""
Created on 25.02.2010

@author: akvarats
"""

from base import BaseExtWindow


class ExtWindow(BaseExtWindow):
    """
    Окно
    :raises: AssertionError, UnicodeDecodeError
    """
    def __init__(self, *args, **kwargs):
        super(ExtWindow, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.m3.Window'
        self.init_component(*args, **kwargs)

    # Данный код должен находится в базовом классе, но т.к. не вcе шаблоны
    # переведены на новый рендеринг, остается пока в каждом
    def render(self):
        assert getattr(self, '_ext_name'), \
            'Class %s is not define "_ext_name"' % self.__class__.__name__

        self.pre_render()

        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
#        except Exception as msg: -- не проглатываем все ошибки
#            raise Exception(msg)

        base_config = self._get_config_str()
        params = self._get_params_str()
        res = '%(ext_name)s({%(base_config)s},{%(params)s})' % {
            'ext_name': self._ext_name,
            'base_config': base_config,
            'params': params}

        return 'new %s' % res if not self._is_function_render else res
