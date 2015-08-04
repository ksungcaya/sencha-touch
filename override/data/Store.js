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
    },

    search: function(query, fields) {
        var terms,
            regexps = [];

        // convert the fields to array if a string was passed
        if ( ! Ext.isArray(fields)) {
            fields = [fields];
        }

        // Spit value to get multiple terms
        terms = query.split(' ');

        // Convert each search string into regex
        Ext.each(terms, function(term) {
            // Ensure term is not space and at least 2 characters
            if (term && term.length > 1) {
                regexps.push(new RegExp(term, 'i')); // Case-insensitive regex
            }
        });

        return this.getSearchResult(regexps, fields);
    },

    getSearchResult: function(regexps, fields) {
        var me = this,
            matches, match;

        return me.queryBy(function(record) {

            matches = [];

            Ext.each(regexps, function(regex) {
                match =  me.searchFieldsForRecord(record, fields, regex);
                matches.push(match);
            });

            // If nothing was found, do not show anything
            if (me.noSearchMatches(regexps, matches)) {
                return false;
            }

            return matches[0];
        });
    },

    searchFieldsForRecord: function(record, fields, query) {
        var len = fields.length,
            i = 0,
            match;

        for (; i < len; i++) {
            match = record.get(fields[i]).match(query);
            if (match) break;
        }

        return match;
    },

    noSearchMatches: function(regexps, matches) {
        return regexps.length > 1 && matches.indexOf(false) != -1;
    }
    
});