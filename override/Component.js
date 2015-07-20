Ext.define('App.override.Component', {
    override: 'Ext.Component',
        
    hasCls: function(cls) {

        if (this.getCls().indexOf(cls) !== -1) {
            return true;
        }

        return false;
    }
});