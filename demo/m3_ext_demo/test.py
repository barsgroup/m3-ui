# coding: utf-8

from unittest.case import TestCase
from selenium import webdriver

__author__ = 'prefer'


class ExtJSTestCase(TestCase):

    location = 'http://localhost:8000'
    url = None

    def setUp(self):
        self.browser = webdriver.Firefox()
        self.addCleanup(self.browser.quit)

        self.prepare()
        self.win = self.browser.find_element_by_class_name('x-window')

    def prepare(self):
        assert self.url
        self.browser.get('%s%s' % (self.location, self.url))
        body = self.browser.find_element_by_tag_name('body')
        text = body.text

        self.browser.get(self.location)
        self.browser.execute_script(text)


class TestWindow(ExtJSTestCase):
    url = '/ui/simple-window'

    def test_window(self):

        buttons = self.win.find_elements_by_class_name('x-btn')
        assert len(buttons) == 2


class TestForm(ExtJSTestCase):
    url = '/ui/simple-window2'

    def test_form(self):

        form = self.win.find_element_by_class_name('x-plain')
        assert form.text == u'Просто форма'

        button = self.win.find_element_by_class_name('x-btn')
        assert button.size['width'] == 200


class TestJsonStore(ExtJSTestCase):
    url = '/ui/form-jstore'

    def test_json_store(self):
        assert u'Регистрация' in self.win.text

        form = self.win.find_element_by_class_name('x-plain')
        assert u'Укажите персональные данные' in form.text

        fname, lname, address = form.find_elements_by_class_name('x-form-item ')

        assert fname.text == u'Имя:'
        fname_input = fname.find_element_by_class_name('x-form-text')
        assert fname_input.get_attribute('value') == u'Иван'

        assert lname.text == u'Фамилия:'
        lname_input = lname.find_element_by_class_name('x-form-text')
        assert lname_input.get_attribute('value') == u'Петров'

        assert address.text == u'Адрес проживания:'
        address_input = address.find_element_by_class_name('x-form-text')
        assert address_input.get_attribute('value') == u'Проспект победы д. 147 кв 15'


class TesGridtDataStore(ExtJSTestCase):
    url = '/ui/grid-data-store'

    def test(self):
        pass


class TestGridJsonStore(ExtJSTestCase):
    url = '/ui/grid-json-store'

    def test(self):
        pass


class TestDictSelectField(ExtJSTestCase):
    url = '/ui/dict-select-field'

    def test(self):
        pass


class TestTextArea(ExtJSTestCase):
    url = '/ui/text-area-checkbox'

    def test(self):
        pass


class TestCheckBox(ExtJSTestCase):
    url = '/ui/text-area-checkbox'

    def test(self):
        pass


class TestFields(ExtJSTestCase):
    url = '/ui/number-date-fields'

    def test(self):
        pass


class TestBandedGrid(ExtJSTestCase):
    url = '/ui/grid-column-header-grouping'

    def test(self):
        pass


class TestTree(ExtJSTestCase):
    url = '/ui/base-tree'

    def test(self):
        pass


class TestComboTabPanel(ExtJSTestCase):
    url = '/ui/combo-tabpanel-fields'

    def test(self):
        pass


class TestToolbar(ExtJSTestCase):
    url = '/ui/toolbar-panel'

    def test(self):
        pass


class TestValidators(ExtJSTestCase):
    url = '/ui/field_validators'

    def test(self):
        pass


class TestDictWindow(ExtJSTestCase):
    url = '/ui/dictionary-window'

    def test(self):
        pass


class TestWindowBorderLayout(ExtJSTestCase):
    url = '/ui/layout-border'

    def test(self):
        pass


class TestFindByName(ExtJSTestCase):
    url = '/ui/find-by-name'

    def test(self):
        pass


class TestDictSelectTree(ExtJSTestCase):
    url = '/ui/tree-dict-window'

    def test(self):
        pass


class TestSearchField(ExtJSTestCase):
    url = '/ui/search-field'

    def test(self):
        pass


class TestTableForm(ExtJSTestCase):
    url = '/ui/table-form'

    def test(self):
        pass


class TestSelectionModel(ExtJSTestCase):
    url = '/ui/selection-model'

    def test(self):
        pass


class TestObjectTree(ExtJSTestCase):
    url = '/ui/object-tree'

    def test(self):
        pass


class TestFieldSet(ExtJSTestCase):
    url = '/ui/fieldset'

    def test(self):
        pass


class TestGridFixedColumns(ExtJSTestCase):
    url = '/ui/grid-locking-column'

    def test(self):
        pass


class TestGridFilter(ExtJSTestCase):
    url = '/ui/grid-column-filter'

    def test(self):
        pass


class TestGridWithQuickTips(ExtJSTestCase):
    url = '/ui/grid-with-qtip'

    def test(self):
        pass


class TestLiveGrid(ExtJSTestCase):
    url = '/ui/livegrid'

    def test(self):
        pass


class TestGridExport(ExtJSTestCase):
    url = '/ui/exportgrid'

    def test(self):
        pass


class TestDebugLiveGrid(ExtJSTestCase):
    url = '/ui/livegrid-bug'

    def test(self):
        pass


class TestObjectSelectionPanel(ExtJSTestCase):
    url = '/ui/object-grid'

    def test(self):
        pass


class TestLockingGroupingGrid(ExtJSTestCase):
    url = '/ui/locking-grouping-grid'

    def test(self):
        pass


class TestToolBarElements(ExtJSTestCase):
    url = '/ui/toolbar-item'

    def test(self):
        pass


class TestRadioGroup(ExtJSTestCase):
    url = '/ui/radio-group'

    def test(self):
        pass


class TestTitlePanel(ExtJSTestCase):
    url = '/ui/title-panel'

    def test(self):
        pass


class TestGridCheckColumn(ExtJSTestCase):
    url = '/ui/grid-check-column'

    def test(self):
        pass


class TestGridRowSelectionModel(ExtJSTestCase):
    url = '/ui/grid-row-selection-model'

    def test(self):
        pass


class TestGridGroupingView(ExtJSTestCase):
    url = '/ui/grid-grouping-view'

    def test(self):
        pass


class TestLiveGridCheckBoxSelectionModel(ExtJSTestCase):
    url = '/ui/live-grid-checkbox-selection-model'

    def test(self):
        pass


class TestLiveGridRowSelModel(ExtJSTestCase):
    url = '/ui/live-grid-rows-selection-model'

    def test(self):
        pass


class TestTreeNode(ExtJSTestCase):
    url = '/ui/tree-node'

    def test(self):
        pass


class TestUploadFields(ExtJSTestCase):
    url = '/ui/upload-fields'

    def test(self):
        pass


class TestMultiSelectField(ExtJSTestCase):
    url = '/ui/multi-select-field'

    def test(self):
        pass


class TestSimpleFields(ExtJSTestCase):
    url = '/ui/simple-fields'

    def test(self):
        pass


class TestBaseListWindow(ExtJSTestCase):
    url = '/ui/base-list-window'

    def test(self):
        pass


class TestJsonWriter(ExtJSTestCase):
    url = '/ui/json-writer'

    def test(self):
        pass


class TestMessageBox(ExtJSTestCase):
    url = '/ui/message-box'

    def test(self):
        pass