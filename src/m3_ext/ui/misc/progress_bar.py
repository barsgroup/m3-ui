#coding:utf-8

from m3_ext.ui.base import ExtUIComponent


class ExtProgressBar(ExtUIComponent):
    """
    Прогресс бар
    """
    def __init__(self, *args, **kwargs):
        super(ExtProgressBar, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.ProgressBar'

        # Текст внутри прогресс бара(по умолчанию '')
        self.text = None
        # Значение между 0 и 1(например 0.5)
        self.value = None
        # Css класс применяемый к врапперу прогрес бара
        # (по умолчанию 'x-progress')
        self.base_cls = None
        # Анимация (дефолт false)
        self.animate = None

        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(ExtProgressBar, self).render_base_config()
        for k, v in (
            ('text', self.text),
            ('value', self.value),
            ('baseCls', self.base_cls),
            ('animate', self.animate),
        ):
            self._put_config_value(k, v)

    def render(self):
        assert getattr(self, '_ext_name'), (
            'Class %s is not define "_ext_name"' % self.__class__.__name__)

        self.pre_render()

        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        res = '%(ext_name)s({%(base_config)s})' % {
            'ext_name': self._ext_name,
            'base_config': base_config
        }

        return 'new %s' % res if not self._is_function_render else res
