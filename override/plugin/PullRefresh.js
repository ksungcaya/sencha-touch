Ext.define('App.override.plugin.PullRefresh', {
    override: 'Ext.plugin.PullRefresh',

    config: {
        /**
         * @cfg {Ext.XTemplate/String/Array} pullTpl The template being used for the pull to refresh markup.
         * Will be passed a config object with properties state, message and updated
         *
         * @accessor
         */
        pullTpl: [
            '<div class="x-list-pullrefresh-arrow"></div>',
            '<div class="x-loading-spinner">',
                '<div class="x-loading-image">',
                     '<img src="resources/images/loader.GIF">',
                '</div>',
            '</div>',
            '<div class="x-list-pullrefresh-wrap">',
                '<h3 class="x-list-pullrefresh-message">{message}</h3>',
                '<div class="x-list-pullrefresh-updated">{updated}</div>',
            '</div>'
        ].join('')
    }
    
});