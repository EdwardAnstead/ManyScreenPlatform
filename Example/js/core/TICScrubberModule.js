//TIC Srubber module
//implements the tic scrubber bar. responds to updates to the playhead
//also allows for interaction within playhead

//Feeds with a scrubber shouldn't be linked to video feeds.  That interaction should be carried out with the tv controls

var TICScrubber = (function(){
var moduleName = "TICScrubberModule";
var selectedFeed;
var selectedFeedApplication;
var scrubBar
var playing = false;
var lastTimeStamp;
var progressEngaged = false;
var playheadTimeout;

var observerCallback = function(message)
{
	//on feed change if the feed is a tic and scrubber is true draw the scrubber.
	
	if(message.hasOwnProperty("statusUpdate") && message.statusUpdate.type == "feedSelect"){
		//set the selectedFeed variable
		selectedFeed = app.getFeedFromInternalModel("appModel", message.statusUpdate.feedId);
		selectedFeedApplication = app.getFeedFromApplicationModel(message.statusUpdate.feedId);
	
		if(selectedFeed.type == "TIC" && selectedFeedApplication.scrubber){
			$(".TICScrubberContainer").show();
			startScrubber();
		}

		else{
			clearTimeout(playheadTimeout);
			$(".TICScrubberContainer").hide();

		}
	}
}

app.subscribe(moduleName, observerCallback);

var startScrubber = function()
{
	TICScrubberHTML = new EJS({url: "templates/TICScrubberTemplate.ejs"}).render({});
	$(".TICScrubberContainer").html(TICScrubberHTML);

	scrubBar = document.getElementById("TICScrubberSeekBar");


	$(".TICScrubberPlayPauseButton").on("click", playPauseButtonClickHandler);
	
	$("#TICScrubberSeekBar").on("mousedown", seekBarDownHandler);
	scrubBar.addEventListener('touchstart', seekBarDownHandler);
	
	scrubBar.addEventListener('touchmove', seekBarMoveHandler);
	$('#TICScrubberSeekBar').on("mousemove", seekBarMoveHandler);
	
	$('#TICScrubberSeekBar').on('mouseUp click', seekBarUpHandler);
	scrubBar.addEventListener('touchout', seekBarUpHandler);

	playing = true;
	lastTimeStamp = Date.now();
	updatePlayhead();
}

var updatePlayhead = function()
{
	playheadTimeout = setInterval(function(){
		if(playing){
			nextTimeStamp = Date.now();
			progress = selectedFeed.progress + ((nextTimeStamp - lastTimeStamp)/1000) 
			lastTimeStamp = nextTimeStamp;

			updateModel(progress,"playing", false)

			$(".playheadProgressMeter").css({"width": playbackLocationToScrubBarPercent(selectedFeed.progress) + "%"});
			$(".liveProgressMeter").css({"width": playbackLocationToScrubBarPercent(selectedFeed.liveTime) + "%"})
		}
	}, 100)
}


var playPauseButtonClickHandler = function(event)
{
	if(playing){
		$(".TICScrubberPlayPauseButton").html("play")
		playing = false;
		nextTimeStamp = Date.now();
		progress = selectedFeed.progress + ((nextTimeStamp - lastTimeStamp)/1000) 
		lastTimeStamp = nextTimeStamp;

		updateModel(progress, "paused", false)

	}

	else{
		$(".TICScrubberPlayPauseButton").html("pause");
		playing = true;
		lastTimeStamp = Date.now();
		updatePlayhead();
	}
}

var playbackLocationToScrubBarPercent = function(location)
{ 
	var duration = (selectedFeedApplication.endTime - selectedFeedApplication.startTime)/1000;
	return (100 / duration) * location;
}

var scrubBarPercentToPlaybackLocation = function(percent)
{
	var duration = (selectedFeedApplication.endTime - selectedFeedApplication.startTime)/1000;
	return (duration/100) * percent;
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
		var loc = event.pageX - $("#TICScrubberSeekBar").offset().left;
		var time = scrubBarPercentToPlaybackLocation(loc / ($("#TICSrubberSeekBar").width() /100));
		if(time < selectedFeed.liveTime || selectedFeed.liveTime == 0)
		{
			updateModel(time, "playing", false); //only send the message as a head update, send the seek when click released
		}
	}
}

var seekBarUpHandler = function(event)
{
		//clearTimeout(progressBarTimeout);
		if(progressEngaged)
		{
			var loc = event.pageX - $("#TICScrubberSeekBar").offset().left;
			var time = scrubBarPercentToPlaybackLocation(loc / ($("#TICScrubberSeekBar").width() /100));
			if(time < selectedFeed.liveTime || selectedFeed.liveTime == 0)
			{
				updateModel(time, "playing", true);
			}
			progressEngaged = false;
		}
}

var updateModel = function(progress, state, seeked)
{

	head = true;
	if(state != selectedFeed.state || seeked){
		head = false;
	}

	app.update(moduleName, {playheadUpdate:{
			headOnly: head,
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

