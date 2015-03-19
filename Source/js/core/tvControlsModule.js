var tvControls = ( function(){
	
	var moduleName = "tvControls"
	selectedFeed = {};

	var observerCallback = function(message)
	{
		if(message.hasOwnProperty("tvPlayheadUpdate") && !message.tvPlayheadUpdate.headOnly)
		{
			//update the play icon to reflect the current TV State.  Or hide the controls if the TV isn't playing
			selectedFeed = app.getFeedFromInternalModel('tvModel', message.tvPlayheadUpdate.feedId);

			if(message.tvPlayheadUpdate.state == "playing")
			{
				//show the controls and redraw them
				$('.tvControlsContainer').show(200);
				drawControls({"state": "playing"});
			}

			else if (message.tvPlayheadUpdate.state == "paused")
			{
				$('.tvControlsContainer').show(200);
				drawControls({"state": "paused"});
			}

			else
			{
				//hide the controls div
				$('.tvControlsContainer').hide(200);

			}

		}
	}

	app.subscribe(moduleName, observerCallback);

	var drawControls = function(state)
	{
		controlsHTML = new EJS({url: "templates/tvControlsTemplate.ejs"}).render(state);
			$(".tvControlsContainer").html(controlsHTML);

		$(".tvControlPlayPauseButton").click(playPauseButtonClickHandler);

		$(".tvControlFastForwardButton").click(fastForwardButtonClickHandler);

		$(".tvControlRewindButton").click(rewindButtonClickHandler);
	}



	var playPauseButtonClickHandler = function(event)
	{
		state = selectedFeed.state == "paused" ? "playing" : "paused" ;
		updateModel(selectedFeed.progress, state, false) 
	}

	var fastForwardButtonClickHandler = function(event)
	{
		updateModel(selectedFeed.progress, selectedFeed.state, 30);
	}

	var rewindButtonClickHandler = function(event)
	{
		updateModel(selectedFeed.progress, selectedFeed.state, -30);
	}


	var updateModel = function(progress, state, seeked)
	{
		lastProgress = progress;
		app.update(moduleName, {tvPlayheadUpdate:{
				headOnly: false,
				feedId: selectedFeed.feedId,
				progress: progress,
				state: state,
				seeked: seeked,
				localTimestamp: new Date().getTime(),
				eventsViewed: [],
				pageLoad: undefined
			}});
	}



}())