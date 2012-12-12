$(function() {

	var touch = {
		settings: {
			preventScrollThreshold: 30,
			swipeLengthThreshold: 60,
			tapholdDurationThreashold: 400
		}
	};

	var touches = {};

	document.addEventListener('touchstart', function(e) {		
		
		var touchStartEvent = e.targetTouches[0];

		var timeoutId = setTimeout(function() {
			touches[touchStartEvent.identifier].timeoutId = 0;
			$(touchStartEvent.target).trigger('taphold', [ touchStartEvent ]);
		}, touch.settings.tapholdDurationThreashold);

		var eventInfo = { 
			pageX: touchStartEvent.pageX, 
			pageY: touchStartEvent.pageY, 
			event: touchStartEvent, 
			timeoutId: timeoutId 
		};

		touches[touchStartEvent.identifier] = eventInfo;			

		function moveHandler(e) {
			var currentX = e.touches[0].pageX;

			if(Math.abs(eventInfo.pageX - currentX) > touch.settings.preventScrollThreshold) {
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
		var touchStart = touches[touchEndEvent.identifier];
		
		if (touchStart.timeoutId) {
			clearTimeout(touchStart.timeoutId);

			console.log('cleared timeout');

			console.log(touchStart.pageX, touchEndEvent.pageX, touchStart.pageY, touchEndEvent.pageY);

			if(touchStart.pageX == touchEndEvent.pageX && touchStart.pageY == touchEndEvent.pageY) {
					console.log(touchEndEvent.target);
					
					$(touchEndEvent.target).trigger('tap');

					console.log('fired tap event');
			}
		}

		var swipeLength = Math.abs(touchStart.pageX - touchEndEvent.pageX);

		if(swipeLength > touch.settings.swipeLengthThreshold) {
			var direction = touchEndEvent.pageX > touchStart.pageX ? 'right' : 'left';

			var events = {
				start: touchStart.event,
				end: touchEndEvent
			};
			
			$(touchStart.event.target).trigger('swipe' + direction, [ events ]);		
		}

	}, false);

	window.touch = touch;
});
