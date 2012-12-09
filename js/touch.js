$(function() {

	var touches = {};

	document.addEventListener('touchstart', function(e) {		
		
		var touchStartEvent = e.targetTouches[0];

		var timeoutId = setTimeout(function() {
			touches[touchStartEvent.identifier].timeoutId = 0;
			$(touchStartEvent.target).trigger('taphold', [ touchStartEvent ]);
		}, 400);

		var eventInfo = { 
			touchStartX: touchStartEvent.pageX, 
			touchStartY: touchStartEvent.pageY, 
			touchStartEvent: touchStartEvent, 
			timeoutId: timeoutId 
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
		
		if (info.timeoutId) {
			clearTimeout(info.timeoutId);

			if(info.touchStartX == touchEndEvent.pageX && 
				info.touchStartY == touchEndEvent.pageY) {
					$(touchEndEvent.target).trigger('tap');
			}
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
