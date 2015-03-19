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
	var fullscreen = false;
	var originalVideoSettings;

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
				videoPlayer = undefined;

				if(selectedFeedInternal.type =="video")
				{
					$(".videoPlayerContainer").show();
					startPlayback(message.statusUpdate);
					if(message.statusUpdate.endTime)
					{
						endTime = message.statusUpdate.endTime;
					}
				}

				else
				{
					//hide the player and end playback
					if(videoPlayer){endPlayback()};
					$(".videoPlayerContainer").hide();

				}
			}

		}
		
	}

	app.subscribe(moduleName, observerCallback)

	var startPlayback = function(message)
	{
		if(videoPlayer)
		{
			videoPlayer.setAttribute("src", false);
            videoPlayer.load();
		}

		//get the feed from the application model
		selectedFeedApplication = app.getFeedFromApplicationModel(message.feedId);
		var renderObj = {
			'url': selectedFeedApplication.videoList[0].url,
			'state': selectedFeedInternal.state,
			'fullscreen': fullscreen
		}
		//$(".videoPlayerContainer").height($(window).height() - $('#titleBar').height() - $('#channelListContainer'));
		videoPlayerHTML = new EJS({url: "templates/videoPlayerTemplate.ejs"}).render(renderObj);
		$(".videoPlayerContainer").html(videoPlayerHTML);
		$('#videoPlayerSeekBar').width($('#videoControls').width()-190)
		lastTimeUpdate = message.progress;
		
		videoPlayer = document.getElementById("videoPlayerElement");

		videoStartListener = function(event)
		{
			if(message.progress != 0)
			{
				videoPlayer.currentTime = message.progress - 0.2;
				setTimeout(function(){
					$("#loadingMask").hide(150);
				}, 200);

			}

			else
			{
				$("#loadingMask").hide(150);
			}
			
			updateModel(message.progress, "playing", false);
			videoPlayer.removeEventListener('progress', videoStartListener, false);
		}

		videoCanPlayThroughListener = function(event)
		{
			videoPlayer.addEventListener('progress', videoStartListener);
			videoPlayer.removeEventListener('canplaythrough', videoCanPlayThroughListener, false)
		}
		videoPlayer.addEventListener('canplaythrough', videoCanPlayThroughListener);
		scrubBar = document.getElementById("videoPlayerSeekBar");

		videoPlayer.play();


		//set the video player listeners
		$(".videoPlayerPlayPauseButton").unbind().on("click", playPauseButtonClickHandler);
		$(".videoPlayerFullscreenButton").unbind().on('click', fullScreenButtonClickHandler);
		
		$("#videoPlayerSeekBar").unbind().on("mousedown", seekBarDownHandler);
		scrubBar.addEventListener('touchstart', seekBarDownHandler);
		
		scrubBar.addEventListener('touchmove', seekBarMoveHandler);
		$('#videoPlayerSeekBar').on("mousemove", seekBarMoveHandler);
		
		$('#videoPlayerSeekBar').on('mouseUp click', seekBarUpHandler);
		scrubBar.addEventListener('touchout', seekBarUpHandler);

		videoPlayer.addEventListener('timeupdate', timeUpdate);
		videoPlayer.addEventListener('ended', videoEnded);

		//TODO add an event listerner for when the video has loaded to set the currentTime as per the message

	}


	var playPauseButtonClickHandler = function(event)
	{
		if(!videoPlayer.paused)
		{
			videoPlayer.pause();
			$(".videoPlayerPlayPauseButton img").attr("src", "res/play.png");
			//update Model
			updateModel(videoPlayer.currentTime, "paused", false);
		}

		else
		{
			videoPlayer.play()
			$(".videoPlayerPlayPauseButton img").attr("src", "res/pause.png");
			updateModel(videoPlayer.currentTime, "playing", false)
		}
	}

	var fullScreenButtonClickHandler = function(event)
	{
		if(!fullscreen)
		{
			fullscreen = true;
			originalVideoSettings = $('.videoPlayerContainer').css(['top', 'left', 'width', 'height', 'z-index', 'position']);
			//set the CSS of the video player container so height and width fill screen
			fullscreenValues = {'top': 0,
								'left': 0,
								'width': $(window).width(),
								'height': $(window).height(),
								'z-index': 1000,
								'position': 'absolute'}
			$('.videoPlayerContainer').css(fullscreenValues);
			$('.videoPlayerFullscreenButton img').attr('src', "res/windowed.png");
		}

		else
		{
			fullscreen = false;
			$('.videoPlayerContainer').css(originalVideoSettings);
			$('.videoPlayerFullscreenButton img').attr('src', "res/fullscreen.png");

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
					videoPlayer.play();
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
		if(videoPlayer)
		{
			//update the scrubbar playhead and live progress meter
			$(".playheadProgressMeter").css({"width": playbackLocationToScrubBarPercent(videoPlayer.currentTime) + "%"});
			$(".liveProgressMeter").css({"width": playbackLocationToScrubBarPercent(selectedFeedInternal.liveTime) + "%"})
			
			//update the time display
			time = videoPlayer.currentTime;
			hours = Math.floor(time/3600)
			time -= hours*3600; 
			minutes = Math.floor(time/60)
			seconds = Math.floor(time - minutes*60);
			var timeString =(hours > 0)? hours + ":" : "";
			timeString +=(minutes > 9)? minutes + ":": '0' + minutes + ":";
			timeString +=(seconds > 9)? seconds : '0' + seconds;
			$('.videoPlayerTimer').html(timeString); 
			
			//TODO send the updated time back to the internal model.
			updateModel(videoPlayer.currentTime, "playing", false);
			if(endTime != 0 && videoPlayer.currentTime >= endTime)
			{
				videoPlayer.pause();
				updateModel(videoPlayer.currentTime, "ended", false);
			}
		}
		else
		{
			document.getElementById("videoPlayerElement").pause();
		}
	}

	var videoEnded = function(event)
	{
		updateModel(videoPlayer.currentTime, "ended", false);
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