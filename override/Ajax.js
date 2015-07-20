Ext.define('App.override.Ajax', {
    override: 'Ext.Ajax',

    requires: [
        'App.utils.Alert'
    ],

    constructor: function(config) {

        this.callParent(arguments);
    },

    /**
     * @property {Boolean} autoAbort
     * Whether a new request should abort any pending requests.
     */
    autoAbort : false,

    /**
     * To be called when the request has come back from the server.
     * @private
     * @param {Object} request
     * @return {Object} The response.
     */
    onComplete : function(request) {
        var me = this,
            options = request.options,
            result,
            success,
            data,
            response;

        try {
            result = me.parseStatus(request.xhr.status, request.xhr);

            if (request.timedout) {
                result.success = false;
            }
        } catch (e) {
            // in some browsers we can't access the status if the readyState is not 4, so the request has failed
            result = {
                success : false,
                isException : false
            };
        }
        success = result.success;

        if (success) {
            response = me.createResponse(request);
            data = me.createResponseData(response);

            me.fireEvent('requestcomplete', me, response, options);
            Ext.callback(options.success, options.scope, [data, options]);
        } else {
            if (result.isException || request.aborted || request.timedout) {
                response = me.createException(request);
            } else {
                response = me.createResponse(request);
            }

            data = me.createResponseData(response);

            me.fireEvent('requestexception', me, response, options);

            Ext.callback(options.failure, options.scope, [data, options]);
        }

        Ext.callback(options.callback, options.scope, [options, success, response]);

        if(options.progress && options.progress.isProgressable) {
            Ext.callback(options.progress.endProgress, options.progress, [result]);
        }

        delete me.requests[request.id];
        return response;
    },


    send: function(options) {

        this.showMask(options.maskView, options.mask);

        options.failure = options.failure || this.defaultFailure;

        return this.request(options);
    },

    silent: function(url, data, callback, scope) {
        var me = this;

        if (Ext.isFunction(data)) {
            scope = callback;
            callback = data;
            data = undefined;
        }

        return this.request({
            url: url,
            method: 'POST',
            params: data,
            success: callback,
            failure: me.resend,
            scope: scope
        });
    },

    get: function(url, data, callback, scope) {

        if (Ext.isFunction(data)) {
            scope = callback;
            callback = data;
            data = undefined;
        }

        return this.send({
            url: url,
            method: 'GET',
            params: data,
            success: callback,
            scope: scope
        });
    },

    post: function(url, data, callback, scope) {

        if (Ext.isFunction(data)) {
            scope = callback;
            callback = data;
            data = undefined;
        }

        return this.send({
            url: url,
            method: 'POST',
            params: data,
            success: callback,
            scope: scope
        });
    },

    put: function(url, data, callback, scope) {

        if (Ext.isFunction(data)) {
            scope = callback;
            callback = data;
            data = undefined;
        }

        return this.send({
            url: url,
            method: 'PUT',
            params: data,
            success: callback,
            scope: scope
        });
    },

    destroy: function(url, data, callback, scope) {

        if (Ext.isFunction(data)) {
            scope = callback;
            callback = data;
            data = undefined;
        }

        return this.send({
            url: url,
            method: 'DELETE',
            params: data,
            success: callback,
            scope: scope
        });
    },

    showMask: function(view, mask) {

        if (mask === false) return;

        var me = this,
            viewMask;

        view = view || Ext.Viewport;
        viewMask = view.getMasked();

        if (viewMask) {
            viewMask.show();
        } else {
            view.setMasked({
                xtype: mask && mask.xtype || 'loadmask',
                message: mask && mask.message || '',
                zIndex: 99999
            });
        }

        me.on('requestcomplete', me.hideMask, me);
        me.on('requestexception', me.hideMask, me);
    },

    hideMask: function(connection, request, options) {
        var me = this,
            view = options.maskView || Ext.Viewport;

        me.un('requestcomplete', me.hideMask, me);
        me.un('requestexception', me.hideMask, me);

        view.unmask();
    },

    defaultFailure: function(response, options) {

        if ( ! response.data || ! response.data.error || response.timedout) {

            var serverErrorButtons = [
                {
                    text: 'Try Again',
                    itemId: 'tryAgain'
                }, {
                    text: 'Cancel',
                    itemId: 'cancel'
                }
            ];

            return App.Alert.serverError(serverErrorButtons, function(btn) {
                if (btn === 'tryAgain') {
                    Ext.Ajax.showMask();
                    return Ext.Ajax.resend(response, options);
                }

                return false;
            });
        }

        return App.Alert.error(response.data.error.message);
    },

    resend: function(response, options) {
        setTimeout(Ext.Ajax.request(options), 1000);
    },

    createResponseData: function(response) {
        var responseData = {
            xhr: response,
            status: response.status
        };

        try {
            responseData.data = Ext.JSON.decode(response.responseText);
        } catch (e) {
            responseData.data = null;
        }

        return responseData;
    }

});