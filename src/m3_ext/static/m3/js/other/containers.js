/**
 * Функции рендера компонентов-контейнеров
 * @author: prefer
 */
/**
 * Создание расширенного дерева, на базе внешего компонента
 * @param {Object} baseConfig Базовый конфиг для компонента
 * @param {Object} params Дрополнительные параметра для правильной конф-ии
 */
function createAdvancedTreeGrid(baseConfig, params){
	return new Ext.m3.AdvancedTreeGrid(baseConfig, params);
}

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
	var adv_combo = new Ext.m3.AdvancedComboBox(baseConfig, params);
//	adv_combo.on('beforeselect',function(){
//		console.log('beforeselect');
//	});
//	adv_combo.on('beforequery',function(e){
//		
//		//e.cancel = true;
//		console.log('beforequery');
//	});
//	adv_combo.on('change',function(){
//		console.log('change');
//	});
//	adv_combo.on('beforerequest',function(){
//		console.log('beforerequest');
//		return false;
//	});
//	adv_combo.on('changed',function(){
//		console.log('changed');
//		//return false;
//	});
//		adv_combo.on('afterselect',function(){
//		console.log(arguments);
//		console.log('afterselect');
//		//return false;
//	});
	
	return adv_combo;
}

/**
 * Создание своего переопределенного компонента DateField
 * @param {Object} baseConfig
 */
function createAdvancedDataField(baseConfig, params){
	return new Ext.m3.AdvancedDataField(baseConfig, params);
}