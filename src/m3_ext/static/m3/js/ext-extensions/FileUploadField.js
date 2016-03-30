Ext.ns('Ext.ux.form');

Ext.ux.form.FileUploadField = Ext.extend(Ext.form.TextField,  {

    /**
     * @cfg {Object} buttonCfg A standard {@link Ext.Button} config object.
     */

    // private
    readOnly: true

    /**
     * @hide
     * @method autoSize
     */
    ,autoSize: Ext.emptyFn

     /**
     * Класс иконки для выбора файла
     */
    ,iconClsSelectFile: 'x-form-file-icon'

    /**
     * Класс иконки для очистки файла
     */
    ,iconClsClearFile: 'x-form-file-clear-icon'

    /**
     * Класс иконки для скачивания файла
     */
    ,iconClsDownloadFile: 'x-form-file-download-icon'

    /**
     * Множественный выбор файлов
     */
    ,multiple: false
    
    ,constructor: function(baseConfig, params){
        if (params) {
            if (params.prefixUploadField) {
                this.prefixUploadField = params.prefixUploadField;
            }
            if (params.fileUrl) {
                this.fileUrl = params.fileUrl;
            }                            
            if (baseConfig.readOnly) {
                this.readOnlyAll = true;
            }
            if (params.possibleFileExtensions) {
                this.possibleFileExtensions = params.possibleFileExtensions;
            }
            if (params.multiple) {
                this.multiple = params.multiple;
            }
        }

        Ext.ux.form.FileUploadField.superclass.constructor.call(this, baseConfig, params);
    }

    // private
    ,initComponent: function(){
        Ext.ux.form.FileUploadField.superclass.initComponent.call(this);

        this.addEvents(
            /**
             * @event fileselected
             * Fires when the underlying file input field's value has changed from the user
             * selecting a new file from the system file selection dialog.
             * @param {Ext.ux.form.FileUploadField} this
             * @param {String} value The file value returned by the underlying file input field
             */
            'fileselected',
            
            /**
             * Отрабатывает, когда изменилось значение
             */
            'change',
            
            /**
             * Событие, возникающее до изменения значения поля. Если вернуть false
             * то изменения поля не будет, true - изменить значение поля.
             */
            'beforechange'
        );
    }

    // private
    ,onRender : function(ct, position){
        Ext.ux.form.FileUploadField.superclass.onRender.call(this, ct, position);

        // Используем название файла
        this.value = this.getFileName();

        this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-file-wrap'});
        this.el.addClass('x-form-file-text');
        //this.el.dom.removeAttribute('name');

        this.createFileInput();

        var btnCfg = Ext.applyIf(this.buttonCfg || {}, {
            iconCls: this.iconClsSelectFile
        });
        this.buttonFile = new Ext.Button(Ext.apply(btnCfg, {
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-btn' + (btnCfg.iconCls ? ' x-btn-icon' : '')
            ,tooltip: {
                text:'Выбрать файл'
                ,width: 150
            }
        }));

        this.buttonClear = new Ext.Button({
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-clear'
            ,iconCls: this.iconClsClearFile
            ,handler: this.clickClearField
            ,scope: this
            ,hidden: this.value ? false : true
            ,tooltip: {
                text:'Очистить'
                ,width: 65
            }
        });

        this.renderHelperBtn();

        this.bindListeners();
        this.resizeEl = this.positionEl = this.wrap;

        if (this.readOnlyAll) {
            this.buttonFile.setDisabled(true);
            // Перекрывает невидимый индекс
            this.buttonFile.getEl().setStyle('z-index', 3);
            this.buttonClear.setDisabled(true);
            if (this.getHelperBtn() ) {
                this.getHelperBtn().setDisabled(true);
            }
        }

    }
    ,renderHelperBtn: function() {
        this.buttonDownload = new Ext.Button({
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-download'
            ,iconCls: this.iconClsDownloadFile
            ,handler: this.clickDownload
            ,scope: this
            ,hidden: this.value ? false : true
             ,tooltip: {
                text:'Загрузить'
                ,width: 65
            }
        });
    }
    ,getHelperBtn: function(){
        return this.buttonDownload;
    }
    ,bindListeners: function(){
        this.fileInput.on({
            scope: this,
            mouseenter: function() {
                this.buttonFile.addClass(['x-btn-over','x-btn-focus'])
            },
            mouseleave: function(){
                this.buttonFile.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
            },
            mousedown: function(){
                this.buttonFile.addClass('x-btn-click')
            },
            mouseup: function(){
                this.buttonFile.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
            },
             change: function(){
                 if (!this.isFileExtensionOK()){
                     Ext.Msg.show({
                       title:'Внимание'
                       ,msg: 'Неверное расширение файла'
                       ,buttons: Ext.Msg.OK
                       ,fn: Ext.emptyFn
                       ,animEl: 'elId'
                       ,icon: Ext.MessageBox.WARNING
                    });
                     this.reset();
                     return;
                 }
                 if (this.multiple) {
                     var v,
                         filenames = [];
                     Ext3.each(this.fileInput.dom.files, function (item) {
                         filenames.push(item.name);
                     });
                     v = filenames.join(';')
                 } else {
                     var v = this.fileInput.dom.value;
                 }
                 if (this.fireEvent('beforechange', this, v)) {	                 		                 
	                 this.setValue(v);
	                 this.fireEvent('fileselected', this, v);
	                 this.fireEvent('change', this, v);
	                 
	                 if (v) {
	                    // Очищаем ссылку на файл
	                    this.fileUrl = null;
	
	                    if (!this.buttonClear.isVisible()) {
	                        this.buttonClear.show();
	                        this.el.setWidth( this.el.getWidth() - this.buttonClear.getWidth());
	                    }
	                 }
                 }
             }
        });
    }

    ,createFileInput : function() {
        var fileInputParams = {
            id: this.getFileInputId(),
            name: (this.prefixUploadField || '') + this.name,
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1,
            width: 20
        };
        if (this.multiple) {
            fileInputParams['multiple'] = this.multiple;
        }
        this.fileInput = this.wrap.createChild(fileInputParams);

        Ext.QuickTips.unregister(this.fileInput);
        Ext.QuickTips.register({
            target: this.fileInput,
            text: 'Выбрать файл',
            width: 86,
            dismissDelay: 10000
        });
    }

    ,reset : function(){
        this.fileInput.remove();
        this.createFileInput();
        this.bindListeners();
        Ext.ux.form.FileUploadField.superclass.reset.call(this);
    }

    // private
    ,getFileInputId: function(){
        return this.id + '-file';
    }

    // private
    ,onResize : function(w, h) {
        Ext.ux.form.FileUploadField.superclass.onResize.call(this, w, h);

        this.wrap.setWidth(w);

        var w = this.wrap.getWidth() - this.buttonFile.getEl().getWidth();
        var btnClearWidth = this.buttonClear.getWidth();
        if (btnClearWidth) {
            w -= btnClearWidth;
        }
        var btnDonwloadWidth = this.getHelperBtn() ? this.getHelperBtn().getWidth() : 0;
        if (btnDonwloadWidth) {
            w -= btnDonwloadWidth;
        }

        this.el.setWidth(w);

    }

    // private
    ,onDestroy: function(){
        Ext.ux.form.FileUploadField.superclass.onDestroy.call(this);
        Ext.QuickTips.unregister(this.fileInput);
        Ext.destroy(this.fileInput, this.buttonFile, this.buttonClear,
            this.getHelperBtn(), this.wrap);
    }

    ,onDisable: function(){
        Ext.ux.form.FileUploadField.superclass.onDisable.call(this);
        this.doDisable(true);
    }

    ,onEnable: function(){
        Ext.ux.form.FileUploadField.superclass.onEnable.call(this);
        this.doDisable(false);

    }

    // private
    ,doDisable: function(disabled){
        this.fileInput.dom.disabled = disabled;
        this.buttonFile.setDisabled(disabled);
        this.buttonClear.setDisabled(disabled);
        if(this.getHelperBtn()) {
            this.getHelperBtn().setDisabled(disabled);
        }
    }

    // private
    ,preFocus : Ext.emptyFn

    // private
    ,alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    }

    //private
    ,clickClearField: function(){    	
    	if (this.fireEvent('beforechange', this, '')){
			this.clearFeild();
    	}
    }
	,clearFeild: function(){
		this.reset();
        this.setValue('');
        this.fireEvent('change', this, '');
        var width = this.el.getWidth() + this.buttonClear.getWidth();
        if (this.getHelperBtn()){
            width += (this.getHelperBtn().isVisible() ? this.getHelperBtn().getWidth() : 0);
            this.getHelperBtn().hide();
        }
        this.el.setWidth(width);
        this.buttonClear.hide();
	},
    
    getFileUrl: function(url){
        return document.location.protocol + '//' + document.location.host +
            '/' + url;
    }
    ,clickDownload: function(){
        var fUrl = this.getFileUrl(this.fileUrl);
        if (fUrl){
            window.open(fUrl);
        }
    }
    ,getFileName: function(){
    	return this.value ? this.value.split('/').reverse()[0] : "";
    }
    ,isFileExtensionOK: function(){
        var fileExtension = this.fileInput.dom.value.split('.');
        if (fileExtension.length > 0){
            //Поиск на существование элемента внутри массива
            return this.possibleFileExtensions ? this.possibleFileExtensions.split(',')
                    .indexOf(fileExtension[fileExtension.length-1].toLowerCase()) != -1 : true;
        }
        return false;
    }
    //override
    ,setReadOnly: function(readOnly){
         Ext.ux.form.FileUploadField.superclass.setReadOnly.call(this, readOnly);
    }
});

Ext.reg('fileuploadfield', Ext.ux.form.FileUploadField);

// backwards compat
Ext.form.FileUploadField = Ext.ux.form.FileUploadField;
