Ext.define('App.utils.Rate', {
    singleton: true,
    alternateClassName: 'App.Rate',

    ANDROID_STORE_URL: 'market://details?id=',

    IOS_STORE_URL: 'itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?type=Purple+Software&id=',

    IOS7_STORE_URL: 'itms-apps://itunes.apple.com/app/id',

    TEXT_RATE: 'Rate It Now',

    TEXT_NO: 'No, Thanks',

    TEXT_LATER: 'Remind Me Later',

    config: {

        appName: 'this App',

        title: 'Rate {{APP_NAME}}',

        message: 'If you enjoy using {{APP_NAME}}, would you mind taking a moment to rate it? It won’t take more than a minute. Thanks for your support!',

        storeAppUrl: {
            android: null,
            ios: null
        },

        appIds: {
            android: null,
            ios: null
        },

        countUntilPrompt: 5,

        localStorageCountKey: 'rating_use_count',

        currentAppVersion: 0
    },

    counter: {
        appVersion: 0,
        countdown: 0
    },

    init: function(config) {


        if (Ext.isString(config)) {

            this.setAppName(config);
            this.initConfig(this.config);

        } else {

            this.initConfig(config);
        }

        this.setMessages(this.getAppName());
        this.initializeCounter(this.getCurrentAppVersion());
    },

    setMessages: function(appName) {
        var title = this.getInitialConfig('title'),
            message = this.getInitialConfig('message');

        this.setTitle(title.replace(/{{APP_NAME}}/g, appName));
        this.setMessage(message.replace(/{{APP_NAME}}/g, appName));
    },

    getStoreAppUrl: function() {

        var device = Ext.os.name.toLowerCase(),
            url = this.config.storeAppUrl[device];

        if ( ! url) {

            if (device === 'ios') {
                var iOSVersion = parseFloat(Ext.os.version.version, 10);

                if ((7.1 > iOSVersion && iOSVersion >= 7.0)) {

                    url = this.IOS7_STORE_URL + this.getAppId('ios');

                } else {

                    url = this.IOS_STORE_URL + this.getAppId('ios');
                }

            } else if (device === 'android') {

                url = this.ANDROID_STORE_URL + this.getAppId('android');
            }
        }

        return url;
    },

    getAppId: function(device) {

        return this.getAppIds()[device];
    },

    getCounter: function() {

        return JSON.parse(localStorage.getItem(this.getLocalStorageCountKey())) || this.counter;
    },

    updateCountdown: function(count) {

        var counter = this.getCounter();

        if (count === undefined) {

            count = ++counter.countdown;
        }

        counter.countdown = count;

        this.updateCounter(counter);
        this.counter.countdown = count;

        return count;
    },


    /**
     * create a new counter if there's a new version
     * 
     * @param  {string} version version string
     * @return {[type]}         [description]
     */
    initializeCounter: function(version) {

        var counter = this.getCounter();

        if (counter.appVersion !== version) {

            this.counter.appVersion = version;
            this.updateCounter(this.counter);
        }
    },

    updateCounter: function(counter) {

        localStorage.setItem(this.getLocalStorageCountKey(), JSON.stringify(counter));
    },


    prompt: function() {

        var counter = this.getCounter(),
            countUntilPrompt = this.getCountUntilPrompt();

        if (counter.countdown !== countUntilPrompt) {

            if (counter.countdown <= countUntilPrompt) {

                this.updateCountdown();
            }

            return false;
        }

        var me = this;

        setTimeout(function() {
            Ext.device.Notification.show({
                title: me.getTitle(),
                message: me.getMessage(),
                buttons: [ me.TEXT_RATE, me.TEXT_NO, me.TEXT_LATER ],
                callback: me.rateCallback,
                scope: me
            });
        }, 500);

    },


    rateCallback: function(btnId) {

        switch (btnId) {
            case this.TEXT_RATE.toLowerCase():
                this.openAppStore();
                this.stopPrompt();
                break;
            case this.TEXT_NO.toLowerCase():
                this.stopPrompt();
                break;
            default:
                this.resetCounter();
                break;
        }
    },

    openAppStore: function() {
        
        window.open(this.getStoreAppUrl(), '_system');
    },

    stopPrompt: function() {

        return this.updateCountdown((this.getCountUntilPrompt() + 1));
    },

    resetCounter: function() {

        return this.updateCountdown(0);
    }

});