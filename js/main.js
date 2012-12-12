var timelineUrl = "http://ec2-54-242-59-225.compute-1.amazonaws.com/tweets/timeline";

var linkRegex = /((http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?)/
function replaceLinks(text) {
	return text.replace(linkRegex, '<a href="$1">$1</a>');
}

function User(screenName, name) {
	this.screenName = screenName;
	this.name = name;
	this.handle = '@' + this.screenName;
}

function Tweet(id, content, user) {
	this.content = replaceLinks(content);
	this.isSelected = ko.observable(false);
	this.isSaved = ko.observable(false);
	this.isBeingDeleted = ko.observable(false);
	this.isBeingSaved = ko.observable(false);
	this.id = id;
	this.user = user;	
	
	this.save = function() {
		this.isSaved(!this.isSaved());
	}

	this.toggleMarked = function() {
		this.isSelected(!this.isSelected());
	}
}

var isLoggedIn = !!(localStorage.username && localStorage.password);

var twitterFeed = new TwitterFeed('tweets');
var savedTweets = new TwitterFeed('saved');

var viewmodel = {
	feed: ko.observableArray([]),
	currentlyMarked : null,
	loading: ko.observable(false),
	username: ko.observable(),
	password: ko.observable(),
	loggedIn: ko.observable(isLoggedIn),
	remove: function(tweet) {
		var self = this;

		tweet.isBeingDeleted(true);
		
		setTimeout(function() {
			viewmodel.feed.remove(tweet);
		}, 210);
	},
	save: function(tweet) {
		var self = this;

		tweet.isBeingSaved(true);

		setTimeout(function() {
			viewmodel.feed.remove(tweet);
		}, 210);	

		savedTweets.addTweet(tweet); 
	},
	toggleMarked: function(tweet) {
		tweet.toggleMarked();

		if(this.currentlyMarked) {
			this.currentlyMarked.isSelected(false);
		}
		
		this.currentlyMarked = tweet.isSelected() ? tweet : null;		
	},	
	login: function() {
		this.loggedIn(true);

		localStorage.username = this.username();
		localStorage.password = this.password();
	}
};

$(function() {

	if(!localStorage.links) {
		localStorage.links = JSON.stringify([]);	
	}
	
	function addToLocalStorage(url) {
		var links = JSON.parse(localStorage.links);
		links.push(url);
		localStorage.links = JSON.stringify(links);
	}

	function getLinksFromLocalStorage() {
		return JSON.parse(localStorage.links);
	}

	var instapaper = new InstaPaperClient(localStorage.username, localStorage.password);
	
 	window.addEventListener('online', function(e) {
 		var links = getLinksFromLocalStorage();		

		for (var i = 0, size = links.length; i < size; i++) {
 			(function(j){
 				instapaper.addURL(links[j])
					.done(function(response, statusText) { 
						console.log('added successfully to instapaper');
						links.splice(j, 1);
						localStorage.links = JSON.stringify(links);
					})
					.fail(function(response, statusText) { 
						console.log('failed to add to instapaper');						
					});
 			})(i); 			
 		}
 	}, false);
	
	$(document).on('swipeleft', 'div.tweet', function(e) { 
		var tweet = ko.dataFor(this);

		if(tweet.isSelected()) {
			viewmodel.remove(tweet);
		}
	});

	$(document).on('swiperight', 'div.tweet', function(e) { 		
		var tweet = ko.dataFor(this);

		if(tweet.isSelected()) {
			viewmodel.save(tweet);
		}
	});

	$(document).on('tap', 'div.tweet', function(e) { 
		var tweet = ko.dataFor(this);
		viewmodel.toggleMarked(tweet);		
	});

	$(document).on('tap', 'div.tweet a', function(e) { 
		e.preventDefault();	
		e.stopPropagation();
	});

	$(document).on('taphold', 'div.tweet a', function(e) { 
		e.preventDefault();	
		e.stopPropagation();

		var link = $(this);
					
		if(confirm('Add to instapaper?')) {

			var url = link.attr('href');

			if(navigator.onLine) {
				instapaper.addURL(url)
					.done(function(response) { console.log('added successfully to instapaper') })
					.fail(function(response) { console.log('failed to add to instapaper') });	
			} else {
				addToLocalStorage(url);				
			}		
		}
	});	

	var consumeTweets = function(tweets) {
		var newTweets = [];
		ko.utils.arrayForEach(tweets, function(tweet) {
			newTweets.push({ 
				id: tweet.id_str, 
				content: tweet.text, 
				user: { 
					screen_name: tweet.user.screen_name,
					name: tweet.user.name
				}
			});
		});

		twitterFeed.addTweets(newTweets);
						
		var tweets = ko.utils.arrayMap(twitterFeed.getTweets(), function(t) {
			return new Tweet(t.id, t.content, new User(t.user.screen_name, t.user.name));
		});

		viewmodel.feed(tweets);		
	};

	ko.computed(function() {
		if(viewmodel.loggedIn()) {
			
			viewmodel.loading(true);

			var lastTweet = twitterFeed.getTweets()[0];
			var sinceId = (lastTweet && lastTweet.id) || 0;
						
			$.ajax({
				url: timelineUrl + '/' + sinceId,
				jsonp: 'callback',
				dataType: 'jsonp'				
			})
			.done(consumeTweets)
			.fail(function(error, statusText) {
				console.log(error);
				console.log(statusText);
			})
			.always(function() {
				viewmodel.loading(false);
			});
		}		
	});

	ko.applyBindings(viewmodel, $('body')[0]);
});



