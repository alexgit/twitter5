
(function(global, undefined) {
	
	if(!localStorage)
		throw "localStorage not supported"

	function TwitterFeed(key) {
		
		if(!localStorage[key]) {
			localStorage[key] = JSON.stringify([]);
		}

		this.getTweets = function() {
			return JSON.parse(localStorage[key]);
		};		

		this.addTweets = function(tweets) {
			var currentTweets = this.getTweets();

			for (var i = tweets.length - 1; i >= 0; i--) {
				currentTweets.unshift(tweets[i]);
			}

			localStorage[key] = JSON.stringify(currentTweets);
		}

		this.addTweet = function(tweet) {
			this.addTweets([tweet]);
		}
	}

	global.TwitterFeed = TwitterFeed;

})(window);