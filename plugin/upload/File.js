Ext.define('Ext.ux.upload.File', {
    extend: 'Ext.Component',
    xtype : 'uploadfile',
    alias : 'widget.uploadfile',
    requires: [
        'Ext.Ajax',
        'Ext.device.Notification',
        'Ext.LoadMask'
    ],
    
    template: [
        {
            reference: 'preview',
            cls: 'ux-file-preview'
        },
        {
            reference: 'progress',
            cls: 'ux-file-progress',
            hidden: true,
            children: [
                {
                    reference: 'progressBar',
                    cls: 'ux-file-progress-bar',
                    tag: 'span'
                }
            ]
        },
        {
            reference: 'loadElement',
            tag: 'span',
            cls: 'ux-file-loading'
        },
        {
            reference: 'deleteButton',
            tag: 'span',
            html: '&times;',
            cls: 'ux-file-delete'
        }
    ],

    config: {
        fileData: null,
        layout: 'default',
        baseCls: 'ux-upload-file',
        request: null
    },

    /**
     * Render the file on the view.
     * 
     * @return {mixed}
     */
    render: function() {
        var me = this,
            fileData = me.getFileData();

        me.deleteButton.on({
            scope: me,
            tap: 'onDeleteTap'
        });

        if (me.isImage(fileData.file)) {
            return me.renderImage(fileData.file);
        }

        return me.renderNoPreview();
    },

    /**
     * Determine if the file is an image.
     *
     * @param  {File object}  file
     * @return {Boolean}
     */
    isImage: function(file) {
        return !!file.type.match(/image.*/);
    },

    /**
     * Render the image on the view.
     * 
     * @param  {File object} imageFile
     * 
     * @return {Void}
     */
    renderImage: function(imageFile) {
        var me = this;

        if (window.loadImage) {
            return me.renderByLoadImage(imageFile);
        }

        if (window.FileReader) {
            return me.renderByFileReader(imageFile);
        }

        return me.renderNoPreview();
    },

    /**
     * Render the image using Load Image plugin.
     *
     * @param  {File object} imageFile
     *
     * @return {Void}
     */
    renderByLoadImage: function(imageFile) {
        var me = this,
            loadImage = window.loadImage,
            loadOpts = { canvas: true };

        // Use the "JavaScript Load Image" functionality to parse the file data
        loadImage.parseMetaData(imageFile, function(data) {

            // Get the correct orientation setting from the EXIF Data
            if (data.exif) {
                loadOpts.orientation = data.exif.get('Orientation');
            }

            // Load the image from disk and inject it into the DOM with the correct orientation
            loadImage(imageFile,  function(canvas) {
                    me.renderImageUri(canvas.toDataURL());
                },loadOpts
            );
        });
    },

    /**
     * Render the image using File Reader.
     *
     * @param  {File object} imageFile
     *
     * @return {Void}
     */
    renderByFileReader: function(imageFile) {
        var reader = new FileReader();

        reader.onloadend = function(e) {
            me.renderImageUri(this.result);
        };

        reader.readAsDataURL(imageFile);
    },

    /**
     * Render the data URI on the preview
     *
     * @param  {string} dataUri
     *
     * @return {void}
     */
    renderImageUri: function(dataUri) {
        var preview = this.preview;

        preview.dom.style.backgroundImage = 'url("' + dataUri + '")';
        preview.dom.style.backgroundSize = 'cover';
        preview.dom.style.backgroundRepeat = 'no-repeat';
        preview.dom.style.backgroundPosition = 'center center';
    },

    /**
     * Render the file with a No Preview text.
     * 
     * @return {Void}
     */
    renderNoPreview: function() {
        this.preview.setHtml('No Preview.');
    },

    /**
     * Called when the delete button was tapped.
     *     
     * @param  {Object} e [Event object]
     * @return {Void}
     */
    onDeleteTap: function(e) {
        var request = this.getRequest();

        if (this.requestNotAborted(request)) {
            return Ext.device.Notification.confirm({
                        title: 'Confirm',
                        message: 'File is currently uploading. Do you want to cancel the upload?',
                        callback: function(btn) {
                        // check if the request still exists
                        if (btn === "ok" ) {
                            this.cancelUpload();
                        }
                    },
                    scope: this
                });
        }

        this.destroy();
    },

    /**
     * Abort the current uploading process
     * @return {Void}
     */
    cancelUpload: function() {
        var request = this.getRequest();

        if (this.requestNotAborted(request)) {
            Ext.Ajax.abort(request);
            this.setRequest(null);
        }
    },

    // @private
    requestNotAborted: function(request) {
        return request && ! request.aborted;
    },

    /**
     * Reset the File state.
     * 
     * @return {Void}
     */
    reset: function() {
        var me = this;

        me.setFileData(null);
        me.setRequest(null);
        me.progress.hide();
        me.progressBar.setHtml('');
        // me.setCls([]);
    },

    /**
     * Upload the file on the server.
     * 
     * @param  {String} url
     * @param  {Object} params
     * @return {Void}
     */
    upload: function(url, params) {
        var me = this;

        if ( ! me.getFileData()) {
            return;
        }

        var formData = me.generateData(params),
            xhr;

        me.progress.show();
        me.setCls('ux-file-uploading');

        return me.setRequest(me.doUpload(url, formData));
    },

    /**
     * @orivate Perform the upload.
     * 
     * @param  {String} url
     * @param  {Object Array} formData 
     * @return {Void}
     */
    doUpload: function(url, formData) {
        var me = this,
            request = {
                url: url,
                data: formData,
                method: 'POST',
                xhr2: true,
                progress: function(e) {
                     var pc = Math.round((e.loaded * 100) / e.total);
                        me.progressBar.setWidth(pc + '%')
                },
                success: function(response) {
                    me.setCls('ux-uploading-success');
                    me.deleteButton.setHtml('&#x2713;'); // check mark
                    me.fireEvent('uploadsuccess', me, response, me.getFileData());

                    me.reset();
                },
                failure: function(response, request) {

                    me.setRequest(null);
                    if (response.xhr.aborted) {
                        me.setCls('ux-uploading-aborted');
                        me.fireEvent('uploadaborted', me, request, me.getFileData());
                        return me.progress.hide();
                    }

                    me.setCls('ux-uploading-failed');
                    me.fireEvent('uploadfailed', me, request, me.getFileData());
                }
            };

        return Ext.Ajax.request(request);
    },

    /**
     * Generate a form data from the supplied parameters.
     * 
     * @param  {Object} params
     * @return {Object} Form Data object
     */
    generateData: function(params) {
        var fileData = this.getFileData(),
            form = new FormData();

        form.append(fileData.name, fileData.file);

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                form.append(key, params[key]);
            }
        }

        return form;
    }

}); 