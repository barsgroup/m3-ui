
Работа с полями
===============

BaseExtField
----------------

    .. autoclass:: m3_ext.ui.ext.fields.base.BaseExtField

Атрибут ``value`` - значение по-умолчанию.

    .. image:: /images/ui-example/field_value.png

Атрибут ``read_only`` - признак нередактируемости поля.

    .. image:: /images/ui-example/field_read_only.png

Атрибут ``allow_blank`` - признак (не)обязательности заполнения.
Атрибут ``vtype`` - тип валидации.
Атрибут ``empty_text`` - текст, который будет выводится, если поле незаполненно. Отличие от
``value`` состоит в том, что при изменении значения поля ``value`` не возвращается обратно.

Атрибут ``min_length`` - минимальная длина поля. ``min_length_text`` - сообщение о том, что
количество символов в поле меньше минимально допустимой величины. Пример: ::

    field = ExtStringField(value=u'по-умолчанию', anchor='100%', min_length=3, min_length_text=u'Мало символов')

Вот, что получится:

    .. image:: /images/ui-example/field_min_len_new.png

Атрибут ``max_length`` - максимальная длина содержимого поля. ``max_length_text`` - сообщение о том, что
количество символов в поле больше максимально допустимой величины. Пример: ::

    field = ExtStringField(value=u'по-умолчанию', anchor='100%', max_length=3, max_length_text=u'Много символов')

Вот, что получится в этом случае:

    .. image:: /images/ui-example/field_max_len.png

Атрибут ``regex`` - шаблон регулярного выражения для валидации введенного текста. ``regex_text`` -
сообщение об ошибке, если введенный текст не соответствует шаблону. Пример: ::

    field = ExtStringField(value=u'по-умолчанию', anchor='100%', regex='[0-7]', regex_text=u'Только цифры от 0 до 7')

Вот, что получится в этом случае:

    .. image:: /images/ui-example/field_regex.png

Атрибут ``plugins`` - список плагинов для подключения к полю.


ExtStringField
---------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtStringField

    .. image:: /images/ui-example/string_field.png

Является потомком ``BaseExtField``. Обертка `Ext.form.TextField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.TextField>`_.

Атрибут ``input_mask`` - задает маску ввода. Пример: ::

    field = ExtStringField(anchor='100%', input_mask="(###)###-##-##")

Иллюстрация:

    .. image:: /images/ui-example/input_mask.png


ExtDateField
-------------


    .. autoclass:: m3.ui.ext.fields.simple.ExtDateField

    .. image:: /images/ui-example/datefield.png

Является потомком ``BaseExtField``. Обертка `Ext.form.DateField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.DateField>`_

Атрибут ``start_day`` - числое значение(0-6), которое задает день с которого начинается неделя в календаре.
(0-Воскресенье, 1-понедельник, 2-вторник и т.д.) ::

    field = ExtDateField(anchor='100%', start_day=3)

Иллюстрация:

    .. image:: /images/ui-example/start_day.png

Флаг ``hide_today_btn`` позволяет скрыть кнопку, при нажатие на которую в поле проставляется
текущая дата.

    .. image:: /images/ui-example/hide_today_btn.png

Атрибуты ``max_value`` и ``min_value`` задают максимальное и минимальное значение даты в поле.

Атрибут ``format`` позволяет указывать формат даты.


ExtDateTimeField
----------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtDateTimeField

    .. image:: /images/ui-example/datetimefield.png

Является потомком ``ExtDateField``. Обертка ``Ext.ux.form.DateTimeField``


ExtNumberField
--------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtTimeField


Является потомком ``BaseExtField``. Обертка `Ext.form.NumberField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.NumberField>`_

Атрибут ``decimal_separator`` задает разделитель целой и дробной части.

Атрибут ``allow_decimals`` разрешает или запрещает присутствие дробной части.

Атрибут ``allow_negative`` разрешает или запрещает вводить отрицательные числа.

Атрибут ``decimal_precision`` задает точность дробной части.

Атрибуты ``max_value`` и ``min_value`` задают верхнюю и нижнюю границу для вводимых данных.

Атрибуты ``max_text`` и ``min_text`` задают сообщения при нарушении границы допустипых значений.


ExtHiddenField
---------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtHiddenField

Является потомком ``BaseExtField``. Обертка `Ext.form.Hidden <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.Hidden>`_

Атрибут ``type`` задает тип данного поля. Возможны два варианта ( ``ExtHiddenField.INT`` = 0 и ``ExtHiddenField.STRING`` = 1).
Обычно данное поле используют для хранения идентификатора обьекта. Его не нужно показывать пользователю, но
оно полезно при submit-е.


ExtTextArea
------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtTextArea

    .. image:: /images/ui-example/textarea.png

Является потомком ``BaseExtField``. Обертка `Ext.form.TextArea <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.TextArea>`_

