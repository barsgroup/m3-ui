#coding:utf-8
"""
Хелперы, которые помогают формировать пользовательский интерфейс
"""
import datetime
import decimal
import json
import os
from django.conf import settings
from django.core.files.base import ContentFile

from django.db.models.query import QuerySet
from m3 import M3JSONEncoder
from m3.actions.interfaces import IMultiSelectablePack, ISelectablePack

try:
    from PIL import Image  # require PIL module
except ImportError:
    class _FakeImage(object):
        """
        Заглушка для PIL.Image
        """

        def __getattr__(self, attr):
            raise ImportError("PIL not installed!")

    Image = _FakeImage

try:
    from django.utils.log import logger
except ImportError:
    from django.utils.log import getLogger

    logger = getLogger('django')


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


def bind_to_request(request, all_fields):
    """
    Извлекает из запроса параметры и присваивает их соответствующим полям
    формы
    """
    assert request, 'Request must be define!'

    from m3_ext.ui import fields

    for field in all_fields:
        name = field.name
        if isinstance(field, (
                fields.ExtFileUploadField,
                fields.ExtImageUploadField
        )):
            # Файлы нужно забирать из request.FILES
            field.memory_file = request.FILES.get(
                fields.ExtFileUploadField.PREFIX + field.name)
        # возьмем только то, что есть в запросе
        if name in request.POST:
            value = request.POST.get(name)
            field.value = value


