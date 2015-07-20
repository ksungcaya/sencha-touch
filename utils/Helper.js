Ext.define('App.utils.Helper', {
    singleton: true,
    alternateClassName: 'App.Helper',
    requires: 
    [
        'Ext.Date'
    ],

    empty: function(value) {

        if (value === null || value.replace(/\s/g, '') === '') {
            return true;
        }

        return false;
    },

    wordCount: function(text) {
        var regex = /\s+/gi;
        return text.trim().replace(regex, ' ').split(' ').length;
    },

    controller: function(name) {

        return App.app.getController(name);
    },

    nl2br : function(str, is_xhtml) {

        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>'; // Adjust comment to avoid issue on phpjs.org display

        return (str + '')
        .replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2') || str;
    },

    shorten: function(str, len) {

        if (str.length <= len) {
            return str;
        }

        return str.substr(0, len) + '...';
    },

    shortenHtml: function(html, len) {

        html = html.replace(/<[^>]+>/ig,"");

        return this.shorten(html, len);
    },

    randomStr: function(count) {
        var text = '';
        var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        if (!count) {
            count = 20;
        }

        for( var i=0; i < count; i++ )
            text += charSet.charAt(Math.floor(Math.random() * charSet.length));

        return text;
    },

    isEmptyObj: function(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        }

        return true;
    },

    ext: function(filename) {
        return filename.substr((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
    },

    filename: function(path) {
        return path.split('\\').pop().split('/').pop();
    },

    arraySearch: function(array, key, value, index) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {

                if (index) {
                    return i;
                }

                return array[i];
            }
        }

        return -1;
    },

    inArray: function(needle, haystack) {
        
        var length = haystack.length;
        for(var i = 0; i < length; i++) {
            if(haystack[i] == needle) return true;
        }
        
        return false;
    },

    isKitkat: function() {
        var patches = [0, 1, 2],
            version = Ext.os.version;

        return Ext.os.name.toLowerCase() === 'android' && version.version.indexOf( '4.4' ) === 0 && this.inArray(version.patch, patches);
    },

    relativeTime: function(date) {

        var date = Ext.Date.parse(date, "Y-m-d H:i:s");
        var units = [
            { name: "second", limit: 60, in_seconds: 1 },
            { name: "minute", limit: 3600, in_seconds: 60 },
            { name: "hour", limit: 86400, in_seconds: 3600 },
            { name: "day", limit: 604800, in_seconds: 86400 },
            { name: "week", limit: 2629743, in_seconds: 604800 },
            { name: "month", limit: 31556926, in_seconds: 2629743 },
            { name: "year", limit: null, in_seconds: 31556926 }
        ];

        try {

            var now = Math.ceil(Number(new Date()) / 1000),
                dateTime = Math.ceil(Number(date) / 1000),
                diff = now - dateTime,
                str;

            if (diff < 5) return "now";

            var i = 0;
            while (unit = units[i++]) {
                if (diff < unit.limit || !unit.limit){
                    var diff = Math.floor(diff / unit.in_seconds);

                    return diff + " " + unit.name + (diff > 1 ? "s" : "") + " ago";
                }
            };
        } catch(e) {
            return "";
        }
    }

});