#!/usr/bin/env python
# coding: utf-8
u"""Выполняет все проверки."""
from os import path
import unittest


def main():
    u"""Главная функция, запускаемая как shell-скрипт."""
    loader = unittest.TestLoader()
    suite = loader.discover(path.abspath(path.dirname(__file__)),
                            pattern='tests.py')
    runner = unittest.TextTestRunner(buffer=True)
    runner.run(suite)

if __name__ == '__main__':
    main()
