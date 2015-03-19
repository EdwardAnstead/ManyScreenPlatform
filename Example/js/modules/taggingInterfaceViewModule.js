var taggingInterfaceView = (function()
{

	var moduleName = "taggingInterfaceViewModule"
	var selectedFeed;
	var selectedFeedInternalTv = {};
	var inputNumberValue = "";
	var tvChannelWaitTimeout;

	var observerCallback = function(message)
	{
		if(message.hasOwnProperty("playheadUpdate") && message.playheadUpdate.pageLoad != undefined)
		{
			if($('#taggingPage').length)
			{
				selectedFeed = app.getFeedFromApplicationModel(message.playheadUpdate.feedId);
				
				//load in the tagging page template. if the TV is playing else display a message to the
				//user that the interface is not available until TV is playing.
			

				if (selectedFeedInternalTv.feedId == "raceOverviewVideo"){
					$('#taggingPage').html("<h1>You Can't tag this video</h1>");
					waitForTvChannel();
				}

				else if(selectedFeedInternalTv != {})
				{
					loadTaggingInterface();
				}
			
			}

		}

		if(message.hasOwnProperty('tvPlayheadUpdate') && 
			$('#taggingPage').length &&
			(selectedFeedInternalTv == {} || message.tvPlayheadUpdate.feedId != selectedFeedInternalTv.feedId))
		{
			if(app.getFeedFromInternalModel('tvModel', message.tvPlayheadUpdate.feedId).type == "video")
			{
				selectedFeedInternalTv = app.getFeedFromInternalModel('tvModel', message.tvPlayheadUpdate.feedId);

				if(message.tvPlayheadUpdate.feedId == "raceOverviewVideo")
				{
					$('#taggingPage').html("<h1>You Can't tag this video</h1>");
					waitForTvChannel();
				}

				else
				{
					loadTaggingInterface();
				}
			}
		}

		if(message.hasOwnProperty("statusUpdate"))
		{
			clearTimeout(tvChannelWaitTimeout);
		}
	}

	var loadTaggingInterface = function()
	{
		var taggingViewHTML = new EJS({url: "templates/taggingViewTemplate.ejs"}).render(selectedFeed.pageList[0].custom);
		$('#taggingPage').html(taggingViewHTML);

		//add in some listeners
		$(".runnerTagButton").click(runnerTagButtonClickHandler);
		$(".digitTagButton").click(digitTagButtonClickHandler);
		$("#okTagButton").click(okTagButtonClickHandler);
		$("#clear_tagButton").click(clearTagButtonClickHandler);
	}

	var waitForTvChannel = function()
	{
		tvChannelWaitTimeout = setTimeout(function(){
			if(selectedFeedInternalTv != {} && selectedFeedInternalTv.feedId != "raceOverviewVideo")
			{
				loadTaggingInterface()
			}
			else
			{
				waitForTvChannel();
			}
		}, 400)
	}

	var runnerTagButtonClickHandler = function(event)
	{
		//get the runner number from the button Id.
		var idStrings = event.target.id.split('_');
		//alert("tag for runner " + idStrings[0]);
		marathonHelpers.createNewTag(selectedFeedInternalTv.feedId, selectedFeedInternalTv.progress, idStrings[0]);
		alert("new tag created for runner" + idStrings[0]);
	}

	var digitTagButtonClickHandler = function(event)
	{
		var idStrings = event.target.id.split('_');
		if(inputNumberValue.length < 4)
		{
			inputNumberValue +=idStrings[0]
		}
		$("#inputNumber").html(inputNumberValue);

	}

	var okTagButtonClickHandler = function(event)
	{
		if(inputNumberValue.length)
		{
			marathonHelpers.createNewTag(selectedFeedInternalTv.feedId, selectedFeedInternalTv.progress, inputNumberValue);
			alert("tag for runner " + inputNumberValue);
			inputNumberValue = "";
			$("#inputNumber").html(inputNumberValue);
		}
	}

	clearTagButtonClickHandler = function(event)
	{
		inputNumberValue = inputNumberValue.slice(0, -1);
		$("#inputNumber").html(inputNumberValue);


	}

	app.subscribe(moduleName, observerCallback);

}());