//TV playback Module

var tvPlaybackModule = (function()
{
	var selectedFeedInternal = {};
	var videoPlayer;
	var moduleName = "tvPlayback";
	var stateFlag = "none";
	var endTime = 0;
	var seeking = false;
	var seekingInterval;
	var timeUpdateCounter = 0;

	var overlays = tvOverlays();

	var observerCallback = function(message)
	{

		if(message.hasOwnProperty("statusUpdate"))
		{
			if(message.statusUpdate.type == "feedSelect" && message.statusUpdate.device=="tv")
			{

				//switch the TV feed to the one in the message.
				selectedFeedInternal = app.getFeedFromInternalModel("tvModel", message.statusUpdate.feedId);
				startPlayback(message.statusUpdate);
				$('body').keydown(keyDownEvent);
				$('body').keyup(keyUpEvent);

				if(message.statusUpdate.endTime)
				{
					endTime = message.statusUpdate.endTime;
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
					overlays.playOverlay();

			}

			if(mainMessage.state == "paused" && !videoPlayer.paused)
			{
				console.log("got a pause message");
				stateFlag = "paused";
				videoPlayer.pause();
				updateModel(videoPlayer.currentTime, "paused", false);
				overlays.pauseOverlay();
			}
		}
	}

	app.subscribe(moduleName, observerCallback);

	var keyDownEvent = function(event)
	{
		keyPressed = event.which;

		if(keyPressed == 37 && !seeking)
		{
			//startRewind;			 	
			seeking = true;
			 seekingInterval = setInterval(function(){
			 	videoPlayer.currentTime -= 0.1;
			 },25)
		}

		else if(keyPressed == 39 && !seeking)
		{
			//start fastforward	
			seeking = true;

			seekingInterval = setInterval(function(){

				videoPlayer.currentTime +=0.1
			}, 25)
		}
	}

	var keyUpEvent = function(event)
	{
		keyPressed = event.which;
		if(keyPressed == 32)
		{
			if(stateFlag == "playing")
			{
				stateFlag = "paused";
				videoPlayer.pause();
				updateModel(videoPlayer.currentTime, "paused", false);
				overlays.pauseOverlay();
				return;
			}
			else if (stateFlag =="paused");
			{
				stateFlag = "playing";
				videoPlayer.play();
				updateModel(videoPlayer.currentTime, "playing", false);
				overlays.playOverlay();
				return;
			}
		}

		else if(keyPressed == 37 || keyPressed == 39)
		{
			//stop rewind
			seeking = false;
			clearInterval(seekingInterval);
			updateModel(videoPlayer.currentTime, stateFlag, true)
		}

	}

	var startPlayback = function(message)
	{
		if(videoPlayer)
		{
			videoPlayer.setAttribute("src", false);
            videoPlayer.load();
		}
		selectedFeedApplication = app.getFeedFromApplicationModel(message.feedId);
		var renderObj = {
			url: selectedFeedApplication.videoList[0].url + "#t=" + message.progress
		}
		videoPlayerHTML = new EJS({url: "templates/tvPlayerTemplate.ejs"}).render(renderObj);
		$(".tvPlayerContainer").html(videoPlayerHTML);

		overlays.playOverlay(selectedFeedApplication.feedName);
		//lastTimeUpdate = message.progress;
		
		videoPlayer = document.getElementById("tvPlayerElement");
		stateFlag = "playing";
		videoPlayer.play();
		updateModel(message.progress, "playing", false);
		videoPlayer.addEventListener("timeupdate", timeUpdate);
		videoPlayer.addEventListener("ended", videoEnded)
	}

	var timeUpdate = function(event)
	{
		timeUpdateCounter++
		if(endTime != 0 && videoPlayer.currentTime >= endTime)
		{
			//TODO make this elegantly go back to a splash screen also when the end of the video is reached
			videoPlayer.pause();
			stateFlag = "ended";
			updateModel(videoPlayer.currentTime, "ended", false);

		}
		else
		{
			if(timeUpdateCounter >= 100 && stateFlag != "ended")
			{
				timeUpdateCounter = 0;
				updateModel(videoPlayer.currentTime, "playing",false, false)
			}

			else
			{
				timeUpdateCounter++;
			}
		}
		

		if(stateFlag == "playing")
		{	
			updateModel(videoPlayer.currentTime, "playing", false);
		}



	}

	var videoEnded = function(event)
	{
		stateFlag = "ended";
		updateModel(videoPlayer.currentTime, "ended", false);
	}

	var seekTo = function(time)
	{
		if(videoPlayer.currentTime + time < selectedFeedInternal.liveTime || selectedFeedInternal.liveTime == 0)
		{
			videoPlayer.currentTime += time;
		}
	}

	var updateModel = function(progress, state, seeked, headOnly)
	{
		//has an event been triggered
		if(headOnly == undefined)
		{
			head = true;
			if(state != selectedFeedInternal.state || seeked)
			{
				head = false;
			}
		}

		else
		{
			head = headOnly;
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