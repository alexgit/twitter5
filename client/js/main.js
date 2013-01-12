var timelineUrl = "http://localhost:3000/tweets/timeline";

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
	saved: ko.observableArray([]),	
	currentlyMarked : null,
	loading: ko.observable(false),
	username: ko.observable(),
	password: ko.observable(),
	loggedIn: ko.observable(isLoggedIn),
	pages: {
		'0': { name: 'main-page', scrollY: 0 },
		'1': { name: 'saved-page', scrollY: 0 }		
	},
	page: ko.observable(0),
	remove: function(tweet) {
		var self = this;

		tweet.isBeingDeleted(true);
		
		setTimeout(function() {
			viewmodel.feed.remove(tweet);
		}, 210);		
	},
	purge: function(tweet) {
		this.saved.remove(tweet);
	},
	save: function(tweet) {
		var self = this;

		tweet.isBeingSaved(true);

		setTimeout(function() {
			viewmodel.feed.remove(tweet);
		}, 210);	
		
		this.saved.unshift(tweet);
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
	},
	turnPage: function(direction) {
		var currentPage = this.page();
		var newPage =  currentPage + (direction == 'left' ? -1 : direction == 'right' ? 1 : 0);

		if(newPage == currentPage) {
			return;
		}

		if(newPage in this.pages) {
			this.pages[currentPage].scrollY = window.scrollY;
			this.page(newPage);
			window.scrollTo(0, this.pages[newPage].scrollY);
		}
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

		var sTweets = ko.utils.arrayMap(savedTweets.getTweets(), function(t) {
			return new Tweet(t.id, t.content, t.date, new User(t.user.screen_name, t.user.name));
		});

		viewmodel.feed(tweets);
		viewmodel.saved(sTweets);
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
	
	var mainPage = $('#main-page');	
	var savedPage = $('#saved-tweets-page');

	mainPage.on('swipeleft', 'div.tweet', function(e) { 
		var tweet = ko.dataFor(this);

		if(tweet.isSelected()) {
			e.stopPropagation();
			viewmodel.remove(tweet);
		}
	});

	mainPage.on('swiperight', 'div.tweet', function(e) { 		
		var tweet = ko.dataFor(this);

		if(tweet.isSelected()) {
			e.stopPropagation();

			viewmodel.save(tweet);
			twitterFeed.moveTweet(tweet.id).to(savedTweets);
			viewmodel.toggleMarked(tweet);
		}
	});

	savedPage.on('swiperight', 'div.tweet', function(e) { 		
		var tweet = ko.dataFor(this);

		if(tweet.isSelected()) {
			e.stopPropagation();

			viewmodel.purge(tweet);
			savedTweets.removeTweet(tweet.id);
		}
	});

	$(document).on('swipeleft', function(e) {
		viewmodel.turnPage('right');
	});

	$(document).on('swiperight', function(e) {
		viewmodel.turnPage('left');		
	});

	$(document).on('tap', 'div.tweet', function(e) { 
		var tweet = ko.dataFor(this);
		viewmodel.toggleMarked(tweet);		
	});

	$(document).on('tap', 'div.tweet a', function(e) { 
		e.preventDefault();	
		e.stopPropagation();
	});

	mainPage.on('tap', 'div.button.load-more', function(e) { 
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



