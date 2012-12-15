var timelineUrl = "http://ec2-107-21-68-179.compute-1.amazonaws.com:3000/tweets/timeline";

var linkRegex = /((http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?)/
function replaceLinks(text) {
	return text.replace(linkRegex, '<a href="$1">$1</a>');
}

function User(screenName, name) {
	this.screenName = screenName;
	this.name = name;
	this.handle = '@' + this.screenName;
}

function Tweet(id, content, date, user) {
	this.content = replaceLinks(content);
	this.isSelected = ko.observable(false);
	this.isSaved = ko.observable(false);
	this.isBeingDeleted = ko.observable(false);
	this.isBeingSaved = ko.observable(false);
	this.id = id;
	this.user = user;	
	this.date = date;
	
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

	var consumeTweets = function(tweets) {
		var newTweets = [];
		ko.utils.arrayForEach(tweets, function(tweet) {
			newTweets.push({ 
				id: tweet.id_str, 
				content: tweet.text, 
				user: { 
					screen_name: tweet.user.screen_name,
					name: tweet.user.name
				},
				date: new Date(tweet.created_at)
			});
		});

		if (newTweets.length) 
			twitterFeed.addTweets(newTweets);
						
		var tweets = ko.utils.arrayMap(twitterFeed.getTweets(), function(t) {
			return new Tweet(t.id, t.content, t.date, new User(t.user.screen_name, t.user.name));
		});

		viewmodel.feed(tweets);		
	};

	var loadTweets = function() {
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
	};
	
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

	$(document).on('tap', 'div.button.load-more', function(e) { 
		var button = $(this);		
		loadTweets();
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

	ko.computed(function() {
		if(viewmodel.loggedIn()) {
			
			var lastTweet = twitterFeed.getTweets()[0];
			var sinceId = (lastTweet && lastTweet.id) || 0;
						
			if(!sinceId) {				
				loadTweets();			
			} else {
				consumeTweets([]);
			}

		}		
	});

	ko.applyBindings(viewmodel, $('body')[0]);
});



