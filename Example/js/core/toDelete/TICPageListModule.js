//tic page list module
//listen for status updates to set the feeds and playhead / tvplayhead to show the available pages
//when the page is clicked send a playhead message updating with the viewed page

var TICPageList = (function()
{
	var moduleName = "TICPageListModule"
	var selectedFeedInternal = {};
	var selectedFeedApplication = {};
	var nextPageTime = 0;
	var showingSpoilers = "locked";

	var selectedTvFeed = {};

	var observerCallback = function(message)
	{
		if(message.hasOwnProperty("statusUpdate"))
		{
			if(message.statusUpdate.type == "feedSelect")
			{
				//set the selectedFeedInternal variable
				selectedFeedInternal = app.getFeedFromInternalModel("appModel", message.statusUpdate.feedId);
				linkedFeeds = app.getLinkedTICFeeds(selectedFeedInternal);
				selectedFeedApplication = app.getFeedFromApplicationModel(message.statusUpdate.feedId);

				showingSpoilers = selectedFeedApplication.spoilerLock ? "locked" : "none";

				if(selectedFeedInternal.type =="TIC" && selectedFeedApplication.pageListDisplay)
				{
						drawPageList(message.statusUpdate.progress);
						checkTvFeedLiveTime();
				}

				//reset the selectedFeeds so that playhead updates don't get confused into thinking we are vewing
				//the feed.
				else
				{
					selectedFeedInternal = {};
					selectedFeedApplication = {};
				}

			}

		}

		if( message.hasOwnProperty("tvPlayheadUpdate") && message.tvPlayheadUpdate.feedId == selectedFeedInternal.feedId)
		{
			if(selectedTvFeed == undefined || message.tvPlayheadUpdate.feedId != selectedTvFeed.feedId)
			{
				selectedTvFeed = app.getFeedFromInternalModel(message.tvPlayheadUpdate.feedId);
			}
			nextPageCheck(message.tvPlayheadUpdate)
		}

		if(message.hasOwnProperty("playheadUpdate") && message.playheadUpdate.feedId == selectedFeedInternal.feedId)
		{
			nextPageCheck(message.playheadUpdate);
		}

		function nextPageCheck(pMessage)
		{
			if(pMessage.progress > nextPageTime)
			{
				if(selectedFeedApplication.spoilerLock)
				{
					drawPageList(pMessage.progress);
				}

				else
				{
					drawPageList(pMessage.progress);
				}
			}
		}

	}

	app.subscribe(moduleName, observerCallback);

	var checkTvFeedLiveTime = function()
	{
		setTimeout(function(){
			//automatically check if we need to redraw the list of updates if, spoilers are unlocked
			//the tv channel is not the same as the selected Channel
			//the tv channel is the same but paused.
			if(showingSpoilers == "unlocked" && (selectedTvFeed.feedId != selectedFeedInternal.feedId
				||selectedTvfeed.state == "paused")){
				drawPageList(selectedFeedApplication.progress, "unlocked");
				checkTvFeedLiveTime();
			}
		},5000)
	}

	var drawPageList = function(progress)
	{
		var pagesToDraw = {pages: [], spoilerLock: showingSpoilers};
		if(showingSpoilers == "none"  || showingSpoilers == "locked")
		{	
			for (var i in selectedFeedApplication.pageList)
			{
				if(selectedFeedApplication.pageList[i].time < progress)
				{
					pagesToDraw.pages.push({"pageId": selectedFeedApplication.pageList[i].pageId, 
												"pageName": selectedFeedApplication.pageList[i].title});
				}

				else if(nextPageTime == 0)
				{
					nextPageTime == selectedFeedApplication.pageList[i].time;
				}

				else if(selectedFeedApplication.pageList[i].time < nextPageTime)
				{
					nextPageTime = selectedFeedApplication.pageList[i].time;
				}
			}
		}

		else
		{
			for(var i in selectedFeedApplication.pageList)
			{
				if(selectedFeedApplication.pageList[i].time < selectedFeedInternal.liveTime || selectedFeedInternal.liveTime == 0)
				{
					pagesToDraw.pages.push({"pageId": selectedFeedApplication.pageList[i].pageId,
										"pageName": selectedFeedApplication.pageList[i].title})
				}

				else if(nextPageTime == 0)
				{
					nextPageTime == selectedFeedApplication.pageList[i].time;
				}

				else if(selectedFeedApplication.pageList[i].time < nextPageTime)
				{
					nextPageTime = selectedFeedApplication.pageList[i].time;
				}

			}
		}

		TICPageListHTML = new EJS({url: "templates/TICPageListTemplate.ejs"}).render(pagesToDraw);
		$(".TICPageListContainer").html(TICPageListHTML);

		//listeners
		$('#spoilerLockButton').click(spoilerLockButtonClickHandler);
		$('.TICPageButton').click(TICPageButtonClickHandler)
	}

	var spoilerLockButtonClickHandler = function(event)
	{
		if(showingSpoilers == "locked")
		{
			showingSpoilers = "unlocked";
			drawPageList(selectedFeedInternal.progress);
			
		}

		else
		{
			showingSpoilers = "locked";
			drawPageList(selectedFeedInternal.progress);
		}
	}

	var TICPageButtonClickHandler = function (event)
	{
		var pageClickedId = event.currentTarget.id;
		app.update(moduleName, {playheadUpdate:{
				headOnly: false,
				feedId: selectedFeedInternal.feedId,
				progress: selectedFeedInternal.progress,
				state: "none",
				seeked: false,
				localTimestamp: new Date().getTime(),
				eventsViewed: [],
				pageLoad: pageClickedId
			}});
	}

}());