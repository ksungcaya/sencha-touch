Ext.define('App.override.LoadMask', {
    override: 'Ext.LoadMask',
    
    getTemplate: function() {
        var prefix = Ext.baseCSSPrefix;

        return [
            {
                //it needs an inner so it can be centered within the mask, and have a background
                reference: 'innerElement',
                cls: prefix + 'mask-inner',
                children: [
                    //the elements required for the CSS loading {@link #indicator}
                    {
                        reference: 'indicatorElement',
                        cls: prefix + 'loading-image',
                        html: '<img src="resources/images/loader.GIF">'
                    },
                    //the element used to display the {@link #message}
                    {
                        reference: 'messageElement'
                    }
                ]
            }
        ];
    },

    /**
     * @override
     */
    updateHtml: function(html) {
        if (html) {
            this.indicatorElement.setHtml(html);
        }
    }
});