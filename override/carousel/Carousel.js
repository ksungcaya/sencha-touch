Ext.define('App.override.carousel.Carousel', {
    override: 'Ext.carousel.Carousel',

    toggleIndicator: function(show) {
        var indicator = this.getIndicator();

        if ( ! show) {
            return indicator.hide();
        }

        return indicator.show();
    },

    toggleSwipe: function(allow) {
        this.element[allow ? 'on' : 'un']({
            dragstart : 'onDragStart',
            drag      : 'onDrag',
            dragend   : 'onDragEnd',
            scope     :  this
        });
    }
});