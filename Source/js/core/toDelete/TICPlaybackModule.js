/* TIC module */

var TICplaybackModule = (function(){
	
	var selectedFeed = {};
	var selectedFeedApplication = {};
	var moduleName = "TICPlayback";

	var nextAutoPage = 0;
	var autoPages = [];

	var observerCallback = function(message)
	{
		if(message.hasOwnProperty("statusUpdate"))
		{
			if(message.statusUpdate.type == "feedSelect")
			{
				//set the selectedFeed variable
				selectedFeed = app.getFeedFromInternalModel("appModel", message.statusUpdate.feedId);
				selectedFeedApplication = app.getFeedFromApplicationModel(message.statusUpdate.feedId);

				if(selectedFeed.type == "TIC")
				{
					//show the player
					autoPages = [];
					$(".TICPlayerContainer").show();
					$(".TICPageContentContainer").html("");
					
					for(var i in selectedFeedApplication.pageList)
					{
					//populate autopages
						if(selectedFeedApplication.pageList[i].displayAuto)
						{
							autoPages.push(selectedFeedApplication.pageList[i]);
						}
					}
				}

				else
				{
					//hide the player and end playback
					//endPlayback();
					$(".TICPageContentContainer").html("");
					$(".TICPlayerContainer").hide();

				}
			}

		}

		if(message.hasOwnProperty('playheadUpdate'))
		{
			//check Next Autopage time
			checkNextAutoPage(message.playheadUpdate.progress);

			//if it's a new page select. Load the HTML in.
			if(message.playheadUpdate.pageLoad)
			{
				var pageToLoad;
				for(var i in selectedFeedApplication.pageList)
				{
					if(selectedFeedApplication.pageList[i].pageId == message.playheadUpdate.pageLoad)
					{
						pageToLoad = selectedFeedApplication.pageList[i]; 
					}
				}
				$.get(pageToLoad.url, function(data)
				{
					$(".TICPageContentContainer").html(data);
				})
			}
		}

		if(message.hasOwnProperty('tvPlayheadUpdate'))
		{
			//checknextAutoPage
			checkNextAutoPage(message.tvPlayheadUpdate.progress)
		}
		
	}

	app.subscribe(moduleName, observerCallback)

	var sortByTime = function(a, b)
	{
		if(a.time < b.time){
			return -1;
		}

		if(a.time > b.time){
			return 1;
		}

		return 0;
	}

	var checkNextAutoPage = function(progress)
	{

		if(autoPages.length > 0 && autoPages.length > nextAutoPage && progress > autoPages[nextAutoPage].time )
		{
			$.get(autoPages[nextAutoPage].url, function(data){
				$(".TICPageContentContainer").html(data);
				nextAutoPage++
				checkNextAutoPage(progress);
			});
		}
	}

}());