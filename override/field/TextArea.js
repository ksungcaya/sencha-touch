Ext.define('App.override.field.TextArea', {
    override: 'Ext.field.TextArea',

    adjustHeight: Ext.Function.createBuffered(function(textarea){
        var textAreaEl = textarea.getComponent().input;
        if (textAreaEl) {
            textAreaEl.dom.style.height = 'auto';
            textAreaEl.dom.style.height = textAreaEl.dom.scrollHeight + "px";
        }
    }, 200, this),

    constructor: function() {
        this.callParent(arguments);

        var textArea = this.getComponent().element.dom;

        // have to add these events directly to the DOM textarea (as opposed to this.fieldEl.on),
        // otherwise they're handled after Ext.gesture.Manager and preventDefault will already have been called.
        textArea.style.webkitOverflowScrolling = 'touch';
        this.lastY = undefined;

        textArea.addEventListener('touchstart', function(e) {
            this.lastY = e.pageY;
        });

        textArea.addEventListener('touchmove',function(e) {
            var textArea = e.target;
            var top = textArea.scrollTop <= 0;
            var bottom = textArea.scrollTop + textArea.clientHeight >= textArea.scrollHeight;
            var up = e.pageY > this.lastY;
            var down = e.pageY < this.lastY;
            this.lastY = e.pageY;


            // default (mobile safari) action when dragging past the top or bottom of a scrollable
            // textarea is to scroll the containing div, so prevent that.
            if((top && up) || (bottom && down))
                e.preventDefault();

            // Sencha disables textarea scrolling on iOS by default,
            // so stop propagating the event to delegate to iOS.
            if(!(top && bottom))
            {
                e.stopPropagation();
            }
        });
    }
    
});