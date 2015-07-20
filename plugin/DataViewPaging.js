Ext.define('Ext.ux.DataViewPaging', {
    extend: 'Ext.dataview.DataView',
    xtype: 'dataviewpaging',
    alias: 'widget.dataviewpaging',

    config: {

        /**
         * @cfg {Array}
         * Additional plugins config (intended plugin: Ext.plugin.PullRefresh)
         */
        plugins: [
             {
                 xclass: 'Ext.plugin.PullRefresh',
                 pullText: 'Pull to refresh...'
             }
        ],

        /**
         * @cfg {Boolean} autoPaging
         * True to automatically load the next page when you scroll to the bottom of the list.
         */
        autoPaging: false,

        /**
         * @cfg {String} loadMoreText The text used as the label of the Load More button.
         */
        loadMoreText: 'Load more...',

        /**
         * @cfg {String} noMoreRecordsText The text used as the label of the Load More button when the Store's
         * {@link Ext.data.Store#totalCount totalCount} indicates that all of the records available on the server are
         * already loaded
         */
        noMoreRecordsText: 'No more records.',


        /**
         * @private
         * @cfg {String} loadTpl The template used to render the load more text
         */
        loadTpl: [
            '<div class="{cssPrefix}loading-spinner">',
                '<div class="{cssPrefix}loading-image">',
                     '<img src="resources/images/loader.GIF">',
                '</div>',
            '</div>',
            '<div class="{cssPrefix}list-paging-msg">{message}</div>'
        ].join(''),

        /**
         * @cfg {Object} loadMoreCmp
         * @private
         */
        loadMoreCmp: {
            xtype: 'component',
            baseCls: Ext.baseCSSPrefix + 'list-paging',
            scrollDock: 'bottom',
            hidden: true
        },

        /**
         * @private
         * @cfg {Boolean} loadMoreCmpAdded Indicates whether or not the load more component has been added to the List
         * yet.
         */
        loadMoreCmpAdded: false,

        /**
         * @private
         * @cfg {String} loadingCls The CSS class that is added to the {@link #loadMoreCmp} while the Store is loading
         */
        loadingCls: Ext.baseCSSPrefix + 'loading',

        /**
         * @private
         * @cfg {Boolean} loading True if the plugin has initiated a Store load that has not yet completed
         */
        loading: false,

         /**
         * @cfg {Boolean} scrollToTopOnRefresh
         * Scroll the DataView to the top when the DataView is refreshed.
         * @accessor
         */
        scrollToTopOnRefresh: false
    },

    // beforeInitialize: function() {
    //     var container = this.container,
    //         scrollable;

    //     if (container) {
    //         scrollable = container.getScrollable();

    //         if (scrollable) {
    //             // We want to intercept any translate calls made on the scroller to perform specific list logic
    //             this.bind(scrollable.getScroller().getTranslatable(), 'doTranslate', 'onTranslate');
    //         }
    //     }
    // },

    // onTranslate: function(x, y) {
    //     var me = this,
    //         store = me.getStore(),
    //         storeCount = store && store.getCount();

    //     if ( ! storeCount) {
    //         me.showEmptyText();
    //     }

    //     // This is a template method that can be intercepted by plugins to do things when scrolling
    //     this.onScrollBinder(x, y);
    // },

    // onScrollBinder: function(){},

    /**
     * Call parent initialize and initialize pager
     * 
     * @return void
     */
    initialize: function() {
        this.callParent(arguments);

        this.initPaging();
    },

    /**
     * @private
     *
     * Sets up all the references for the plugin
     * 
     * @return {[type]} [description]
     */
    initPaging: function() {
        var me = this,
            store = me.getStore(),
            scroller = me.getScroller();

        me.addLoadMoreCmp();

        if (store) {
            me.bindStore(store);

            if (store.getCount()) {
                me.getLoadMoreCmp().show();
            }
        }

        if (me.getAutoPaging() && scroller) {
            scroller.on({
                scrollend: me.onScrollEnd,
                scope: me
            });
        }

        // The List's Store could change at any time so make sure we are informed when that happens
        me.updateStore = Ext.Function.createInterceptor(me.updateStore, me.bindStore, me);
    },

    // @private (UNUSED)
    setupPaging: function(dataview) {
        var me = this,
            scroller = me.getScroller();

        if (me.pagingSetup) {
            return;
        }

        if (me.getAutoPaging() && scroller && ! dataview.hasListener('scrollend')) {
            scroller.on({
                scrollend: me.onScrollEnd,
                scope: me
            });
        }

        me.pagingSetup = true;  
    },

    /**
     * @private
     * @return {Object} Scroller
     */
    getScroller: function() {
        var scrollable = this.getScrollable(),
            parent;

        if ( ! scrollable) {

            parent = this.getParent();

            if (parent) {
                scrollable = parent.getScrollable();
            }               
        }

        return scrollable ? scrollable.getScroller() : null;
    },

    /**
     * @private
     */
    bindStore: function(newStore, oldStore) {
        if (oldStore) {
            oldStore.un({
                beforeload: this.onStoreBeforeLoad,
                load: this.onStoreLoad,
                filter: this.onFilter,
                scope: this
            });
        }

        if (newStore) {
            newStore.on({
                beforeload: this.onStoreBeforeLoad,
                load: this.onStoreLoad,
                filter: this.onFilter,
                scope: this
            });
        }
    },

    /**
     * @private
     * Removes the List/DataView's loading mask because we show our own in the plugin. The logic here disables the
     * loading mask immediately if the store is autoloading. If it's not autoloading, allow the mask to show the first
     * time the Store loads, then disable it and use the plugin's loading spinner.
     * @param {Ext.data.Store} store The store that is bound to the DataView
     */
    disableDataViewMask: function() {
        this._listMask = this.getLoadingText();

        this.setLoadingText(null);
    },

    /**
     * Show the loading mask for dataview
     * @return {Void}
     */
    enableDataViewMask: function() {

        if(this._listMask) {
            this.setLoadingText(this._listMask);
            delete this._listMask;
        }
    },

    /**
     * @private
     */
    applyLoadTpl: function(config) {
        return (Ext.isObject(config) && config.isTemplate) ? config : new Ext.XTemplate(config);
    },

    /**
     * @private
     */
    applyLoadMoreCmp: function(config) {
        config = Ext.merge(config, {
            html: this.getLoadTpl().apply({
                cssPrefix: Ext.baseCSSPrefix,
                message: this.getLoadMoreText()
            }),
            scrollDock: 'bottom',
            listeners: {
                tap: {
                    fn: this.loadNextPage,
                    scope: this,
                    element: 'element'
                }
            }
        });

        return Ext.factory(config, Ext.Component, this.getLoadMoreCmp());
    },

    /**
     * @private
     * If we're using autoPaging and detect that the user has scrolled to the bottom, kick off loading of the next page
     */
    onScrollEnd: function(scroller, x, y) {
        if (!this.getLoading() && y >= scroller.maxPosition.y) {
            this.currentScrollToTopOnRefresh = this.getScrollToTopOnRefresh();
            this.setScrollToTopOnRefresh(false);

            this.loadNextPage();
        }
    },

    /**
     * @private
     * Makes sure we add/remove the loading CSS class while the Store is loading
     */
    updateLoading: function(isLoading) {
        var loadMoreCmp = this.getLoadMoreCmp(),
            loadMoreCls = this.getLoadingCls();

        if (isLoading) {
            loadMoreCmp.addCls(loadMoreCls);
        } else {
            loadMoreCmp.removeCls(loadMoreCls);
        }
    },

    /**
     * @private
     * If the Store is just about to load but it's currently empty, we hide the load more button because this is
     * usually an outcome of setting a new Store on the List so we don't want the load more button to flash while
     * the new Store loads
     */
    onStoreBeforeLoad: function(store) {
        if (store.getCount() === 0) {
            this.getLoadMoreCmp().hide();
        }
    },

    /**
     * @private
     */
    onStoreLoad: function(store) {
        var loadCmp  = this.getLoadMoreCmp(),
            template = this.getLoadTpl(),
            message  = this.storeFullyLoaded() ? this.getNoMoreRecordsText() : this.getLoadMoreText();

        if (store.getCount()) {
            loadCmp.show();
        }
        this.setLoading(false);

        //if we've reached the end of the data set, switch to the noMoreRecordsText
        loadCmp.setHtml(template.apply({
            cssPrefix: Ext.baseCSSPrefix,
            message: message
        }));

        if (this.currentScrollToTopOnRefresh !== undefined) {
            this.setScrollToTopOnRefresh(this.currentScrollToTopOnRefresh);
            delete this.currentScrollToTopOnRefresh;
        }

        this.enableDataViewMask();
        this.refreshScroller();
    },

    /**
     * @private
     */
    refreshScroller: function() {
        var me = this,
            scroller = me.getScroller();

        if (scroller && me.isPainted()) {
            scroller.refresh();
        }
    },

    /**
     * @private
     */
    onFilter: function(store) {
        if (store.getCount() === 0) {
            this.getLoadMoreCmp().hide();
        }else {
            this.getLoadMoreCmp().show();
        }
    },

    /**
     * @private
     * Because the attached List's inner list element is rendered after our init function is called,
     * we need to dynamically add the loadMoreCmp later. This does this once and caches the result.
     */
    addLoadMoreCmp: function() {
        var cmp  = this.getLoadMoreCmp();

        if (!this.getLoadMoreCmpAdded()) {
        
            this.add(cmp);

            /**
             * @event loadmorecmpadded  Fired when the Load More component is added to the list. Fires on the List.
             * @param {Ext.plugin.ListPaging} this The list paging plugin
             * @param {Ext.List} list The list
             */
            this.fireEvent('loadmorecmpadded', this, this);
            this.setLoadMoreCmpAdded(true);
        }

        return cmp;
    },

    /**
     * @private
     * Returns true if the Store is detected as being fully loaded, or the server did not return a total count, which
     * means we're in 'infinite' mode
     * @return {Boolean}
     */
    storeFullyLoaded: function() {
        var store = this.getStore(),
            total = store.getTotalCount();

        return total !== null ? store.getTotalCount() <= (store.currentPage * store.getPageSize()) : false;
    },

    /**
     * @private
     */
    loadNextPage: function() {

        if (!this.storeFullyLoaded()) {
            this.disableDataViewMask();
            this.setLoading(true);
            this.getStore().nextPage({ addRecords: true });
        }
    }
});
