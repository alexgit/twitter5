var linkRegex = /((http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?)/
function replaceLinks(text) {
	return text.replace(linkRegex, '<a href="$1">$1</a>');
}

function Tweet(content) {
	this.content = replaceLinks(content);
	this.isMarked = ko.observable(false);
	this.isSaved = ko.observable(false);

	this.isBeingDeleted = ko.observable(false);

	this.moveOffScreen = function() {
		this.isBeingDeleted(true);
	}

	this.save = function() {
		this.isSaved(!this.isSaved());
	}

	this.toggleMarked = function() {
		this.isMarked(!this.isMarked());
	}
}

var isLoggedIn = !!(localStorage.username && localStorage.password);

var viewmodel = {
	feed: ko.observableArray([]),
	remove: function(tweet) {
		var self = this;

		tweet.moveOffScreen();
		
		setTimeout(function() {
			viewmodel.feed.remove(tweet);
		}, 210);
	},
	toggleMarked: function(tweet) {
		tweet.toggleMarked();

		if(this.currentlyMarked) {
			this.currentlyMarked.isMarked(false);
		}
		
		this.currentlyMarked = tweet.isMarked() ? tweet : null;		
	},
	currentlyMarked : null,
	loading: ko.observable(false),
	
	username: ko.observable(),
	password: ko.observable(),
	loggedIn: ko.observable(isLoggedIn),

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
 	});
	
	$(document).on('swipeleft', 'div.tweet', function(e) { 
		var tweet = ko.dataFor(this);

		//if(tweet.isMarked()) {
			viewmodel.remove(tweet);
		//}
	});

	$(document).on('swiperight', 'div.tweet', function(e) { 
		console.log('swipe right detected');
		var tweet = ko.dataFor(this);

		if(!tweet.isMarked()) {
			tweet.save();
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

	viewmodel.loading(true);

	ko.computed(function() {
		if(viewmodel.loggedIn()) {
			twitterApi.getTweetsForUser('BoingBoing', function(tweets) {		
				var feed = [];
				ko.utils.arrayForEach(tweets, function(tweet) {
					feed.push(new Tweet(tweet.text));
				});

				viewmodel.feed(feed);
				viewmodel.loading(false);
			});		
		}		
	});

	ko.applyBindings(viewmodel, $('body')[0]);
});



