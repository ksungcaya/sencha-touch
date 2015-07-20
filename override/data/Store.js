Ext.define('App.override.data.Store', {
    override: 'Ext.data.Store',

    /**
     * @override
     */
    load: function(options, scope) {
        var me = this,
            operation,
            currentPage = me.currentPage,
            pageSize = me.getPageSize();

        options = options || {};

        if (Ext.isFunction(options)) {
            options = {
                callback: options,
                scope: scope || this
            };
        }

        if (me.getRemoteSort()) {
            options.sorters = options.sorters || this.getSorters();
        }

        if (me.getRemoteFilter()) {
            options.filters = options.filters || this.getFilters();
        }

        if (me.getRemoteGroup()) {
            options.grouper = options.grouper || this.getGrouper();
        }

        Ext.applyIf(options, {
            page: currentPage,
            start: (currentPage - 1) * pageSize,
            limit: pageSize,
            addRecords: false,
            action: 'read',
            params: this.getParams(),
            model: this.getModel()
        });

        operation = Ext.create('Ext.data.Operation', options);

        if (me.fireEvent('beforeload', me, operation) !== false) {
            me.lastOperation = operation;
            me.loading = true;
            me.getProxy().read(operation, me.onProxyLoad, me);
        }

        return me;
    },
    
    abort: function() {
        var me = this;

        if (me.loading && me.lastOperation) {
            Ext.Ajax.abort(me.lastOperation.request);
        }
    },

    resetUrl: function() {
        var proxy = this.getProxy();
        proxy.setUrl(proxy.getInitialConfig('url'));
    },

    groupByUrl: function(url) {
        var proxy = this.getProxy(),
            currentUrl = proxy.getUrl();

        if (currentUrl != url) {
            proxy.setUrl(url);

            this.abort();
            this.loadPage(1);
        }
    }
    
});