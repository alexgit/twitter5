$(function() {

	var touches = {};

	document.addEventListener('touchstart', function(e) {		
		
		var touchStartEvent = e.targetTouches[0];

		var timeoutHandle = setTimeout(function() {
			touches[touchStartEvent.identifier].timeoutHandle = 0;
			$(document).trigger('touchhold', [ touchStartEvent ]);
		}, 400);

		var eventInfo = { 
			touchStartX: touchStartEvent.pageX, 
			touchStartEvent: touchStartEvent, 
			timeoutHandle: timeoutHandle 
		};

		touches[touchStartEvent.identifier] = eventInfo;		
	}, false);

	document.addEventListener('touchend', function(e) {
		
		var touchEndEvent = e.changedTouches[0];
		var info = touches[touchEndEvent.identifier];
		
		if (info.timeoutHandle) {
			clearTimeout(info.timeoutHandle);
		}

		var swipeLength = Math.abs(info.touchStartX - touchEndEvent.pageX);

		console.log('swipe length: ' + swipeLength);

		if(swipeLength > 60) {
			var direction = touchEndEvent.pageX > info.touchStartX ? 'right' : 'left';

			console.log('direction: ' + direction);

			var eventDetails = { 
				events: {
					start: info.touchStartEvent,
					end: touchEndEvent
				}				
			};

			console.log(eventDetails);

			$(info.touchStartEvent.target).trigger('swipe' + direction, [ eventDetails ]);

			console.log('called trigger');
		}

	}, false);
});



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



