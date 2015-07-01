/* App module

1. determine the type of application this is based on the container div class
2. Connect to the message bus and get the application model and build the internal model
3. Subject class for the obsrever implementation


*/

var app = (function ()
{
	var applicationType;
	var applicationModel;
	var internalModel = {};
	var modelsReady = false;
	var tvStatusMod;

	//application entry point to be run by $(document).ready function
	var setAndConnect = function(busURL)
	{
		if($(".remoteWindow").length)
		{
			applicationType = "remote";
		}

		else if($(".tvWindow").length)
		{
			applicationType = "tv";
		}
		else	
		{
			applicationType = "app";
		}

		//connect to message bus
		messageBus.connect(applicationType, busURL);

	}

	var getApplicationType= function(){
		return applicationType;
	}


	var setAppData = function(appData)
	{
		applicationModel = appData.data.app;
		console.log("set the app data");

		//create the intrenalModel for the application and the TV from the applicationModel
		var channelList = [];
		for(i in applicationModel)
		{
			var channelModel = {
			channelId : applicationModel[i].channelId,
			startTime: applicationModel[i].startTime,
			endTime: applicationModel[i].endTime,
			feeds : [],
			available: "no",
			selected: false};

			for(i1 in applicationModel[i].feeds)
			{
				var feedModel = {
				feedId : applicationModel[i].feeds[i1].feedId,
				type: applicationModel[i].feeds[i1].type,
				startTime: applicationModel[i].feeds[i1].startTime,
				endTime: applicationModel[i].feeds[i1].endTime,
				progress : 0,
				liveTime: 0,
				state: "none", //could be playing, paused or none
				eventsViewed : [],
				available: "no",
				selected: false,
				};
				
				channelModel.feeds.push(feedModel);
			}

			channelList.push(channelModel);
		}

		//push on the TV model
		internalModel.tvModel = appData.data.tvStartState;
		if(applicationType !="tv")
		{
			//run the tvStatus startup
			//tvStatusMod = tvStatus()
			//tvStatusMod.setupTv(appData.timestamp)

		}
		if(applicationType == "app")
		{
			internalModel.appModel = channelList; 
		}

		//start the availability loop which will update in the background when a channel / feed is available
		availability.loop(function(){});
		observer.publish("app", "ready");
		//also check if the tv has a selected playing feed that the app needs to track
		selectedTvFeed = getSelectedTvFeed();
		if(selectedTvFeed)
		{
			observer.publish("app", {"tvPlayheadUpdate": {
				headOnly: false,
				feedId: selectedTvFeed.feedId,
				progress: selectedTvFeed.progress,
				state: selectedTvFeed.state,
				seeked: false,
				localTimestamp: new Date().getTime(),
				eventsViewed: selectedTvFeed.eventsViewed,
				pageLoad: undefined
			}});
		}

	}

	var getSelectedTvFeed = function()
	{
		for (var i in internalModel.tvModel)
		{
			for(var i1 in internalModel.tvModel[i].feeds)
			{
				if(internalModel.tvModel[i].feeds[i1].selected == true)
				{
					return internalModel.tvModel[i].feeds[i1];
				}
			}
		}

		return 0;
	}


	var getChannelFromInternalModel = function(model, channelId)
	{
		if(model == 'appModel')
		{
			for (var i in internalModel.appModel)
			{
				if(internalModel.appModel[i].channelId = channelId)
				{
					return internalModel.appModel[i];
				}
			}
		}

		else
		{
			for (var i in internalModel.tvModel)
			{
				if(internalModel.tvModel[i].channelId = channelId)
				{
					return internalModel.tvModel[i];
				}
			}
		}

	}

	var getLinkedTICFeeds = function(feed)
	{
		//get the channel from the application model that contains the feed
		var curChan = getChannelFromApplicationModelByFeed(feed)
		var linkedFeeds = [];
		for(var i in curChan.feeds)
		{
			if(curChan.feeds[i].type == "TIC" && curChan.feeds[i].linkedToVideo == feed.feedId)
			{
				linkedFeeds.push(getFeedFromInternalModel('tvModel', curChan.feeds[i].feedId));
			}
		}
		
		return linkedFeeds;

	}

	var getChannelFromApplicationModelByFeed = function(feed)
	{
		for (var i in applicationModel)
		{
			for (var j in applicationModel[i].feeds)
			{
				if(applicationModel[i].feeds[j].feedId == feed.feedId)
				{
					return applicationModel[i];
				}
			}
		}
	}

	var getChannelFromApplicationModel = function(channelId)
	{
		for(var i in applicationModel)
		{
			if(channelId == applicationModel[i].channelId)
				return applicationModel[i];
		}
	}

	var getFeedFromInternalModel = function(model, feedId)
	{
		var iModel = {};
		if (model == "appModel")
		{
			iModel = internalModel.appModel;
		}

		else
		{
			iModel = internalModel.tvModel;
		}

		for(var i in iModel)
		{
			for(i1 in iModel[i].feeds)
			{
				if(feedId == iModel[i].feeds[i1].feedId)
				{
					return iModel[i].feeds[i1];
				}
			}
		}
	}

	var getFeedFromApplicationModel = function(feedId)
	{
		for(i in applicationModel)
		{
			for(i1 in applicationModel[i].feeds)
			{
				if(feedId == applicationModel[i].feeds[i1].feedId)
				return applicationModel[i].feeds[i1]
			}
		}
	}

	var getSelectedFeed = function(model)
	{
		var iModel = {};
		if (model == "appModel")
		{
			iModel = internalModel.appModel;
		}

		else
		{
			iModel = internalModel.tvModel;
		}

		for(var i in iModel)
		{
			for(i1 in iModel[i].feeds)
			{
				if(iModel[i].feeds[i1].selected)
				{
					return iModel[i].feeds[i1];
				}
			}
		}
	}


	var update = function(sourceModule, message, e)
	{
		/*update the internalModel based on updates from the server or another module
			message Format: {playheadupdate: {feedId: feedId, progress: #, seeked: true/false, state: "none/playing/pause", timestamp: #, eventsViewed: [], pageLoaded:pageId, localTimestamp: #}}

			1. determine if the message is for the TV or the app
			2. update the Tv or the app model
			3. Is the updated feed linked to a TIC feed if so update the TIC feed equally. If the pages are autoloaded does the page need to be increased
			4. does the update need to be pushed to the server (logging change or TV change) if so send it 
			5. Publish the change so modules can respond.
		*/

		var feed = {};
		var sendToBus = false;
		var external = e || false;
		var messageBody; 

		if(applicationType == "app" && message.hasOwnProperty("playheadUpdate") && !external)
		{
			messageBody = message.playheadUpdate;
			feed = getFeedFromInternalModel("appModel", message.playheadUpdate.feedId)
			feed.progress = messageBody.progress; 

			if(messageBody.seeked || messageBody.state != feed.state || messageBody.pageLoad != feed.pageLoad || messageBody.eventsViewed.length != feed.eventsViewed.length)
			{
				//send to the server for logging and update if TV
				sendToBus = true;
				feed.state = messageBody.state;
				feed.pageLoaded = messageBody.pageLoaded;
				feed.eventsViewed = messageBody.eventsViewed

			}

			observer.publish(sourceModule, message);

		}

		if(message.hasOwnProperty("tvPlayheadUpdate"))
		{
			feed = getFeedFromInternalModel("tvModel", message.tvPlayheadUpdate.feedId);
			messageBody = message.tvPlayheadUpdate
			feed.progress = messageBody.progress; // + (new Date().getTime() - messageBody.localTimestamp);

			//sendToBus = true;

			//if(messageBody.seeked || messageBody.state != feed.state || messageBody.pageLoaded != feed.pageLoaded || messageBody.eventsViewed.length != feed.eventsViewed.length)
			if(!messageBody.headOnly && !external)
			{
				//send to the server for logging and update if TV
				sendToBus = true;
				feed.state = messageBody.state;
				feed.pageLoaded = messageBody.pageLoaded;
				feed.eventsViewed = messageBody.eventsViewed
			}

			observer.publish(sourceModule, message);

		}

		if(message.hasOwnProperty("statusUpdate") && !external)
		{
			if(message.statusUpdate.type == "channelSelect" || message.statusUpdate.type == "feedSelect")
			{
				sendToBus = true;
			}
			observer.publish(sourceModule, message);
		}

		if(message.hasOwnProperty("statusUpdate") && external && applicationType == "tv" && message.statusUpdate.device == "tv")
		{
			observer.publish(sourceModule, message);
		}

		if(message.hasOwnProperty("app"))
		{
			sendToBus = true;
			observer.publish(sourceModule, message);
		}

		//notify the modules listening 

		//send the message to the server if needed
		if(sendToBus && !external)
		{
			messageBus.sendMessage(genMessage(message));
		}
	
	}

	var getApplicationModel = function()
	{
		return applicationModel;
	}

	var getInternalModel = function()
	{
		return internalModel;
	}

	var genMessage = function(message)
	{
		message.timestamp = syncTime.getSyncTime();
		message.deviceId = messageBus.getDeviceId();

		return message;
	}


	var getResumePosition = function(feed)
	{
		var tvTime = getFeedFromInternalModel("tvModel", feed.feedId).progress;
		var appTime = getFeedFromInternalModel('appModel', feed.feedId).progress;

		if(tvTime > appTime)
		{
			return tvTime;
		}

		return appTime;
	}

	return{
		setAppData: setAppData,
		setAndConnect: setAndConnect,
		subscribe: observer.subscribe,
		unsubscribe: observer.unsubscribe,
		update: update,
		getInternalModel: getInternalModel,
		getApplicationModel: getApplicationModel,
		getChannelFromInternalModel: getChannelFromInternalModel,
		getChannelFromApplicationModel: getChannelFromApplicationModel,
		getFeedFromApplicationModel: getFeedFromApplicationModel,
		getFeedFromInternalModel: getFeedFromInternalModel,
		getResumePosition: getResumePosition,
		getSelectedFeed: getSelectedFeed,
		getLinkedTICFeeds: getLinkedTICFeeds,
		getApplicationType: getApplicationType,
		getSelectedTvFeed: getSelectedTvFeed		
	}
}());

