Ext.define('App.utils.Push', {
    singleton: true,
    alternateClassName: 'App.Push',

    _pushKey: 'app_push',

    push: null,

    register: function() {
        if (! window.PushNotification)
            return false;

        var me = this;

        me.onUnRegister();

        me.push = PushNotification.init({ "ios": {} });
        me.push.on('registration', me.onRegister);
        me.push.on('notification', me.onNotify);
        me.push.on('error', me.onError);
    },

    onRegister: function(data) {
        localStorage.setItem(this._pushKey, data.registrationId);
    },

    onNotify: function(data) {
        // data.message,
        // data.title,
        // data.count,
        // data.sound,
        // data.additionalData
    },

    onError: function(error) {
        // error.message
    },

    unRegister: function() {
        var me = this;

        if ( ! window.PushNotification || ! me.push) {
            return false;
        }

        me.push.unregister(me.onUnRegister, me.onError);
    },

    onUnRegister: function() {
        localStorage.removeItem(this._pushKey);
    },

    token: function() {
        return localStorage.getItem(this._pushKey);
    }

});