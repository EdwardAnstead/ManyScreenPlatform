//RunnerVideoViewModule.

var runnerVideoView = (function()
{

	var showingRunnerView = false;
	var runner;
	var applicationFeed;
	var videoTolerance = 60;
	var marathonStartGun = 1380443400;

	moduleName = "runnerVideoViewModule";
	var observerCallback = function(message)
	{
		if(message.hasOwnProperty("playheadUpdate") && message.playheadUpdate.pageLoad != undefined)
		{
			//wait until the document has a div for the page
			if($('#runnerVideoViewContainer').length)
			{
				showingRunnerView = true;
				applicationFeed = app.getFeedFromApplicationModel(message.playheadUpdate.feedId);
				for(var i in marathonData.runners)
				{
					for(var j in applicationFeed.pageList)
					{
						if(applicationFeed.pageList[j].pageId == message.playheadUpdate.pageLoad && 
							marathonData.runners[i].raceNo == applicationFeed.pageList[j].custom.raceNo)
						{
							runner = marathonData.runners[i];
							startTime = marathonStartGun + (runner.gunSecs - runner.chipSecs);
							endTime = startTime + runner.chipSecs;
							runner.tags = marathonHelpers.getRunnerVideos(runner, startTime, endTime, videoTolerance);
							sortTagsAndVideos();
							break;
						}
					}
				}
				drawRunnerView();
			}
			else
			{
				showingRunnerView = false;
			}
		}

		if(message.hasOwnProperty("statusUpdate") && showingRunnerView && message.statusUpdate.device == "app")
		{
			showingRunnerView = false;
		}

		if(message.hasOwnProperty("app"))
		{
			if(message.app.type == "newTag")
			{
				if($('#runnerVideoViewContainer').length && runner.raceNo == message.app.tag.raceNo)
					{
						runner.tags = marathonHelpers.getRunnerVideos(runner, startTime, endTime, videoTolerance);
						drawRunnerView();
					}

			}
		}
	}
		app.subscribe(moduleName, observerCallback);


	var sortTagsAndVideos = function()
	{
		var sortDistances = function(a,b)
		{
			if(a.distance > b.distance)
			{
				return 1;
			}

			if(a.distance < b.distance)
			{
				return -1;
			}

			return 0;
		};
		
		runner.tags.existingTags.sort(sortDistances);
		runner.tags.possibleVideos.sort(sortDistances);
	}

	var drawRunnerView = function()
	{
		var renderObj = runner;
		var runnerVideoHTML = new EJS({url: "templates/runnerVideoViewTemplate.ejs"}).render(renderObj);
		//$('#runnerVideoViewContainer').html(playlistHTML);
		$('#runnerVideoViewContainer').html(runnerVideoHTML);

		$('.eventPlaybackImage').unbind().on('click', eventPlaybackImageClickHandler)
	}

	var eventPlaybackImageClickHandler = function(event)
	{
		var idStrings = [];
		idStrings = event.currentTarget.id.split("_");
		//search through the tags and videos of the runner if tag don't display the tagging view
		for(var i in runner.tags.existingTags)
			{
				if(runner.tags.existingTags[i].videoPlaybackId == idStrings[1] + '_' + idStrings[2] + '_' + idStrings[3])
				{
					marathonHelpers.showVideoPlaybackModal(idStrings[1], idStrings[2], idStrings[3])
					return;
				}
			}
		marathonHelpers.showVideoPlaybackModal(idStrings[1], idStrings[2], idStrings[3], true);
		
	}



}());