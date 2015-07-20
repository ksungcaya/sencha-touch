Ext.define('App.override.Container', {
    override: 'Ext.Container',

    /**
     * @override
     */
    initialize: function() {
        var me = this,
            scrollable = me.getScrollable();

         me.callParent(arguments);

        if (scrollable) {
            scrollable.getScroller().on('refresh', me.toggleScrollerVisibility, me);
        }
    },

    /**
     * @private Toggle scroller visibility by adding a class.
     * @param  {Object} Instance of scroller class.
     */
    toggleScrollerVisibility: function(scroller) {
        var container = scroller.getContainer(),
            parent = container.getParent();
            
            if (scroller.getSize().y <= container.getSize().height) {
                parent.addCls('x-scroller-hidden');
                return;
            }

        parent.removeCls('x-scroller-hidden');
    },
    
    /**
     * @override
     */
    animateActiveItem: function(activeItem, animation, callback, scope) {
        var layout = this.getLayout(),
            defaultAnimation;

        if (this.activeItemAnimation) {
            this.activeItemAnimation.destroy();
        }

        this.activeItemAnimation = animation = new Ext.fx.layout.Card(animation);
        if (animation && layout.isCard) {
            animation.setLayout(layout);
            defaultAnimation = layout.getAnimation();
            if (defaultAnimation) {

                defaultAnimation.disable();
            }

            animation.on('animationend', function() {
                if (defaultAnimation) {
                    defaultAnimation.enable();
                }

                animation.destroy();

                Ext.callback(callback, scope, [activeItem]);

            }, this);
        }

        return this.setActiveItem(activeItem);
    }
    
});