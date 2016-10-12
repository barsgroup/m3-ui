# coding:utf-8
"""
Хелперы, которые помогают формировать пользовательский интерфейс
"""
from collections import Iterable

from django.db.models.query import QuerySet
from django.utils.safestring import mark_safe
from m3 import M3JSONEncoder

from m3_ext.ui import render_template


def paginated_json_data(query, start=0, limit=25):
    if isinstance(query, QuerySet):
        try:
            total = query.count()
        except AttributeError:
            total = 0
    else:
        total = len(query)
    if start > 0 and limit < 1:
        data = list(query[start:])
    elif start >= 0 and limit > 0:
        data = list(query[start: start + limit])
    else:
        data = list(query)
    return M3JSONEncoder().encode({'rows': data, 'total': total})


def grid_json_data(query):
    """
    Выдает данные, упакованные в формате, пригодном для хаванья стором грида
    """
    return M3JSONEncoder().encode({'rows': list(query)})


def _render_globals(component):
    result = u''
    if component.template_globals:
        context = {'component': component, 'window': component}

        if isinstance(component.template_globals, basestring):
            result = render_template(component.template_globals, context)

        elif isinstance(component.template_globals, Iterable):
            result = mark_safe(u'\n'.join(
                render_template(template, context)
                for template in component.template_globals
            ))

    return result