def from_object(obj, all_fields, exclusion=None):
    """
    Метод выполнения прямого связывания данных атрибутов объекта obj и
    полей текущей формы
    """
    from m3_ext.ui import fields
    from m3_ext.ui.fields import simple

    exclusion = exclusion or []

    def is_secret_token(value):
        """
        Возвращает истину если значение поля содержит секретный ключ с
        персональной информацией. Он не должен биндится,
        т.к. предназначен для обработки в personal.middleware
        """
        return unicode(value)[:2] == u'##'

    def _assign_value(value, item):
        """
        Конвертирует и присваивает значение value в соответствии типу item.
        """
        if isinstance(item, fields.ExtStringField):
            if value:
                item.value = unicode(value)
            else:
                item.value = u''

        elif isinstance(item, simple.ExtAdvTimeField):
            item.value = '%02d:%02d:%02d' % (
                value.hour, value.minute, value.second
            ) if not is_secret_token(value) else unicode(value)

        elif isinstance(item, simple.ExtDateTimeField):
            if isinstance(value, datetime.datetime):
                item.value = '%02d.%02d.%04d %02d:%02d:%02d' % (
                    value.day, value.month, value.year, value.hour,
                    value.minute, value.second
                )
            elif isinstance(value, datetime.date):
                item.value = '%02d.%02d.%04d 00:00:00' % (
                    value.day, value.month, value.year
                )
            else:
                item.value = value

        elif isinstance(item, fields.ExtDateField):
            if isinstance(value, (datetime.date, datetime.datetime)):
                item.value = '%02d.%02d.%04d' % (
                    value.day, value.month, value.year
                ) if not is_secret_token(value) else unicode(value)
            else:
                item.value = value

        elif isinstance(item, fields.ExtTimeField):
            if isinstance(value, (datetime.time, datetime.datetime)):
                item.value = '%02d:%02d' % (
                    value.hour, value.minute
                ) if not is_secret_token(value) else unicode(value)
            else:
                item.value = value

        elif isinstance(item, fields.ExtCheckBox):
            item.checked = True if value else False
        elif isinstance(item, fields.ExtRadio):
            item.checked = (value == item.value)
        elif isinstance(item, fields.ExtMultiSelectField):
            # У поля выбора может быть сзязанный с ним пак
            bind_pack = getattr(item, 'pack', None) or getattr(
                item, 'bind_pack', None)
            if bind_pack:
                assert isinstance(bind_pack, IMultiSelectablePack), (
                    'Pack %s must provide IMultiSelectablePack interface' %
                    bind_pack
                )
                item.value = bind_pack.get_display_dict(
                    value,
                    value_field=item.value_field,
                    display_field=item.display_field
                )
        elif isinstance(item, fields.ExtDictSelectField):
            # У поля выбора может быть сзязанный с ним пак
            # TODO после окончательного удаления метода
            # configure_by_dictpack в ExtDictSelectField
            # нужно удалить проверку на 'bind_pack'
            bind_pack = getattr(item, 'pack', None) or getattr(
                item, 'bind_pack', None)
            if bind_pack and value:
                assert isinstance(bind_pack, ISelectablePack), (
                    'Pack %s must provide ISelectablePack interface' %
                    bind_pack
                )
                if hasattr(bind_pack, 'get_record'):
                    record = bind_pack.get_record(value)
                    if record:
                        item.set_value_from_model(record)
                        # TODO: возможно, здесь нужно возбуждать исключение
                        # else:
                        #     raise bind_pack.model.DoesNotExist()
                else:
                    item.default_text = bind_pack.get_display_text(
                        value, item.display_field)
            item.value = value
        elif isinstance(item, fields.ExtComboBox) and hasattr(
                item, 'bind_rule_reverse'):
            # Комбобокс как правило передает id выбранного значения.
            # Его не так просто  преобразовать в тип объекта,
            # Поэтому нужно использовать либо трансляцию значений,
            # либо вызывать специальную функцию
            # внутри экземпляра комбобокса.
            if callable(item.bind_rule_reverse):
                item.value = unicode(item.bind_rule_reverse(value))
            elif isinstance(item.bind_rule_reverse, dict):
                item.value = unicode(item.bind_rule_reverse.get(value))
            else:
                raise ValueError(
                    'Invalid attribute type bind_rule_reverse.'
                    'Must be a function or a dict.'
                )

        elif isinstance(item, (
                fields.ExtFileUploadField,
                fields.ExtImageUploadField
        )):
            item.value = unicode(value)
            # Относительную URL ссылку до статики

            if hasattr(settings, 'MEDIA_URL'):
                item.file_url = '%s/%s' % (
                    settings.MEDIA_URL, unicode(value))
            else:
                item.file_url = None

            # Прибиндим оригинальные размеры thumbnail
            if isinstance(item, fields.ExtImageUploadField):
                if hasattr(settings, 'MEDIA_ROOT') and item.thumbnail:
                    ffile = os.path.join(
                        settings.MEDIA_ROOT, unicode(value))
                    dir_ = os.path.dirname(ffile)
                    file_name = os.path.basename(ffile)

                    thumb_file = os.path.join(
                        dir_,
                        (fields.ExtImageUploadField.MIN_THUMBNAIL_PREFIX +
                         file_name))
                    if os.path.exists(thumb_file):
                        thumb = Image.open(thumb_file)
                        item.thumbnail_size = thumb.size

        else:
            item.value = unicode(value)

    def get_value(obj, names):
        """
        Ищет в объекте obj поле с именем names и возвращает его значение.
        Если соответствующего поля не оказалось, то возвращает None

        names задается в виде списка, т.о. если его длина больше единицы,
        то имеются вложенные объекты и их надо обработать
        :param obj: объект или словарь
        :type obj: object или dict
        :param names: список имен
        :type names: list
        """

        # hasattr не работает для dict'a
        has_attr = (
            hasattr(obj, names[0])
            if not isinstance(obj, dict) else names[0] in obj)
        if has_attr:
            if len(names) == 1:
                if isinstance(obj, dict):
                    return obj[names[0]], True
                else:
                    value = getattr(obj, names[0])
                    return value() if callable(value) else value, True
            else:
                nested = (
                    getattr(obj, names[0])
                    if not isinstance(obj, dict) else obj[names[0]])
                return get_value(nested, names[1:])
        return None, False

    for field in all_fields:
        if not field.name:
            continue
        assert not isinstance(field.name, unicode), (
            'The names of all fields must not be instance of unicode')
        assert isinstance(field.name, str) and len(field.name) > 0, (
            'The names of all fields must be set for a successful '
            'assignment. Check the definition of the form.')
        # заполним атрибуты только те, которые не в списке исключаемых
        if not field.name in exclusion:

            names = field.name.split('.')
            new_val, has_attr = get_value(obj, names)
            if has_attr:
                new_val = new_val if new_val is not None else ''
                _assign_value(new_val, field)


