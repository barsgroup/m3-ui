#coding: utf-8
"""
Содержит класс Календаря и сопутсвующие классы
"""
from m3_ext.ui.containers.forms import ExtPanel


class ExtCalendar(ExtPanel):
    """
    Обёртка над Sencha Calendar
    """
    def __init__(self, *args, **kwargs):
        super(ExtCalendar, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.m3.Calendar'

        # Родные атрибуты календаря
        self.show_day_view = True
        self.show_week_view = True
        self.show_month_view = True
        self.show_nav_bar = True
        self.today_text = u'Сегодня'
        self.show_today_text = True
        self.show_time = True
        self.day_text = u'День'
        self.week_text = u'Неделя'
        self.month_text = u'Месяц'

        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(ExtCalendar, self).render_base_config()
        for k, v in (
            ('showDayView', self.show_day_view),
            ('showWeekView', self.show_week_view),
            ('showMonthView', self.show_month_view),
            ('showNavBar', self.show_nav_bar),
            ('todayText', self.today_text),
            ('showTodayText', self.show_today_text),
            ('showTime', self.show_time),
            ('dayText', self.day_text),
            ('weekText', self.week_text),
            ('monthText', self.month_text),
        ):
            self._put_config_value(k, v)

    # Данный код должен находится в базовом классе, но т.к. не вcе шаблоны
    # переведены на новый рендеринг, остается пока в каждом
    def render(self):
        assert getattr(self, '_ext_name'), (
            'Attrubute "_ext_name" is not defined in the class %s' %
            self.__class__.__name__
        )

        self.pre_render()
        self.render_params()
        self.render_base_config()

        base_config = self._get_config_str()
        params = self._get_params_str()
        res = '%(ext_name)s({%(base_config)s},{%(params)s})' % {
            'ext_name': self._ext_name,
            'base_config': base_config,
            'params': params
        }

        return 'new %s' % res if not self._is_function_render else res
