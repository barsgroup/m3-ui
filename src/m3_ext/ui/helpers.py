#coding:utf-8
"""
Хелперы, которые помогают формировать пользовательский интерфейс
"""

from django.db.models.query import QuerySet
from m3 import M3JSONEncoder


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