Атрибут ``mask_re`` задает фильтр символов по шаблону регулярного выражения.


ExtCheckBox
-----------

    .. autoclass:: m3.ui.ext.fields.simple.ExtCheckBox

Является потомком ``BaseExtField``. Обертка `Ext.form.Checkbox <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.Checkbox>`_

Атрибут ``checked`` - признак того, что значение выбрано.
Атрибут ``box_label`` - текст рядом с полем выбора значения. Пример: ::

    field = ExtCheckBox(anchor='100%', checked=True, box_label=u'Значение выбрано потому, что checked = True')

Иллюстрация к примеру:

    .. image:: /images/ui-example/checkbox.png


ExtRadio
--------

    .. autoclass:: m3.ui.ext.fields.simple.ExtRadio

Является потомком ``BaseExtField``. Обертка `Ext.form.Radio <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.Radio>`_

Атрибуты аналогичны ``ExtCheckBox``.

Иллюстрация:

    .. image:: /images/ui-example/radio.png


ExtTimeField
------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtTimeField

    .. image:: /images/ui-example/timefield.png

Является потомком ``BaseExtField``. Обертка `Ext.form.TimeField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.TimeField>`_

Атрибут ``format`` задает формат отображения времени
Атрибут ``increment`` задает временной интервал между значениями в выпадающем списке. Например на
иллюстрации выше, это значение равно 15 минутам.

Атрибуты ``max_value`` и ``min_value`` задают верхнюю и нижнюю границу для времени.


ExtHTMLEditor
-------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtHTMLEditor

    .. image:: /images/ui-example/htmleditor.png

Является потомком ``BaseExtField``. Обертка `Ext.form.HtmlEditor <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.HtmlEditor>`_


ExtDisplayField
----------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtDisplayField

Является потомком ``BaseExtField``. Обертка `Ext.form.DisplayField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.DisplayField>`_


ExtAdvTimeField
---------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtAdvTimeField

    .. image:: /images/ui-example/advtime.png

Является потомком ``BaseExtField`` и аналогом ``ExtTimeField``. Обертка ``Ext.ux.form.AdvTimeField``


ExtSearchField
---------------

    .. autoclass:: m3.ui.ext.fields.complex.ExtSearchField

Является потомком ``BaseExtField``.

Важный атрибут ``component_for_search`` содержит ссылку на компонент
в котором осуществляется поиск.

Пример: ::

    tree = ExtTree(url='/ui/base-tree-data') # -- для дерева, подгружаемого с сервера
    tree.add_column(header=u'Имя', data_index = 'fname', width=140)
    tree.add_column(header=u'Фамилия', data_index = 'lname', width=140)
    tree.add_column(header=u'Адрес', data_index = 'adress', width=140)
    tree.add_number_column(header=u'Зп', data_index = 'nc', width=60)
    tree.add_date_column(header=u'Др', data_index = 'dc', width=60)
    tree.add_bool_column(header=u'Муж?',
                             data_index = 'bc',
                             text_false = u'Нет',
                             text_true = u'Да',
                             width=50)

    search = ExtSearchField(component_for_search = tree, empty_text=u'Поиск')

    search_other = ExtSearchField(component_for_search = tree, empty_text=u'Другой поиск')
    menu = ExtContextMenu(style = dict(overflow='visible'))
    menu.items.append(search_other)


    toolbar = ExtToolBar()
    toolbar.items.append(search)
    toolbar.add_fill()
    toolbar.add_menu(text=u'Поиск',menu=menu)

В этом случае создается два ``ExtSearchField``. Один из них помещён на ``ExtToolbar``,
а другой в ``ExtContextMenu``. Компонентом для поиска ``component_for_search`` является дерево.

    .. image:: /images/ui-example/search_field_example.png


ExtFileUploadField
------------------

    .. autoclass:: m3.ui.ext.fields.complex.ExtFileUploadField

Является потомком ``BaseExtField``. Является оберткой ``Ext.ux.form.FileUploadField``.

Атрибут ``file_url`` задает URL, по которому расположен выбранный файл.

Атрибут ``possible_file_extension`` - кортеж допустимых расширений для файла. Например: ::

    possible_file_extensions = ('png', 'jpeg', 'gif', 'bmp')

Иллюстрация:

    .. image:: /images/ui-example/file_upload_field.png


ExtImageUploadField
-------------------

    .. autoclass:: m3.ui.ext.fields.complex.ExtImageUploadField

    .. image:: /images/ui-example/image_upload_field.png

Является потомком ``ExtFileUploadField``. Является оберткой ``Ext.ux.form.ImageUploadField``.

Содержит атрибуты ``image_max_size`` - кортеж с высотой и шириной изображения, ``thumbnail`` -
использовать ли миниатюры, ``thumbmail_size`` - кортеж с высотой и шириной миниатюры.


