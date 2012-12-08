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

		function moveHandler(e) {
			var currentX = e.touches[0].pageX;

			if(Math.abs(eventInfo.touchStartX - currentX) > 30) {
				e.preventDefault();
			}
		}

		document.addEventListener('touchmove', moveHandler, false);

		document.addEventListener('touchend', function(e) {
			document.removeEventListener('touchmove', moveHandler, false);
		}, false);

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
