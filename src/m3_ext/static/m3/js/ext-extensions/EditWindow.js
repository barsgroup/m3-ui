/**
 * Окно на базе Ext.m3.Window, которое включает такие вещи, как:
 * 1) Submit формы, если она есть;
 * 2) Навешивание функции на изменение поля, в связи с чем обновляется заголовок 
 * окна;
 * 3) Если поля формы были изменены, то по-умолчанию задается вопрос "Вы 
 * действительно хотите отказаться от внесенных измений";
 */

Ext.m3.EditWindow = Ext.extend(Ext.m3.Window, {
	/**
	 * Инициализация первонального фунционала
	 * @param {Object} baseConfig Базовый конфиг компонента
	 * @param {Object} params Дополнительные параметры 
	 */
	constructor: function(baseConfig, params){
		
		/**
		 * id формы в окне, для сабмита
		 */
		this.formId = null;
		
		/**
		 * url формы в окне для сабмита
		 */
		this.formUrl = null;
		
		/**
		 * url формы в окне для чтения данных
		 */
		this.dataUrl = null;

		/**
		 * Количество измененных полей
		 */
		this.changesCount = 0;

		/**
		 * Оргинальный заголовок
		 */
		this.originalTitle = null;


		if (params) {
			if (params.form) {
				if (params.form.id){
					this.formId = params.form.id;
				}
				if (params.form.url){
					this.formUrl = params.form.url;
				}
			}
			if (params.dataUrl){
				this.dataUrl = params.dataUrl;
			}
		}

		Ext.m3.EditWindow.superclass.constructor.call(this, baseConfig, params);
	}
	/**
	 * Инициализация дополнительного функционала
	 */
	,initComponent: function(){
		Ext.m3.EditWindow.superclass.initComponent.call(this);

		// Устанавливает функции на изменение значения
		this.items.each(function(item){
			this.setFieldOnChange(item, this);
		}, this);

		this.addEvents(
			/**
			 * Генерируется сообщение до начала запроса на сохранение формы
			 * Проще говоря до начала submit'a
			 * Параметры:
			 *   this - Сам компонент
			 *   @param {Object} submit - sumbit-запрос для отправки на сервер
			*/
			'beforesubmit'
            /*
             * Генерируется после сабмита формы, позволяет перекрыть, например, закрытие формы
             * Параметры:
             *   this - Сам компонент
             *   @param {Object} form - то что проходит в success обработчик сабмита
             *   @param {Object} action - то что проходит в success обработчик сабмита
             */
            ,'aftersubmit'
            /**
             * Генерируется при ошибке в момент сабмита формы, позволяет реагировать на ошибки сохранения
             * Параметры:
             *   this - Сам компонент
             *   @param {Object} form - то что проходит в success обработчик сабмита
             *   @param {Object} action - то что проходит в success обработчик сабмита
             */
            ,'submitfailed'
			/**
			 * Генерируется, если произошел запрос на закрытие окна
			 * (через win.close()) при несохраненных изменениях, а пользователь
			 * в диалоге, запрашивающем подтверждение закрытия без сохранения,
			 * отказался закрывать окно.
			 * Параметры:
			 *   this - Сам компонент
			 */
			 ,'closing_canceled'
			 /*
			  * Генерируеются перед отправкой запроса на сервер за обновленными данными.
			  * Можно изменить передаваемые параметры.
			  *   this - Сам компонент
			  *   @param {Object} load - Параметры ajax-запроса для отправки на сервер
			  */
			 ,'beforeloaddata'
			 /*
			  * Генерируеются после успешного запроса данных.
			  *   this - Сам компонент
			  *   @param {Object} action - Результаты запроса
			  */
			 ,'dataloaded'
			)

	}
	/**
	 * Получает форму по formId
	 */
	,getForm: function() {
		assert(this.formId, 'Не задан formId для формы');

		return Ext.getCmp(this.formId).getForm();
	}
	/**
	 * Проверяет форму на наличие некорректных полей, отдает список label'ов этих полей
	 */
    ,getInvalidNames: function(submittedForm){
                var invalidNames = [];
                submittedForm.items.each(function(f){
                   if(!f.validate()){
                       invalidNames.push('<br>- ' + f.fieldLabel)
                   }
                });
                return invalidNames
            }
    /**
	 * Сообщить пользователю об имеющихся некорректно заполненных полях.
	 * Будет использоваться для переопределения способа уведомления в потомках.
	 * @param {list} invalidNames
	 */
    ,showInvalidFields: function(invalidNames){
        Ext.Msg.show({
          title: 'Проверка формы',
          msg: 'На форме имеются некорректно заполненные поля:' + invalidNames.toString() + '.',
          buttons: Ext.Msg.OK,
          icon: Ext.Msg.WARNING
        });
    } 
	/**
	 * Сабмит формы
	 * @param {Object} btn
	 * @param {Object} e
	 * @param {Object} baseParams
	 */
	,submitForm: function(btn, e, baseParams){
		assert(this.formUrl, 'Не задан url для формы');

		var form = Ext.getCmp(this.formId).getForm();
		if (form){
            var invalidNames = this.getInvalidNames(form);
            if (invalidNames.length){
            	this.showInvalidFields(invalidNames);
			    return;
            }
		}
				
        var scope = this;
		var mask = new Ext.LoadMask(this.body, {msg:'Сохранение...'});
		var params = Ext.applyIf(baseParams || {}, this.actionContextJson || {});

        // На форме могут находиться компоненты, которые не являются полями, но их можно сабмитить
        // Находим такие компоненты по наличию атрибутов name и localEdit
        var getControls = function(items){
            var result = new Array();
            for (var i = 0; i < items.getCount(); i++){
                var control = items.get(i);
                if (control.name && control.localEdit){
                    result.push(control);
                } else if (control instanceof Ext.Container && control.items != undefined) {
                    var cc = getControls(control.items);
                    result = result.concat(cc);
                }
            }
            return result;
        }

        // В params сабмита добавляются пары, где ключ - имя компонента,
        // а значение - массив из записей стора этого компонента. Пример:
        // "mainGrid": [{"id": 1, "name": "First"}, {"id": 2, "name": "Second"}]
        var cControls = getControls(this.items);
        for (var i = 0; i < cControls.length; i++){
            var cControl = cControls[i];
            var cStore = cControl.getStore();
            var cStoreData = new Array();
            for (var k = 0; k < cStore.data.items.length; k++){
                cStoreData.push(cStore.data.items[k].data);
            }
            params[cControl.name] = Ext.util.JSON.encode(cStoreData);
        }

        // вытащим из формы все поля и исключим их из наших параметров, иначе они будут повторяться в submite
        var fElements = form.el.dom.elements || (document.forms[form.el.dom] || Ext.getDom(form.el.dom)).elements;
        var name;
        Ext.each(fElements, function(element){
            name = element.name;
            if (!element.disabled && name) {
                delete params[name];
            }
        });

        var submit = {
            url: this.formUrl,
            submitEmptyText: false,
            params: params,
            scope: this,
            success: function(form, action) {
                try {
                    if (this.fireEvent('aftersubmit', this, form, action)) {
                        this.fireEvent('closed_ok', action.response.responseText);
                        this.close(true);
                        smart_eval(action.response.responseText);
                    }
                } finally {
                    mask.hide();
                    this.disableToolbars(false);
                }
            },
            failure: function(form, action) {
                if (this.fireEvent('submitfailed', this, form, action)) {
                    uiAjaxFailMessage.apply(this, arguments);
                }
                mask.hide();
                this.disableToolbars(false);
            }
        };
        
        if (scope.fireEvent('beforesubmit', submit)) {
            this.disableToolbars(true);
        	mask.show();
        	form.submit(submit);
        }
	}
	
	 /**
	  * Функция на изменение поля
	  * @param {Object} sender
	  * @param {Object} newValue
	  * @param {Object} oldValue
	  */
	,onChangeFieldValue: function (sender, newValue, oldValue, window) {

		if (sender.originalValue !== newValue) {
			if (!sender.isModified) {
				window.changesCount++;
			}
			sender.isModified = true;
		} else {
			if (sender.isModified){
				window.changesCount--;
			}
					
			sender.isModified = false;
		}
		
		window.updateTitle();
		sender.updateLabel();
    },

    /**
     * Сбрасывает признаки модифицированности формы.
     * Пропадает звездочка в заголовке и возвращаются исходные стили контролов.
     * @param {Object} container контейнер с которого начинается сброс.
     */
    clearModificationFlag: function(container){
        var cont = container || this;
        assert(cont instanceof Ext.Container, 'Должен быть контейнер');

        this.changesCount = 0;
        this.updateTitle();

        cont.items.each(function(item){
            if (item instanceof Ext.form.Field && item.isEdit){
                item.originalValue = item.getValue();
                item.startValue = item.getValue();
                // Это не стандартные атрибуты. Они объявлены в m3.js
                item.isModified = false;
                item.updateLabel();
            } else if (item instanceof Ext.Container){
                this.clearModificationFlag(item);
            }
        }, this);
    }

	/**
	 * Рекурсивная установка функции на изменение поля
	 * @param {Object} item
	 */
	,setFieldOnChange: function (item, window){
		if (item) {
			if (item instanceof Ext.form.Field && item.isEdit) {
                if (item instanceof Ext.form.Checkbox){
                    // Комбобокс, в отличие от остальных полей, вызывает change только после blur, а
                    // в случае клика не работает совсем. Поэтому доверять можно только эвенту check.
                    item.on('check', function(scope, checked){
                        window.onChangeFieldValue(scope, checked, !checked, window);
                    });
                } else {
                    item.on('change', function(scope, newValue, oldValue){
                        window.onChangeFieldValue(scope, newValue, oldValue, window);
                    });
                }
			}
			if (item.items) {
				if (!(item.items instanceof Array)) {	
					item.items.each(function(it){					
            			window.setFieldOnChange(it, window);
        			});
				} else {
					for (var i = 0; i < item.items.length; i++) {
						window.setFieldOnChange(item.items[i], window);
					}
				}
			}
			//оказывается есть еще и заголовочные элементы редактирования
			if (item.titleItems) {
				for (var i = 0; i < item.titleItems.length; i++) {
					window.setFieldOnChange(item.titleItems[i], window);
				}
			}
		}
	}
	
	/**
	 * Обновление заголовка окна
	 */
	,updateTitle: function(){
		// сохраним оригинальное значение заголовка
		if (this.title !== this.originalTitle && this.originalTitle === null) {
			this.originalTitle = this.title;
		}

		if (this.changesCount !== 0) {
			this.setTitle('*'+this.originalTitle);
		} else {
			this.setTitle(this.originalTitle);
		}
	}
	/**
	 * Перегрузка закрытия окна со вставкой пользовательского приложения
	 * @param {Bool} forceClose Приндтельное (без вопросов) закрытие окна
	 * 
	 * Если forceClose != true и пользователь в ответ на диалог
	 * откажется закрывать окно, возбуждается событие 'closing_canceled'
	 */
	,close: function (forceClose) {
        if (this.changesCount !== 0 && !forceClose ) {
            if(this.fireEvent('beforeclose', this) !== false){
                Ext.Msg.show({
                    title: "Внимание",
                    msg: "Данные были изменены! Cохранить изменения?",
                    buttons: Ext.Msg.YESNOCANCEL,
                    fn: function(buttonId, text, opt){
                        if (buttonId === 'yes') {
                            this.submitForm();
                        } else if (buttonId === 'no') {
                            if(this.hidden){
                                this.doClose();
                            }else{
                                this.hide(null, this.doClose, this);
                            }
                        } else {
                           this.fireEvent('closing_canceled');
                        }
                    },
                    animEl: 'elId',
                    icon: Ext.MessageBox.QUESTION,
                    scope: this
                });
            }
        } else {
            Ext.m3.EditWindow.superclass.close.call(this);
        }
	}
    ,disableToolbars: function(disabled){
        var toolbars = [this.getTopToolbar(), this.getFooterToolbar(), 
                       this.getBottomToolbar()];
        for (var i=0; i<toolbars.length; i++){
            if (toolbars[i]){
                toolbars[i].setDisabled(disabled);
            }
        }
    }
    /**
     * Динамическая загрузка данных формы
     */
    ,loadForm: function() {        
        this.disableToolbars(true);
   
        var mask = new Ext.LoadMask(this.body, {msg:'Чтение данных...'});
        mask.show();
        if (this.fireEvent('beforeloaddata', this)) {
        	
        	assert(this.dataUrl, 'Не задан dataUrl для формы');
        	this.getForm().doAction('load', {
                url: this.dataUrl
                ,params: Ext.applyIf({isGetData: true}, this.actionContextJson || {})
                ,success: this.onSuccessLoadForm.createDelegate(this, [mask], true)
                ,failure: this.onFailureLoadForm.createDelegate(this, [mask], true)
               ,scope: this
            });
        }
    },
    /**
     * Функция выполнения в момент успешной загрузки данных на форму окна
     * @param form Ссылка на форму
     * @param action Действия объекта для операции
     * @param mask Параметр маскирования
     */
    onSuccessLoadForm: function(form, action, mask){
        // Сложным контролам, данные которых хранятся в Store, недостаточно присвоить value.
        // Для них передаются готовые записи Store целиком.
        var field,
            id,
            record,            
            complexData = action.result['complex_data'];
            
        for (var fieldName in complexData){
            field = form.findField(fieldName);
            assert(field instanceof Ext.form.TriggerField,
                String.format('Поле {0} не предназначено для загрузки данных', fieldName));
            
            id = complexData[fieldName].id;
            
            // Запись значения в стор только при условии, что оно не пустое
            if (id) {
                // Создаем запись и добавляем в стор
                record = new Ext.data.Record();
                record.set('id', id);
                record.set(field.displayField, complexData[fieldName].value);
                field.getStore().add([record]);

                // Устанавливаем новое значение
                field.setValue(id);
                field.collapse();
            } else {
                field.clearValue();
            }
        }
        
        mask.hide();
        this.disableToolbars(false);
        this.fireEvent('dataloaded', action);
    },
    /**
     * Функция, в случае ошибочной загрузки данных в форму окна
     * @param form Ссылка на форму
     * @param action Действия объекта для операции
     * @param mask Параметр маскирования
     */
    onFailureLoadForm: function (form, action, mask){
        uiAjaxFailMessage.apply(this, arguments);
        mask.hide();
        this.disableToolbars(false);
   }
})
