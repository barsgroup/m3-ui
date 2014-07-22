#coding: utf-8
"""
Модуль с преднастроенными панелями-деевьями
"""

from m3_ext.ui import containers


class ExtObjectTree(containers.ExtTree):
    """
    Панель с деревом для управления списком объектов
    """

    _xtype = 'm3-object-tree'

    js_attrs = containers.ExtTree.js_attrs.extend(

        parent_id_name='parentIdName',
        allow_paging='allowPaging',
        row_id_name='rowIdName',
        incremental_update='incrementalUpdate',
        folder_sort='folderSort',
        enable_sort='enableSort',

        url_new='actionNewUrl',
        url_edit='actionEditUrl',
        url_delete='actionDeleteUrl',

        # use url
        url_data='dataUrl',
    )

    deprecated_attrs = containers.ExtTree.deprecated_attrs + (
        'load_mask',
        'url_data',
    )

    def __init__(self, *args, **kwargs):
        super(ExtObjectTree, self).__init__(*args, **kwargs)
        self.setdefault('action_new', None)
        self.setdefault('action_edit', None)
        self.setdefault('action_delete', None)
        self.setdefault('action_data', None)

        self.setdefault('row_id_name', 'id')
        self.setdefault('parent_id_name', 'parent_id')
        self.setdefault('allow_paging', False)
        self.setdefault('top_bar', containers.ExtToolBar())