def to_object(obj, all_fields, exclusion=None):
    """
    Метод выполнения обратного связывания данных.
    :param obj: объект
    :type obj: object
    :param exclusion: список исключаемых аттрибутов
    :type exclusion: list
    """
    from m3_ext.ui import fields
    from m3_ext.ui.fields import simple

    exclusion = exclusion or []

    def save_image(obj, name, field):
        """
        Работа с изображением или файлом
        :param field: поле
        :type field: потомок m3_ext.ui.fields.complex.BaseExtField
        :param obj: объект
        :param name: имя поля
        :type name: str
        """
        if hasattr(obj, name):
            l_field = getattr(obj, name)
            if (l_field and
                    os.path.exists(l_field.path) and
                        (os.path.basename(l_field.file.name)
                        ).lower() != (field.value).lower()
            ):
                # Сначало нужно удалить thumbnail картинки
                if isinstance(field, fields.ExtImageUploadField) and (
                        field.thumbnail):
                    current_dir = os.path.dirname(l_field.path)
                    basename = os.path.basename(l_field.path)

                    thumb_prefix = (
                        fields.ExtImageUploadField.MIDDLE_THUMBNAIL_PREFIX,
                        fields.ExtImageUploadField.MIN_THUMBNAIL_PREFIX,
                        fields.ExtImageUploadField.MAX_THUMBNAIL_PREFIX
                    )

                    for prefix in thumb_prefix:
                        thumb = os.path.join(
                            current_dir, prefix + basename)

                        if os.path.exists(thumb):
                            os.remove(thumb)

                # Файл изменился, удаляем старый
                l_field.delete(save=False)

            if field.memory_file:
                cont_file = ContentFile(field.memory_file.read())
                name_file = field.memory_file.name

                l_field = getattr(obj, name)
                l_field.save(name_file, cont_file, save=False)

                if isinstance(field, fields.ExtImageUploadField):
                    try:
                        img = Image.open(l_field.path)
                    except IOError:
                        # Кроме логирования ничего не нужно
                        logger.exception()
                        return

                    width, height = img.size
                    max_width, max_height = field.image_max_size

                    # Обрезаем изображение, если нужно
                    if width > max_width or height > max_height:
                        # curr_width, curr_height = get_img_size(
                        #     field.image_max_size, img.size)
                        # new_img = img.resize(
                        #     (curr_width, curr_height), Image.ANTIALIAS)
                        img.save(l_field.path)

                    if isinstance(field, fields.ExtImageUploadField) and (
                                field.thumbnail and field.memory_file):
                        current_dir = os.path.dirname(l_field.path)

                        # А так же нужно сохранять thumbnail картинки
                        # Состовляем лист thumbnail_size'ов
                        thumbnails = [(
                                          field.thumbnail_size,
                                          fields.ExtImageUploadField.MIN_THUMBNAIL_PREFIX
                                      )]

                        if field.middle_thumbnail_size:
                            thumbnails.append((
                                field.middle_thumbnail_size,
                                fields.ExtImageUploadField.MIDDLE_THUMBNAIL_PREFIX
                            ))

                        if field.max_thumbnail_size:
                            thumbnails.append((
                                field.max_thumbnail_size,
                                fields.ExtImageUploadField.MAX_THUMBNAIL_PREFIX
                            ))

                        for thumb in thumbnails:
                            # Генерируем thumbnails
                            # thumb_zise = get_img_size(size, img.size)
                            # new_img = img.resize(
                            #     thumb_zise, Image.ANTIALIAS)

                            base_name = os.path.basename(l_field.path)
                            tmb_path = os.path.join(
                                current_dir, thumb[1] + base_name)
                            img.save(tmb_path)

    def set_field(obj, names, value, field=None):
        """
        Ищет в объекте obj поле с именем names
        и присваивает значение value.
        Если соответствующего поля не оказалось, то оно не создается

        names задается в виде списка, т.о. если его длина больше единицы,
        то имеются вложенные объекты
        :param obj: объект
        :param names: список имен
        :param value: значение
        :param field: поле
        :type field: потомок m3_ext.ui.fields.complex.BaseExtField
        """

        # hasattr не работает для dict'a
        has_attr = (
            hasattr(obj, names[0])
            if not isinstance(obj, dict) else names[0] in obj)
        if has_attr:
            if len(names) == 1:
                if isinstance(obj, dict):
                    obj[names[0]] = value
                elif isinstance(field, (
                        fields.ExtFileUploadField,
                        fields.ExtImageUploadField
                )):
                    save_image(obj, names[0], field)

                else:
                    # Для id нельзя присваивать пустое значение!
                    # Иначе модели не будет сохраняться
                    if names[0] == 'id' and value == '':
                        return

                    setattr(obj, names[0], value)
            else:
                nested = (
                    getattr(obj, names[0])
                    if not isinstance(obj, dict) else obj[names[0]])
                set_field(nested, names[1:], value, field)

    def try_to_int(value, default=None):
        """
        Пробует преобразовать value в целое число,
        иначе возвращает default
        :param value: значение
        :param default: значение, возвращаемое, если value не указано
        :rtype: int
        """
        if not value:
            return default

        try:
            return int(value)
        except ValueError:
            return value

    def try_to_list(value):
        """
        Пробует преобразовать value в список
        :param value: значение
        :rtype: list
        """
        if not value:
            return []

        try:
            return json.loads(value)
        except ValueError:
            return value

    def convert_value(item):
        """
        Берет значение item.value,
        и конвертирует его в соответствии с типом item'a
        :type item: потомок m3_ext.ui.fields.complex.BaseExtField
        """
        val = item.value
        if isinstance(item, fields.ExtNumberField):
            if val:
                # для языков, где decimal разделяются не точкой
                if item.decimal_separator:
                    val = val.replace(item.decimal_separator, '.')
                try:
                    val = int(val)
                except ValueError:
                    try:
                        val = decimal.Decimal(val)
                    except decimal.InvalidOperation:
                        val = None
            else:
                val = None
        elif isinstance(item, fields.ExtStringField):
            val = unicode(val) if val is not None else None
        elif isinstance(item, simple.ExtAdvTimeField):
            if val and val.strip():
                d = datetime.datetime.strptime(val, "%H:%M:%S")
                val = d.time()
            else:
                val = None
        elif isinstance(item, simple.ExtDateTimeField):
            if val and val.strip():
                val = datetime.datetime.strptime(val, '%d.%m.%Y %H:%M:%S')
            else:
                val = None
        elif isinstance(item, fields.ExtDateField):
            #TODO уточнить формат дат
            if val and val.strip():
                d = datetime.datetime.strptime(val, '%d.%m.%Y')
                val = d.date()
            else:
                val = None
        elif isinstance(item, fields.ExtTimeField):
            if val and val.strip():
                d = datetime.datetime.strptime(val, '%H:%M')
                val = datetime.time(d.hour, d.minute, 0)
            else:
                val = None
        elif isinstance(item, fields.ExtCheckBox):
            val = True if val == 'on' else False
        elif isinstance(item, fields.ExtComboBox):
            # Комбобокс как правило передает id выбранного значения.
            #Его не так просто преобразовать в тип объекта,
            # т.к. мы ничего не знаем о структуре объекта.
            # Поэтому нужно использовать либо трансляцию значений,
            # либо вызывать специальную функцию внутри
            # экземпляра комбобокса.
            if hasattr(item, 'bind_rule'):
                if callable(item.bind_rule):
                    val = item.bind_rule(val)
                elif isinstance(item.bind_rule, dict):
                    val = item.bind_rule.get(val)
                else:
                    raise ValueError(
                        'Invalid attribute type bind_rule.'
                        'Must be a function or a dict.'
                    )
            else:
                val = try_to_int(val)

        elif isinstance(item, fields.ExtMultiSelectField):
            val = try_to_list(val)

        elif isinstance(item, fields.ExtDictSelectField):
            val = try_to_int(val)

        elif isinstance(item, fields.ExtHiddenField):
            val = try_to_int(val)
        return val

    # список m2m полей модели нужен,
    # чтобы проверить возможность их сохранения
    try:
        list_of_m2m = [
            x[0].name for x in obj._meta.get_m2m_with_model()]
    except AttributeError:
        list_of_m2m = []

    # Присваиваем атрибутам связываемого объекта соответствующие поля формы
    for field in all_fields:
        if not field.name:
            continue
        assert not isinstance(field.name, unicode), (
            'The names of all fields '
            'must not be instance of unicode'
        )
        assert isinstance(field.name, str) and len(field.name) > 0, (
            'The names of all fields must be set for a successful'
            ' assignment. Check the definition of the form.'
        )

        # заполним атрибуты только те, которые не в списке исключаемых
        if not field.name in exclusion:
            # запрещаем пытаться сохранять many2many для объекта без pk
            if hasattr(obj, 'pk'):
                if obj.pk is None and field.name in list_of_m2m:
                    raise ValueError(' '.join(
                        ["'%s' instance needs to have a primary" % (
                            obj.__class__.__name__),
                         "key value before a many-to-many "
                         "relationship can be used."]))

            names = field.name.split('.')
            set_field(obj, names, convert_value(field), field)
