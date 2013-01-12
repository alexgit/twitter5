
(function(global, undefined) {
	
	if(!localStorage)
		throw "localStorage not supported"

	function TwitterFeed(key, days) {
		days = days || 2;

		function trim(tweets) {
			var now = new Date();
			var cutoffDate = new Date();
			cutoffDate.setDate(now.getDate() - 2);

			for (var i = tweets.length - 1; i >= 0; i--) {
				if(tweets[i].date > cutoffDate) {					
					return tweets.slice(0, i + 1);
				}
			}

			return tweets;
		}
		
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

			var trimmed = trim(currentTweets);
			localStorage[key] = JSON.stringify(trimmed);
		}

		this.addTweet = function(tweet) {
			this.addTweets([tweet]);
		}

		this.removeTweet = function(tweetId) {
			var tweets = this.getTweets();
			var target;

			for (var i = 0, j = tweets.length; i < j; i++) {
				if(tweets[i].id == tweetId) {
					target = tweets.splice(i, 1)[0];
					break;				
				}
			}

			if(!target) {
				return false;
			}

			localStorage[key] = JSON.stringify(tweets);
			return target;
		}

		this.moveTweet = function(tweetId) {
			var self = this;

			return {
				to: function(feed) {
					var target = self.removeTweet(tweetId);				

					if(!target)
						throw "Can't find tweet with id " + tweetId + " in this feed";

					feed.addTweet(target);		
				}
			}							
		}
	}

	global.TwitterFeed = TwitterFeed;

})(window);
