window.twitterApi = (function () {
    var throttleFunction = function (fn, throttleMilliseconds) {
        var invocationTimeout;

        return function () {
            var args = arguments;
            if (invocationTimeout)
                clearTimeout(invocationTimeout);

            invocationTimeout = setTimeout(function () {
                invocationTimeout = null;
                fn.apply(window, args);
            }, throttleMilliseconds);
        };
    };

    var getTweetsForUsersThrottled = throttleFunction(function (userNames, sinceId, callback) {
        if (userNames.length == 0)
            callback([]);
        else {
            var url = "http://search.twitter.com/search.json?callback=?&rpp=100&q=";
            for (var i = 0; i < userNames.length; i++)
                url += "from:" + userNames[i] + (i < userNames.length - 1 ? " OR " : "");

            if(sinceId) {
                url += "&since_id=" + sinceId;
            }

            $.ajax({
                url: url,
                dataType: "jsonp",
                success: function (data) { 
                    callback($.grep(data.results || [], function (tweet) {
                        return !tweet.to_user_id; 
                    })); 
                }
            });
        }
    }, 50);

    return {
        getTweetsForUser: function (userName, sinceId, callback) {
            return this.getTweetsForUsers([userName], sinceId, callback);
        },
        getTweetsForUsers: function (userNames, sinceId, callback) {
            return getTweetsForUsersThrottled(userNames, sinceId, callback);
        }
    };
})();