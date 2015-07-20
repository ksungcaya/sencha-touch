Ext.define('Ext.ux.upload.Uploader', {
    extend: 'Ext.ux.upload.Button',
    xtype: 'uploader',
    alias: 'widget.uploader',
    requires: [
        'Ext.Ajax',
        'Ext.Array',
        'Ext.Panel',
        'Ext.field.FileInput',
        'Ext.ux.upload.Button',
        'Ext.ux.upload.File'
    ],

    config: {
        multipleText: 'Multiple',
        singleText: 'Single',
        showOptions: false,
        optionsPickerConfig: null,
        uploadableFiles: [],
        uploadedFiles: [],
        failedUploads: [],
        requests: []
    },

    files: [],

    callback: {
        fn: null,
        scope: null
    },

    requestsLength: 0,

    uploadingCanceled: false,

    // @private
    initialize: function() {
        var me = this;

        me.callParent();

        if (me.getShowOptions()) {
            me.getComponent().hide();
        }

        me.element.on({
            scope: me,
            tap: 'onTap'
        });
    },

    /**
     * @override
     */
     getFiles: function() {
        return this.files;
     },

     /**
     * @override
     */
     setFiles: function(value) {
        this.files = value;

        return this;
     },

    /**
     * Called when the element was tapped
     * @param  {Object} instance where the event was called
     * @return {Ext.Panel Object}
     */
    onTap: function(me) {

        if (this.getShowOptions()) {
            return this.showOptions();
        }
    },

    /**
     * Called when the value changes on this input item
     * @cfg me {Ext.field.FileInput}
     * @cfg value {String} new Value
     * @cfg startValue {String} Original Value
     */
    onOptionChange: function(me, value, startValue) {
        var files = me.getFiles(),
            len = files.length,
            newFiles = [];

        if (len !== 0) {

            for (var i = 0; i < len; i++) {
                var newFile = this.addToUploadFiles(files[i]);
                    newFile && newFiles.push(newFile);
            }
            
            this.setValue(value);
            this.hideOptions();

            this.fireEvent('fileadded', this, newFiles, this.getUploadableFiles());

        }

    },

    /**
     * Adds the new file to the current files to be uploaded.
     * 
     * @param {File object} newFile
     */
    addToUploadFiles: function(newFile) {
        var me = this,
            files = this.getFiles();

            // console.log('add to upload files[files]: ', files);
            // console.log('add to upload files[newFile]: ', newFile);

            // console.log('file exists: ', me.fileExists(newFile, files));
        if ( ! me.fileExists(newFile, files)) {

            var uploadFile = me.createUploadFile(newFile);

            uploadFile.on({
                scope: me,
                destroy: 'onUploadFileDestroy'
            });

            me.getUploadableFiles().push(uploadFile);
            files.push(newFile);

            return uploadFile;
        }
    },

    /**
     * Create a new instance of Upload file
     * @param  {File object} newFile 
     * @return {Object} upload file instance
     */
    createUploadFile: function(newFile) {

        return Ext.create('Ext.ux.upload.File', { 
                fileData: {
                    file: newFile,
                    name: this.getName()
                } 
            });
    },

     /**
     * Check from the current files if the new file already exists.
     * @param  {File object} file
     * @param  {Array} searchFiles
     * @return {Boolean}
     */
    fileExists: function(file, searchFiles) {

        // console.log('file exists [file]: ', file);
        // console.log('file exists [searchFiles]: ', searchFiles);

        var index = this.getFileIndex(file, searchFiles);

        if (index !== -1) {
            return true;
        }

        return false;
    },

    /**
     * Get the index of the file from the provided files to search
     * @param  {Object} file
     * @param  {Array of Objects}
     * @return {int}
     */
    getFileIndex: function(file, searchFiles) {
        var len = searchFiles.length,
            i = 0,
            searchFile;

        for (; i < len; i++) {
            searchFile = searchFiles[i];

            if (searchFile.name === file.name 
                && searchFile.lastModifiedDate.getTime() === file.lastModifiedDate.getTime()
                && searchFile.size === file.size) {
                return i;
            }
        }

        return -1;
    },

    /**
     * Called when an uploadable file was destroyed
     * This method will delete the file from the uploadable files and files
     * of the uploader instance.
     * 
     * @param  {Object} me
     * @return {Void}
     */
    onUploadFileDestroy: function(me) {
        var fileData = me.getFileData();

        if (fileData) {
            this.removeFile(fileData.file);
        }
    },

    /**
     * Remove a file from and files array.
     * 
     * @param  {File object} file
     * @return {Void}
     */
    removeFile: function(file) {
        var files = this.getFiles(),
            index = this.getFileIndex(file, files);

        if (index !== -1) {
            files.splice(index, 1);
            this.removeUploadableFile(file);
        }

        if (files.length === 0) {
            this.fireEvent('allfilesremoved', this);
        }
    },

    /**
     * Remove a file from and uploadable files array.
     * 
     * @param  {File object} file
     * @return {Void}
     */
    removeUploadableFile: function(file) {
        var uploadableFiles = this.getUploadableFiles(),
            len = uploadableFiles.length,
            i = 0;

        for (; i < len; i++) {
            var fileData = uploadableFiles[i].getFileData();

            if (fileData 
                && fileData.file.name === file.name
                && fileData.file.lastModifiedDate.getTime() === file.lastModifiedDate.getTime()
                && fileData.file.size === file.size
                ) {
                uploadableFiles.splice(i, 1);
                break;
            }
        }
    },

    /**
     * Start the file upload
     * @param  {Object} options
     * @return {Boolean}
     */
    uploadStart: function(options) {

        if ( ! options.url) {
            Ext.Logger.error('No URL specified');
        }

        var params = options.params || {},
            uploadableFiles = this.getUploadableFiles(),
            len = this.requestsLength = uploadableFiles.length,
            i = 0;

        this.callback.fn = options.callback;
        this.callback.scope = options.scope;

        // reset failed uploads
        this.setFailedUploads([]);

        for (; i < len; i++) {
            var file = uploadableFiles[i];

            file.on({
                scope: this,
                uploadsuccess: 'uploadSuccess',
                uploadaborted: 'uploadAborted',
                uploadfailed: 'uploadFailed'
            });

            file.upload(options.url, params);
        }
    },

    /**
     * Abort the uploading process
     * @return {Void}
     */
    cancelUploading: function() {
        var uploadableFiles = this.getUploadableFiles(),
            len = uploadableFiles.length,
            i = 0,
            file;

        this.uploadingCanceled = true;

        for (; i < len; i++) {
            file = uploadableFiles[i];
            file.cancelUpload();
        }
    },

    /**
     * Called when an upload file has been uploaded successfully.
     * @param  {Object} Upload file instance
     * @param  {Object} Response upload request response
     * @param  {Object} fileData
     * @return {Function} Callback function
     */
    uploadSuccess: function(me, response, fileData) {
        this.getUploadedFiles().push(me);
        this.removeFile(fileData.file);
        this.requestComplete(me);
    },

    /**
     * Called when an upload file has been aborted.
     * @param  {Object} Upload file instance
     * @param  {Object} request
     * @param  {Object} fileData
     * @return {Function} Callback function
     */
    uploadAborted: function(me, request, fileData) {
        this.requestComplete(me);
    },

    /**
     * Called when an upload file failed to upload
     * @param  {Object} Upload file instance
     * @param  {Object} Ajax request
     * @param  {Object} fileData
     */
    uploadFailed: function(me, request, fileData) {
        this.getFailedUploads().push(request);
        this.requestComplete(me);
    },

    // @private
    requestComplete: function(uploadFile) {
        var requestsLength = --this.requestsLength;

        this.removeFileEventListeners(uploadFile);

        if (requestsLength === 0) {

            // Fire completed upload only if there are no pending requests
            // and the uploading was not canceled and no failed uploads
            if (this.uploadingComplete()) {
                this.fireEvent('uploadcomplete', this);
            }

            Ext.callback(this.callback.fn, this.callback.scope, [this, requestsLength]);
        }
    },

    /**
     * Check if the upload is complete
     * 
     * @return {Boolean} [description]
     */
    uploadingComplete: function() {
        return ! this.uploadingCanceled && this.getFailedUploads().length === 0 && this.requestsLength === 0;
    },

    /**
     * Remove all listeners attached to upload file instance.
     * @param  {Object} upload file instance
     * @return {Void}
     */
    removeFileEventListeners: function(uploadFile) {
        uploadFile.un({
            scope: this,
            uploadsuccess: 'uploadSuccess',
            uploadaborted: 'uploadAborted',
            uploadfailed: 'uploadFailed'
        });
    },

    // @private
    updateShowOptions: function(show) {
        // var input = this.input;
        var input = this.getComponent();

        if (show) {
            return input.hide();
        }

        return input.show();
    },

    // @private
    getOptionsPicker: function() {
        var me = this,
            config = me.getOptionsPickerConfig();

        if ( ! me.panelPicker) {

            me.panelPicker = Ext.create('Ext.Panel', Ext.apply({
                left: 0,
                top: 0,
                modal: {
                    style: 'opacity: 0.1;'
                },
                showAnimation: 'fade',
                cls: 'ux-uploader-overlay',
                layout: 'fit',
                hideOnMaskTap: true,
                items: [
                    {
                        xtype: 'uploadbutton',
                        text: me.getSingleText(),
                        accept: me.config.accept,
                        capture: me.getCapture(),
                        name: me.getName(),
                        listeners: {
                            scope: this,
                            change: 'onOptionChange'
                        }
                    },
                    {
                        xtype: 'uploadbutton',
                        text: me.getMultipleText(),
                        multiple: true,
                        accept: me.config.accept,
                        capture: me.getCapture(),
                        name: me.getName(),
                        listeners: {
                            scope: this,
                            change: 'onOptionChange'
                        }
                    }
                ]
            }, config));
        }

        return me.panelPicker;
    },

    /**
     * @private
     */
    updateOptionsPickerConfig: function(newConfig) {
        var panelPicker = this.panelPicker;
        if (panelPicker) {
            panelPicker.setConfig(newConfig);
        }
    },

    /**
     * Shows the options for the uploader.
     * {@link Ext.Panel panel}.
     */
    showOptions: function() {
        var me = this;

        if ( ! me.getShowOptions()) {
            return;
        }

        me.isFocused = true;

        var panel = me.getOptionsPicker();

        if ( ! panel.getParent()) {
            Ext.Viewport.add(panel);
        }

        panel.showBy(me, 'bc-tc');
    },

    /**
     * Hide the options for the uploader
     */
    hideOptions: function() {
        this.panelPicker.hide({
            type: 'fade',
            out: true,
            scope: this
        });
    },

    /**
     * @override
     * @private
     */
    destroy: function() {
        this.callParent(arguments);
        Ext.destroy(this.panelPicker);
    },

    /**
     * Reset the instance to its original state.
     */
    reset: function() {
        var uploadableFiles = Ext.Array.merge(this.getUploadableFiles(), this.getUploadedFiles());
        this.destroyUploadableFiles(uploadableFiles);
        this.setFiles([]);
        this.setUploadableFiles([]);
        this.setUploadedFiles([]);
    },

    /**
     * Destroy all uploadable files from the files provided.
     * 
     * @param  {Array} files
     * @return {Void}
     */
    destroyUploadableFiles: function(files) {
        var len = files.length,
            i = 0;

        for (; i < len; i++) {
            try {
                files[i].destroy();
            } catch (e) { }
        }
    }

});
