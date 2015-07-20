Ext.define('App.utils.Alert', {
    singleton: true,
    alternateClassName: ['App.Alert'],
    requires: [
        'Ext.MessageBox',
        'Ext.device.Notification'
    ],

    show: function(title, message, buttons, callback, scope) {

        if (!buttons) {
            buttons = Ext.MessageBox.OK;
        }

        if (!callback) {
            callback = function() {
                return true;
            };
        }

        Ext.device.Notification.show({
            title: title,
            message: message,
            buttons: buttons,

            callback: callback,
            scope: scope
        });
    },

    confirm: function(title, message, callback, scope) {
        Ext.device.Notification.confirm({
            title: title,
            message: message,
            callback: callback,
            scope: scope
        });
    },

    warning: function(message) {

        this.show('Warning', message);
    },

    error: function(message, callback, scope) {

        this.show('Error', message, null, callback, scope);
    },

    success: function(message, callback, scope) {

        this.show('Success', message, null, callback, scope);
    },

    info: function(message, callback, scope) {

        this.show('Info', message, null, callback, scope);
    },

    serverError: function(buttons, callback) {

        this.show('Fatal Error',
                   this.serverErrorMessage(),
                   buttons,
                   callback);
    },

    serverErrorMessage: function() {
        return 'There was a problem connecting to the server. ' + "\n" + 'Check your internet connection and try again.';
    }


});