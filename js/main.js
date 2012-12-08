
function Tweet(content) {
	this.content = content;
	this.isMarked = ko.observable(false);
}

var tweets = ko.observableArray([

	new Tweet(
		'Lorem ipsum dolor sit amet, <a href="http://google.com">consectetur adipisicing</a> elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
	),
	new Tweet(
		'Lorem ipsum dolor sit amet, <a href="http://google.com">consectetur adipisicing</a> elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
	),
	new Tweet(
		'Lorem ipsum dolor sit amet, <a href="http://google.com">consectetur adipisicing</a> elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
	),
	new Tweet(
		'Lorem ipsum dolor sit amet, <a href="http://google.com">consectetur adipisicing</a> elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
	),
	new Tweet(
		'Lorem ipsum dolor sit amet, <a href="http://google.com">consectetur adipisicing</a> elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
	),
	new Tweet(
		'Lorem ipsum dolor sit amet, <a href="http://google.com">consectetur adipisicing</a> elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
	),
	new Tweet(
		'Lorem ipsum dolor sit amet, <a href="http://google.com">consectetur adipisicing</a> elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
	)

]);

var viewmodel = {
	feed: tweets
};

$(function() {
	
	$(document).on('swipeleft', 'div.tweet', function(e) { 
		var tweet = ko.dataFor(this);

		if(tweet.isMarked()) {
			viewmodel.feed.remove(tweet);
		}
	});

	$(document).on('swiperight', 'div.tweet', function(e) { 
		console.log('swipe right detected');
		$(this).css('background-color', 'blue');		
	});

	$(document).on('tap', 'div.tweet', function(e) { 
		var tweet = ko.dataFor(this);
		tweet.isMarked(!tweet.isMarked());
	});

	ko.applyBindings(viewmodel, $('#feed-container')[0]);
});



