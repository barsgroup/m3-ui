#coding: utf-8
'''
Содержит класс Календаря и сопутсвующие классы
'''
from m3.ui.ext.containers.forms import ExtPanel

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
        self._put_config_value('showDayView', self.show_day_view)
        self._put_config_value('showWeekView', self.show_week_view)
        self._put_config_value('showMonthView', self.show_month_view)
        self._put_config_value('showNavBar', self.show_nav_bar)
        self._put_config_value('todayText', self.today_text)
        self._put_config_value('showTodayText', self.show_today_text)
        self._put_config_value('showTime', self.show_time)
        self._put_config_value('dayText', self.day_text)
        self._put_config_value('weekText', self.week_text)
        self._put_config_value('monthText', self.month_text)
        
        
    # Данный код должен находится в базовом классе, но т.к. не вcе шаблоны 
    # переведены на новый рендеринг, остается пока в каждом 
    def render(self):
        assert getattr(self, '_ext_name'), \
               'Attrubute "_ext_name" is not defined in the class %s' % self.__class__.__name__
        
        self.pre_render()
        self.render_params()
        self.render_base_config()
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        res =  '%(ext_name)s({%(base_config)s},{%(params)s})' \
                            % {'ext_name': self._ext_name,
                            'base_config': base_config,
                            'params': params }

        return 'new %s' % res if not self._is_function_render else res
        