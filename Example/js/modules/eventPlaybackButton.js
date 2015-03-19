//eventPlayback Button module
//on feed select create delete any existing listener to the eventPlaybackButton class and create a new one.
//ButtonId format is EventButtonPlayback_feedId_startTime_endTime which is used to generate the 
//bus message.

var eventPlaybackButton = (function()
{
	moduleName = "eventPlaybackButtonModule";

	var selectedFeedInternal;

	var observerCallback = function(message)
	{
	//	if(message.hasOwnProperty("playheadUpdate") && message.playheadUpdate.pageLoad != undefined)
		if(message == "ready")
		{
			//$(document).on("click", ".eventPlaybackButton", eventPlaybackButtonClickHandler);
			$("body").on("click", ".eventPlaybackButton", function(event){eventPlaybackButtonClickHandler(event)});

		}
	}

	app.subscribe(moduleName, observerCallback);

	var eventPlaybackButtonClickHandler = function(event)
	{
		var idStrings = [];
		idStrings = event.currentTarget.id.split("_");
		marathonHelpers.showVideoPlaybackModal(idStrings[1], idStrings[2], idStrings[3])
	}

}());
