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
        except:
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
    '''
    Выдает данные, упакованные в формате, пригодном для хаванья стором грида
    '''
    return M3JSONEncoder().encode({'rows': list(query)})


def mptt_json_data(query, parent_obj='parent', start=0, limit=25):
    '''
    Добавляет к иерархической структуре _lft, _rgt, _level для отдачи в Ext.m3.
    AdvancedTreeGrid
    '''
    # Список для хранения элементов дерева
    res_data = []

    def add_node(node, parent_node):
        # Добавляет узлы в список прибавляя необходимые параметры
        assert hasattr(node, 'id')

        if parent_node and hasattr(parent_node, parent_obj):
            parent = getattr(parent_node, parent_obj)
            if parent not in res_data:
                # Рекурсивный подъем к вершине
                add_node(parent, getattr(parent, parent_obj))
        elif node in res_data:
            return

        if parent_node:
            assert hasattr(parent_node, '_lft')
            assert hasattr(parent_node, '_rgt')
            assert hasattr(parent_node, '_parent')
            assert hasattr(parent_node, '_level')
            assert hasattr(parent_node, '_is_leaf')
            assert hasattr(parent_node, '_id')

            shift_nodes_right(parent_node._rgt)
            node._parent = parent_node._id
            node._level = parent_node._level + 1
            node._lft = parent_node._rgt - 2
            node._rgt = node._lft + 1
            parent_node._is_leaf = False
            node._is_leaf = True
        else:
            node._parent = None
            node._level = 1
            node._lft = get_max_right_pos() + 1
            node._rgt = node._lft + 1
            node._is_leaf = True

        node._id = node.id

        delattr(node, parent_obj)
        res_data.append(node)

    def shift_nodes_right(start_from, offset=2):
        # Задает смещение элеметов
        for item in res_data:
            if item._lft >= start_from:
                item._lft += offset
            elif item._rgt >= start_from:
                item._rgt += offset

    def get_max_right_pos():
        # Получает максимальную правую позицию
        elements_list = [item._rgt for item in res_data]
        return max(elements_list) if elements_list else 0

    if isinstance(query, QuerySet):
        try:
            total = query.count()
        except:
            total = 0
    else:
        total = len(query)

    if start > 0 and limit < 1:
        data = list(query[start:])
    elif start >= 0 and limit > 0:
        data = list(query[start: start + limit])
    else:
        data = list(query)

    for item in data:
        add_node(item, getattr(item, parent_obj))

    return M3JSONEncoder().encode({'rows': res_data, 'total': total})
