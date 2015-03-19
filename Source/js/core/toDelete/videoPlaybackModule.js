/* Video module */

var videoplayback = (function(){
	
	var selectedFeedInternal = {};
	var selctedFeedApplication = {}
	var videoPlayer;
	var scrubBar; //for touch events
	var progressEngaged = false;
	var progressBarTimeout;
	var lastTimeUpdate =0;
	var moduleName = "videoPlayback";
	var linkedFeeds = [];

	var endTime = 0;

	$(".videoPlayerContainer").show();

	var observerCallback = function(message)
	{
		//console.log("got a message "  + JSON.stringify(message));
		if(message.hasOwnProperty("statusUpdate"))
		{
			if(message.statusUpdate.type == "feedSelect" && message.statusUpdate.device=="app")
			{
				//set the selectedFeedInternal variable
				selectedFeedInternal = app.getFeedFromInternalModel("appModel", message.statusUpdate.feedId);
				linkedFeeds = app.getLinkedTICFeeds(selectedFeedInternal);


				if(selectedFeedInternal.type =="video")
				{
					$(".videoPlayerContainer").show();
					startPlayback(message.statusUpdate);
					if(message.statusUpdate.endTime)
					{
						endTime == message.statusUpdate.endTime;
					}
				}

				else if (videoPlayer)
				{
					//hide the player and end playback
					endPlayback();
					$(".videoPlayerContainer").hide();

				}
			}

		}
		
	}

	app.subscribe(moduleName, observerCallback)

	var startPlayback = function(message)
	{
		//get the feed from the application model
		selectedFeedApplication = app.getFeedFromApplicationModel(message.feedId);
		var renderObj = {
			url: selectedFeedApplication.videoList[0].url + "#t=" + message.progress
		}
		videoPlayerHTML = new EJS({url: "templates/videoPlayerTemplate.ejs"}).render(renderObj);
		$(".videoPlayerContainer").html(videoPlayerHTML);

		lastTimeUpdate = message.progress;
		
		videoPlayer = document.getElementById("videoPlayerElement");
		scrubBar = document.getElementById("videoPlayerSeekBar");

		videoPlayer.play();
		updateModel(videoPlayer.currentTime, "playing", false);


		//set the video player listeners
		$(".videoPlayerPlayPauseButton").on("click", playPauseButtonClickHandler);
		
		$("#videoPlayerSeekBar").on("mousedown", seekBarDownHandler);
		scrubBar.addEventListener('touchstart', seekBarDownHandler);
		
		scrubBar.addEventListener('touchmove', seekBarMoveHandler);
		$('#videoPlayerSeekBar').on("mousemove", seekBarMoveHandler);
		
		$('#videoPlayerSeekBar').on('mouseUp click', seekBarUpHandler);
		scrubBar.addEventListener('touchout', seekBarUpHandler);

		videoPlayer.addEventListener('timeupdate', timeUpdate);

		//TODO add an event listerner for when the video has loaded to set the currentTime as per the message

	}


	var playPauseButtonClickHandler = function(event)
	{
		if(!videoPlayer.paused)
		{
			videoPlayer.pause();
			$(".videoPlayerPlayPauseButton").html("play");
			//update Model
			updateModel(videoPlayer.currentTime, "paused", false);
		}

		else
		{
			videoPlayer.play()
			$(".videoPlayerPlayPauseButton").html("pause");
			updateModel(videoPlayer.currentTime, "playing", false)
		}
	}

	var seekBarDownHandler = function(event)
	{
		progressEngaged = true;
	}
	var seekBarMoveHandler = function(event)
	{
		//calculate the location of the click on the bar relative to the page
		if(progressEngaged)
		{
			var loc = event.pageX - $("#videoPlayerSeekBar").offset().left;
			var time = scrubBarPercentToPlaybackLocation(loc / ($("#videoPlayerSeekBar").width() /100));
			if(time < selectedFeedInternal.liveTime || selectedFeedInternal.liveTime == 0)
			{
				videoPlayer.currentTime = time;
			}
		}
	}

	var seekBarUpHandler = function(event)
	{
			//clearTimeout(progressBarTimeout);
			if(progressEngaged)
			{
				var loc = event.pageX - $("#videoPlayerSeekBar").offset().left;
				var time = scrubBarPercentToPlaybackLocation(loc / ($("#videoPlayerSeekBar").width() /100));
				if(time < selectedFeedInternal.liveTime || selectedFeedInternal.liveTime == 0)
				{
					videoPlayer.currentTime = time;
					updateModel(time, "playing", true);
				}
				progressEngaged = false;
			}
	}

	var playbackLocationToScrubBarPercent = function(location)
	{ 
		var l = location || videoPlayer.currentTime;
		return (100 / videoPlayer.duration) * l;
	}

	var scrubBarPercentToPlaybackLocation = function(percent)
	{
		return (videoPlayer.duration/100) * percent;
	}

	var timeUpdate = function(event)
	{
		//update the scrubbar playhead and live progress meter
		$(".playheadProgressMeter").css({"width": playbackLocationToScrubBarPercent(videoPlayer.currentTime) + "%"});
		$(".liveProgressMeter").css({"width": playbackLocationToScrubBarPercent(selectedFeedInternal.liveTime) + "%"})

		//TODO send the updated time back to the internal model.
		updateModel(videoPlayer.currentTime, "playing", false);
		if(endTime !- 0 && videoPlayer.currentTime >= endTime)
		{
			endPlayback();
		}
	}

	var endPlayback = function()
	{
		videoPlayer.pause();
	}

	var updateModel = function(progress, state, seeked)
	{
		head = true;
		if(state != selectedFeedInternal.state || seeked)
		{
			head = false;
		}

		//has an event been triggered
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
		app.update(moduleName, {playheadUpdate:{
				headOnly: head,
				feedId: selectedFeedInternal.feedId,
				progress: progress,
				state: state,
				seeked: seeked,
				localTimestamp: new Date().getTime(),
				eventsViewed: eventsViewed,
				pageLoad: undefined
			}});

		for (var i in linkedFeeds)
		{
				app.update(moduleName, {playheadUpdate:{
				headOnly: true,
				feedId: linkedFeeds[i].feedId,
				progress: progress,
				state: state,
				seeked: seeked,
				localTimestamp: new Date().getTime(),
				eventsViewed: [],
				pageLoad: undefined
			}});
		}
	}

}());