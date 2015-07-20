Ext.define('App.override.Button', {
    override: 'Ext.Button',
    
    lastTapped: 0,

    delayFor: 400, // prevent tap of button after [x] ms

    /**
     * Update button icon to support masking
     * @return {String} icon
     */
    updateIcon: function(icon) {
        var me = this,
            element = me.iconElement;

        if (icon) {
            me.showIconElement();

            if( this.getIconMask() ){
                element.setStyle('-webkit-mask-image', icon ? 'url(' + icon + ')' : '');
            } else {
                element.setStyle('background-image', icon ? 'url(' + icon + ')' : '');
            }
            me.refreshIconAlign();
            me.refreshIconMask();
        }
        else {
            me.hideIconElement();
            me.setIconAlign(false);
        }
    },
    /**
     * On slower devices Sencha registers multiple button taps
     * which ends up causing strange behaviour. Ensure only a single
     * button tap every [x] ms (delayFor) per button
     */
    onTap: function(e) {
        var me = this,
            now = Date.now();

        if (me.getDisabled()) {
            return false;
        }

        if ( (now - me.lastTapped) > me.getDelayFor()) {
            me.lastTapped = now;

            me.fireAction('tap', [me, e], 'doTap');
        }
    },

    /**
     * delayFor getter
     * 
     * @return {Integer}
     */
    getDelayFor: function() {
        var delayFor = this.config.delayFor;

        if (delayFor === undefined) {
            return this.delayFor;
        }

        return delayFor;
    }
    
});