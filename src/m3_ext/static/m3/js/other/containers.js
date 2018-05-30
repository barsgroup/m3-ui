/**
 * Функции рендера компонентов-контейнеров
 * @author: prefer
 */

/**
 * Создание грида
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createGridPanel(baseConfig, params){
  if (baseConfig.editor) {
    return new Ext.m3.EditorGridPanel(baseConfig, params);
  }
  else {
	  return new Ext.m3.GridPanel(baseConfig, params);
	}
}

/**
 * Создание объектного грида
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createObjectGrid(baseConfig, params){
  if (baseConfig.editor) {
    return new Ext.m3.EditorObjectGrid(baseConfig, params);
  }
  else {
	  return new Ext.m3.ObjectGrid(baseConfig, params);
	}
}

/**
 * Создание объектного дерева
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createObjectTree(baseConfig, params){
	return new Ext.m3.ObjectTree(baseConfig, params);
}

/**
 * Создание расширенного комбобокса
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createAdvancedComboBox(baseConfig, params){
	return new Ext.m3.AdvancedComboBox(baseConfig, params);
}

/**
 * Создание переопределенного комбобокса с динамическим обновлением стор при прокрутке списка
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createAdvancedScrollComboBox(baseConfig, params){
	return new Ext.m3.AdvancedScrollComboBox(baseConfig, params);
}

/**
 * Создание своего переопределенного компонента DateField
 * @param {Object} baseConfig
 */
function createAdvancedDataField(baseConfig, params){
	return new Ext.m3.AdvancedDataField(baseConfig, params);
}

/**
 * Создание своего переопределенного компонента MultipleDateField
 * @param {Object} baseConfig
 */
function createMultipleDateField(baseConfig, params){
	return new Ext.m3.MultipleDateField(baseConfig, params);
}