BaseExtTriggerField
-------------------

    .. autoclass:: m3.ui.ext.fields.base.BaseExtTriggerField


Атрибут ``display_field``, содержит имя поля, которое отображается при выборе.

Атрибут ``value_field``, содержит имя поля, которое используется в качестве значения.

Пример combobox: ::

    combo_box = ExtComboBox(display_field='name', value_field='id')
    combo_box.store = ExtDataStore(display_field='name', value_field='id')

Вот, что получится:

    .. image:: /images/ui-example/trigger_field_example.png

Если пользователь выберет second_record, то на сервер отправится значение 2.

Флаг ``hide_trigger`` позволяет скрыть триггер выпадающего списка: ::

    combo_box = ExtComboBox(display_field='name', value_field='id', hide_trigger=True)

Иллюстрация:

    .. image:: /images/ui-example/hide_trigger.png

Флаг ``type_ahead`` разрешает автозаполнение.

    .. image:: /images/ui-example/type_ahead_example.png

Атрибут ``trigger_action`` может принимать два значения: ``BaseExtTriggerField.ALL`` или
``BaseExtTriggerField.Query``. Смысл параметра это имя запроса откуда будут браться данные
для заполнения выпадающего списка. Например, мы выбрали запись second_record. Тогда при
повторном нажатие на триггер будут отображаться только те записи, что соответсвуют данной.
Пример: ::

    combo_box = ExtComboBox(display_field='name', value_field='id', trigger_action=BaseExtTriggerField.QUERY)
    combo_box.store = ExtDataStore(data=[(1, 'first record'),(2, 'second record'), (3, 'second record 2')])

Иллюстрация:

    .. image:: /images/ui-example/trigger_action.png

Атрибут ``page_size`` указывает количество записей на одной странице выпадающего списка ::

    combo_box = ExtComboBox(display_field='name', hidden_name='id', trigger_action=BaseExtTriggerField.ALL, page_size=2)
    combo_box.store = ExtDataStore(data=[(1, 'first record'),(2, 'second record'), (3, 'second record 2')])

Boт, что получится:
    .. image:: /images/ui-example/trigger_field_page_size.png

Атрибут ``max_heigth_dropdown_list`` содержит максимальную высоту выпадающего списка.

Атрибут ``min_chars`` - количество символов, которое необходимо ввести для выполнения запроса.

Свойство ``store`` задает хранилище данных для поля. Атрибут ``mode``, в свою очередь указывает какое хранилище:
локальное или удаленное ('local' или 'remote').

Флаг ``editable`` разрешает или запрещает вводить текст в поле.

Флаг ``force_selection`` включает возможность заполнение поля после потери фокуса.

Атрибут ``not_found_text`` - текст, если записей в store нет.

Атрибут ``loading_text`` - текст, отображаемый при загрузке данных.

Атрибут ``fields`` - список полей, который будут присутствовать в store.

Атрибут ``list_width`` - ширина выпадающего списка.

Флаг ``resizable`` - управляет возможностью изменять ширину выпадающего списка

    .. image:: /images/ui-example/trigger_field_resizable.png


ExtComboBox
-----------

    .. autoclass:: m3.ui.ext.fields.simple.ExtComboBox

    .. image:: /images/ui-example/trigger_field_example.png

Является потомком ``BaseExtTriggerField``. Обертка `Ext.form.ComboBox <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.ComboBox>`_


ExtDictSelectField
------------------

    .. autoclass:: m3.ui.ext.fields.complex.ExtDictSelectField

    .. image:: /images/ui-example/dict_select_field.png

Является потомком ``BaseExtTriggerField``.

Флаги ``hide_trigger``, ``hide_clear_trigger``, ``hide_edit_trigger`` и
``hide_dict_select_trigger`` управляют отображением триггеров.

По умолчанию в ``ExtDictSelectField`` в качестве хранилища используется ``ExtJsonStore``.

Атрибут ``url`` содержит URL по которому будут отдаваться данные из справочника.

Свойство ``action_select`` - cсылка на action, который используется для получения окна выбора значения.

Свойство ``action_data`` - ссылка на action, который используется для получения списка строковых значений.

Метод ``configure_by_dictpack`` принимает в качестве параметров pack и controller (необязательно) и
выполняет настройку поля для работы с выбранным pack.

Пример использования: ::

    cont = ExtDictSelectField(label = u'Первый участник',
                                   url='/ui/tree-dict-window',
                                   autocomplete_url = '/ui/grid-json-store-data',
                                   ask_before_deleting=False,
                                   width=200)

    cont.display_field = 'lname'
    cont.value_field = 'id'


ExtMultiSelectField
-------------------

    .. autoclass:: m3.ui.ext.fields.complex.ExtMultiSelectField

    .. image:: /images/ui-example/multi_select_field.png

Является потомком ``ExtDictSelectField``.
