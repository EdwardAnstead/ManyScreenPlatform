var tvStatus = (function(){
	
	//adjust for the time to get and process message
	var selectedFeed = {};
	var linkedFeeds = []
	var tvClockInterval;
	var moduleName = "tvStatus";
	var timeSinceLastUpdate = 0;

	var observerCallback = function(message)
	{
		if(message.hasOwnProperty("tvPlayheadUpdate"))
		{
			clearInterval(tvClockInterval);
			timeSinceLastUpdate = 0;
			selectedFeed = app.getFeedFromInternalModel('tvModel', message.tvPlayheadUpdate.feedId);
			linkedFeeds = app.getLinkedTICFeeds(selectedFeed);
			selectedFeed.state = message.tvPlayheadUpdate.state;
			selectedFeed.progress = message.tvPlayheadUpdate.progress;

			for (var i in linkedFeeds)
			{
				linkedFeeds[i].progress = message.tvPlayheadUpdate.progress;
			}

			if(selectedFeed.state == "playing")
			{
				incrementTvClock();
			}
			//seek
			if(message.tvPlayheadUpdate.seeked)
			{
				clearInterval(tvClockInterval);
				//selectedFeed.progress = message.tvPlayheadUpdate.progress;
				selectedFeed.progress += message.tvPlayheadUpdate.seeked;

				if(selectedFeed.state == "playing")
				{
					incrementTvClock();
				}
			}
		}

		if(message.hasOwnProperty("statusUpdate") && message.statusUpdate.device == "tv"  
			&& message.statusUpdate.type == "feedSelect")
		{
			//selectedFeed = app.getSelectedFeed('tvModel');
			selectedFeed = app.getFeedFromInternalModel('tvModel', message.statusUpdate.feedId);
			linkedFeeds = app.getLinkedTICFeeds(selectedFeed);

		}
	}

	app.subscribe(moduleName, observerCallback);


	var incrementTvClock = function()
	{
		var increment = function(progress)
		{
			app.update(moduleName, {tvPlayheadUpdate:{
				headOnly: true,
				feedId: selectedFeed.feedId,
				progress: progress,
				state: 'playing',
				seeked: false,
				localTimestamp: new Date().getTime(),
				eventsViewed: selectedFeed.eventsViewed,
				pageLoad: undefined
			}});

			for (var i in linkedFeeds)
			{
					app.update(moduleName, {tvPlayheadUpdate:{
					headOnly: true,
					feedId: linkedFeeds[i].feedId,
					progress: progress,
					state: 'playing',
					seeked: false,
					localTimestamp: new Date().getTime(),
					eventsViewed: [],
					pageLoad: undefined
				}});
			}
		}
		tvClockInterval = setInterval(function(){

			increment(selectedFeed.progress +=0.1)
			
			timeSinceLastUpdate += 0.1;
			if(timeSinceLastUpdate > 10)
			{
				clearInterval(tvClockInterval);
				increment(selectedFeed.progress -=timeSinceLastUpdate)
				timeSinceLastUpdate = 0;
			}
		}, 100);
	}

	return{
		//setupTv: setupTv,
		selectedFeed: selectedFeed
	}

}())