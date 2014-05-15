Ext.define('Ext.ux.form.ImageUploadField', {
    extend: 'Ext.form.FileUploadField',
    xtype: 'imageuploadfield',

    /**
     * Класс иконки для выбора файла
     */
    iconClsSelectFile: 'x-form-image-icon',

    /**
     * Класс иконки для очистки файла
     */
    iconClsClearFile: 'x-form-image-clear-icon',

    /**
     * Класс иконки для предпросмотра файла
     */
    iconClsPreviewImage: 'x-form-image-preview-icon',

    thumbnailSize: [300, 300],

    prefixThumbnailImg: null,

    thumbnail: true,

    initComponent: function () {
        Ext.ux.form.ImageUploadField.superclass.initComponent.call(this);

        if (this.fileUrl) {

            var mass = this.fileUrl.split('/');
            var dir = mass.slice(0, mass.length - 1);
            var fileName = mass[mass.length - 1];
            var prefix = this.prefixThumbnailImg || '';
            var url = String.format('{0}/{1}{2}', dir.join('/'), prefix, fileName);

            if (this.fileUrl) {
                this.previewTip = new Ext.QuickTip({
                    id: 'preview_tip_window',
                    html: String.format('<a href="{0}" rel="lightbox"><image src="{1}" WIDTH={2} HEIGHT={3} OnClick=Ext.getCmp("preview_tip_window").hide()></a>',
                        this.fileUrl,
                        this.getFileUrl(url),
                        this.thumbnailSize[0],
                        this.thumbnailSize[1]),
                    autoHide: false,
                    width: this.thumbnailSize[0] + 10,
                    height: this.thumbnailSize[1] + 10
                });
            }
        }
    },
    renderHelperBtn: function () {
        if (this.thumbnail) {
            this.buttonPreview = new Ext.Button({
                renderTo: this.wrap, width: 16, cls: 'x-form-file-download', iconCls: this.iconClsPreviewImage, handler: this.clickHelperBtn, scope: this, hidden: this.value ? false : true, tooltip: {
                    text: 'Предварительный показ', width: 140
                }
            });
        }
    },
    getHelperBtn: function () {
        return this.buttonPreview;
    },
    clickHelperBtn: function () {
        var el = this.getEl();
        var xy = el.getXY();
        this.previewTip.showAt([xy[0], xy[1] + el.getHeight()]);
    },
    createFileInput: function () {
        this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: (this.prefixUploadField || '') + this.name,
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1,
            width: 20
        });

        Ext.QuickTips.unregister(this.fileInput);
        Ext.QuickTips.register({
            target: this.fileInput,
            text: 'Выбрать изображение',
            width: 130,
            dismissDelay: 10000
        });
    },
    onDestroy: function () {
        Ext.ux.form.ImageUploadField.superclass.onDestroy.call(this);
        Ext.destroy(this.previewTip);
    }
});
// Регистрация lightbox
Ext.ux.Lightbox.register('a[rel^=lightbox]');