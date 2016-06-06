# coding: utf-8
u"""Тесты для модуля fields."""
import unittest

from m3_ext.ui.fields.simple import ExtStringField


class SimpleTest(unittest.TestCase):
    u"""Тест для simple.py."""

    def test_ext_string_field(self):
        field = ExtStringField(name='test_string_field')
        field.value = 1
        with self.assertRaises(RuntimeError):
            field.render()
