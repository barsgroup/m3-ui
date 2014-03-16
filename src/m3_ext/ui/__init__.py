#coding:utf-8

from uuid import uuid4

from django.template import Context
from django.template.loader import get_template


def render_component(component):
    """
    :param component: компонент
    :type component: BaseExtComponent или наследник
    :rtype: str
    """
    context = Context({'component': component, 'self': component})
    template = get_template(component.template)
    return template.render(context)


def render_template(template_name, variables=None):
    """
    :param template_name: имя шаблона
    :type template_name: str
    :param variables: словарь параметров
    :type variables: dict
    :rtype: str
    """
    context = Context(variables or {})
    template = get_template(template_name)
    return template.render(context)


def normalize(str):
    """
    Конвертирует строку в вид, понятный javascript'у
    :param str: строка
    :type str: str
    :rtype: str
    """
    return str.replace(
        '\r', '\\r'
    ).replace(
        '\n', '\\n'
    ).replace(
        '"', '\\"'
    ).replace(
        "'", "\\'"
    )


def generate_client_id():
    """
    Генерирует уникальный id для визуального компонента.
    :rtype: str
    """
    return 'cmp_' + str(uuid4())[0:8]


def get_img_size(src_size, dest_size):
    """
    Возвращает размеры изображения в пропорции с оригиналом исходя из того,
    как направлено изображение (вертикально или горизонтально)
    :param src_size: размер оригинала
    :type src_size: list / tuple
    :param dest_size: конечные размеры
    :type dest_size: list / tuple
    :rtype: tuple
    """
    width, height = dest_size
    src_width, src_height = src_size
    if height >= width:
        return (int(float(width) / height * src_height), src_height)
    return (src_width, int(float(height) / width * src_width))


def generate_id():
    """
    Генерирует восьмизначный random.
    :rtype: str
    """
    return str(uuid4())[0:8]
