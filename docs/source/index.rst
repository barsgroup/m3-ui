.. m3-ext documentation master file, created by
   sphinx-quickstart on Sun Mar 30 22:19:26 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Графический интерфейс m3-ext
**********************************

Представляет собой реализацию ExtJs контролов (версии 3.4) и своих наработок (см. ExtObjectGrid, ExtDictSelectField, ExtDictionaryWindow, etc.), описываемую на языке Python.
Каждый визуальный класс, отображаемый в браузере, имеет метод render, который возвращает js-код данного компонента. Код генерируется на сервере.
Сложные контролы имеют шаблоны (см. m3_ext.ui.templates), в которых описаны правила рендеринга.
Исторически все контролы подразумевали шаблоны, но в силу медленности шаблонизатора django было принято писать рендеринг внутри метода render, а сложные части выносить в отдельные статические js файлы (см. m3_ext/static/m3/js)

На клиент (браузер) приходит js-код, состоящий из extjs компонент, который передается как параметр в js функцию eval.


Содержание:
***********

.. toctree::
   :maxdepth: 2

   fields
   grids
   trees
   windows
   examples



Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

