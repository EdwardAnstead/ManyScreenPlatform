//TV playback Module

var tvPlaybackModule = (function()
{
	var selectedFeedInternal = {};
	var videoPlayer;
	var moduleName = "tvPlayback";
	var stateFlag = "none";
	var endTime = 0;

	var observerCallback = function(message)
	{
		if(message.hasOwnProperty("statusUpdate"))
		{
			if(message.statusUpdate.type == "feedSelect" && message.statusUpdate.device=="tv")
			{

				//switch the TV feed to the one in the message.
				selectedFeedInternal = app.getFeedFromInternalModel("tvModel", message.statusUpdate.feedId);
				startPlayback(message.statusUpdate);

				if(message.statusUpdate.endTime)
				{
					endTime == message.statusUpdate.endTime;
				}
			}
		}

		if(message.hasOwnProperty("tvPlayheadUpdate"))
		{
			var mainMessage = message.tvPlayheadUpdate
			
			if(mainMessage.seeked)
			{
				seekTo(mainMessage.seeked);
			}

			if(mainMessage.state == "playing" && videoPlayer.paused)
			{
					stateFlag = "playing";
					videoPlayer.play();
					updateModel(videoPlayer.currentTime, "playing", false);
			}

			if(mainMessage.state == "paused" && !videoPlayer.paused)
			{
				console.log("got a pause message");
				stateFlag = "paused";
				videoPlayer.pause();
				updateModel(videoPlayer.currentTime, "paused", false);
			}
		}
	}

	app.subscribe(moduleName, observerCallback);

	var startPlayback = function(message)
	{
		selectedFeedApplication = app.getFeedFromApplicationModel(message.feedId);
		var renderObj = {
			url: selectedFeedApplication.videoList[0].url + "#t=" + message.progress
		}
		videoPlayerHTML = new EJS({url: "templates/tvPlayerTemplate.ejs"}).render(renderObj);
		$(".tvPlayerContainer").html(videoPlayerHTML);

		//lastTimeUpdate = message.progress;
		
		videoPlayer = document.getElementById("tvPlayerElement");
		stateFlag = "playing";
		videoPlayer.play();
		updateModel(message.progress, "playing", false);
		videoPlayer.addEventListener("timeupdate", timeUpdate);
	}

	var timeUpdate = function(event)
	{
		if(stateFlag == "playing")
		{	
			updateModel(videoPlayer.currentTime, "playing", false);
		}

		if(endTime !- 0 && videoPlayer.currentTime >= endTime)
		{
			//TODO make this elegantly go back to a splash screen also when the end of the video is reached
			videoPlayer.pause();
		}
	}

	var seekTo = function(time)
	{
		if(videoPlayer.currentTime + time < selectedFeedInternal.liveTime || selectedFeedInternal.liveTime == 0)
		{
			videoPlayer.currentTime += time;
		}
	}

	var updateModel = function(progress, state, seeked)
	{
		//has an event been triggered
		head = true;
		if(state != selectedFeedInternal.state || seeked)
		{
			head = false;
		}
		
		var eventsViewed =[];
		for(var i in selectedFeedApplication.videoList[0].eventList)
		{
			if(progress > selectedFeedApplication.videoList[0].eventList[i] 
				&& lastProgress < selectedFeedApplication.videoList[0].eventList[i]
				&& $.inArray(selectedFeedApplication.videoList[0].eventList[i].eventId, selectedFeedInternal.eventsViewed))
			{
				eventsViewed.push(selectedFeedApplication.videoList[0].eventList[i].eventId);
			}
		}
		lastProgress = progress;
		app.update(moduleName, {tvPlayheadUpdate:{
				headOnly: head,
				feedId: selectedFeedInternal.feedId,
				progress: progress,
				state: state,
				seeked: seeked,
				localTimestamp: new Date().getTime(),
				eventsViewed: eventsViewed,
				pageLoad: undefined
			}});
	}

}());