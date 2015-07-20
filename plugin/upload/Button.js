Ext.define('Ext.ux.upload.Button', {
    extend: 'Ext.Decorator',
    xtype: 'uploadbutton',
    alias: 'widget.uploadbutton',
    requires: ['Ext.field.FileInput'],

    config : {
        baseCls: 'ux-upload-button',

        component: {
            xtype : 'fileinput',
            fastFocus: false
        },

        text: null
    },

    proxyConfig: {
        name: null,
        value: null,
        files: null,

        /**
         * @cfg {Boolean} multiple Allow selection of multiple files
         *
         * @accessor
         */
        multiple: false,

        /**
         * @cfg {String} accept File input accept attribute documented here (http://www.w3schools.com/tags/att_input_accept.asp)
         * Also can be simple strings -- e.g. audio, video, image
         *
         * @accessor
         */
        accept: null,
        /**
         * @cfg {String} capture File input capture attribute. Accepts values such as "camera", "camcorder", "microphone"
         *
         * @accessor
         */
        capture: null
    },

    // @private
    // isFile: true,

    // @private
    initialize: function() {
        var me = this,
            cmp = me.getComponent();

        me.callParent();

        cmp.on({
            scope: this,
            change: 'onChange'
        });

        cmp.input.on({
            scope: me,
            focus: 'onInputFocus',
            tap: 'onInputTap'
        });

        cmp.mask.on({
            scope: me,
            tap: 'onMaskTap'
        });

        me.uploadText.on({
            scope: me,
            tap: 'onUploadTextTap'
        });

        me.applyStyles();
    },

    /**
     * @event change
     * Fires when a file has been selected
     * @param {Ext.ux.upload.Button} this This field
     * @param {Mixed} newValue The new value
     * @param {Mixed} oldValue The original value
     */
    onChange: function(me, value, startValue) {
        me.fireEvent('change', this, value, startValue);
    },

    // @private
    onInputFocus: function(e) {
        var cmp = this.getComponent();

        cmp.input.dom.value = null;
        cmp.fireAction('focus', [e], 'doFocus');
    },

    // @private
    onInputTap: function(e) {
        var cmp = this.getComponent();

        cmp.input.dom.value = null;
        cmp.fireAction('inputtap', [cmp, e], 'doInputTap');
    },

     // @private
    onMaskTap: function(e) {
        var cmp = this.getComponent();

        cmp.input.dom.value = null;
        cmp.fireAction('masktap', [cmp, e], 'doMaskTap');
    },

    /**
     * Fires when the text has been tapped
     * @param  {Object} e Event
     * @return {Void}
     */
    onUploadTextTap: function(e) {
        console.log(arguments);
    },

    /**
     * Apply the custom styles for the button and input
     * @return {void}
     */
     applyStyles: function() {
        var me = this,
        cmp = this.getComponent();

        me.element.setStyle({
            position: 'relative',
            overflow: 'hidden'
        });

        cmp.setStyle(me.fill());
        cmp.input.setStyle(me.fill());    
    },

    /**
     * @private
     */
    updateText: function(text) {
        var uploadText = this.uploadText;
        
        if (uploadText) {
            if (text) {
                uploadText.show();
                uploadText.setHtml(text);
            } else {
                uploadText.hide();
            }
        }
    },

     /**
     * @override include text element in the template
     * @return {array} template
     */
    getTemplate: function() {

        return [
            {
                tag: 'span',
                reference: 'uploadText',
                cls: 'ux-upload-label',
                hidden: true
            }
        ];
    },

    fill: function() {
        return {
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            margin: 0,
            padding: 0,
            opacity: 0
        };
    }
});