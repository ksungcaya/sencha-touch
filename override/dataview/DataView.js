Ext.define('App.override.dataview.DataView', {
    override: 'Ext.dataview.DataView',

    lastTapped: 0,

    delayFor: 400, // prevent tap of button after [x] ms

    /**
     * On slower devices Sencha registers multiple item list taps
     * which ends up causing strange behaviour. Ensure only a single
     * item list tap every 2seconds per list item
     */
    onItemTap: function(container, target, index, e) {

        var me = this,
            now = Date.now(),
            store = me.getStore(),
            record = store && store.getAt(index);

        if (me.getAllowDeselect()) {
            return me.fireEvent('itemtap', me, index, target, record, e);
        }

        if ( (now - me.lastTapped) > me.getDelayFor()) {

            me.lastTapped = now;

            me.fireEvent('itemtap', me, index, target, record, e);
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