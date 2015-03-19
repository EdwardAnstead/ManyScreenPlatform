/* channelList module 
Populates the channelList template with the channels from  the applicationModel
*/

var channelList = (function()
{
	//subscribe to the observer - only interested in ready to be able to display channels.
	var firstChannelToDraw = 0;
	var appModel;
	var internalModel;
	var highlightedFeed = {};
	var moduleName = "channelList";

	var observerCallback = function(message)
	{
		if(message == "ready")
		{
			//then draw the channel list
			appModel = app.getApplicationModel();
			internalModel = app.getInternalModel();
			drawChannels();

			//check if any of the channels are autoselect
			for(var i in appModel)
			{
				if(appModel[i].autoSelect)
				{
					selectChannel("appModel", appModel[i].channelId);
					autoFeedSelector(app.getChannelFromApplicationModel(appModel[i].channelId));
				}
			}
			return;

		}

		if(message.hasOwnProperty("statusUpdate"))
		{
			if(message.statusUpdate.type == "availabilityUpdate" ||message.statusUpdate.type == "channelSelect")
			{
				drawChannels();
			}
		}
	}

	if($('.channelListContainer').length)
	{
		app.subscribe(moduleName, observerCallback);
	}

	var drawChannels = function()
	{	
		var am = {startChannel: firstChannelToDraw, dataLength: appModel.length, channels: []};
		var selectedChannel;
		for (var i in appModel)
		{
			if(internalModel.appModel[i].available == "yes" || internalModel.appModel[i].available == "live")
			{
				am.channels.push({
					channelId: appModel[i].channelId,
					channelName: appModel[i].channelName,
					thumbNail: appModel[i].thumbNail
				})
			}

			if(internalModel.appModel[i].selected == true)
			{
				selectedChannel = internalModel.appModel[i];
			}
		}
		var channelHTML = new EJS({url: "templates/channelListTemplate.ejs"}).render(am);
		$(".channelListContainer").html(channelHTML);
		$('#bigDiv').css({'width': 214*appModel.length});

		if(selectedChannel != undefined)
		{
			$('#' + selectedChannel.channelId).css({'border': '2px solid blue'});
		}

	}

	var selectChannel = function(model, channelId)
	{
		var iModel = app.getInternalModel().appModel;
		
		for(var i in iModel)
		{
			if(channelId == iModel[i].channelId)
			{
				iModel[i].selected = true;
			}

			else
			{
				iModel[i].selected = false;
			}
		}

		app.update(moduleName,{"statusUpdate":{"type": "channelSelect", "selectedChannel": channelId}});

	}


	var autoFeedSelector = function(channel)
	{
		//check if any of the feed for the channel are autoplay
		for(var i in channel.feeds)
		{
			switch(channel.feeds[i].autoplay.tv)
			{
				case "start":
					app.update(moduleName,{"statusUpdate":{
						"type":"feedSelect",
						"device":"tv",
						"feedId": channel.feeds[i].feedId,
						"progress": 0,
						"location": "start"}});	
					return;		

				case "live":
						app.update(moduleName,{"statusUpdate":{
						"type":"feedSelect",
						"device":"tv",
						"feedId": channel.feeds[i].feedId,
						"progress": achannel.feeds[i].liveTime,
						"location": "live"}});	
					return;

				case "resume":
						app.update(moduleName,{"statusUpdate":{
						"type":"feedSelect",
						"device":"tv",
						"feedId": channel.feeds[i].feedId,
						"progress": app.getResumePosition(channel.feeds[i].feedId),
						"location": "resume"}});	
					return;
			}

			switch(channel.feeds[i].autoplay.app)
			{
				case "start":
					app.update(moduleName,{"statusUpdate":{
						"type":"feedSelect",
						"device":"app",
						"feedId": channel.feeds[i].feedId,
						"progress": 0,
						"location": "start"}});	
					return;

				case "live":
					app.update(moduleName,{"statusUpdate":{
						"type":"feedSelect",
						"device":"app",
						"feedId": channel.feeds[i].feedId,
						"progress": channel.feeds[i].liveTime,
						"location": "live"}});
					return;

				case "resume":
					app.update(moduleName,{"statusUpdate":{
						"type":"feedSelect",
						"device":"app",
						"feedId": channel.feeds[i].feedId,
						"progress": app.getResumePosition(channel.feeds[i].feedId),
						"location": "resume"}});
					return;
			}

		}
	}

	var feedSelector = function(channel)
	{
	
			//launch the modal and put in the channels as a list
			var channelModalHTML = new EJS({url: "templates/feedListModalTemplate.ejs"}).render(channel);
			$('#feedListModalContent').html(channelModalHTML);
			$('#feedListModal').modal();

			//setup the listeners for the feeds TV Selection and start / live / resume buttons
			$('#feedListModalContent').on('click', '.feedListItem', feedListClickHandler) 
			$('#feedListModalContent').on('click', '#startButton, #liveButton, #resumeButton, #okButton', feedButtonClickHandler);

	}

	var feedListClickHandler = function(event)
	{
		//highlight the channel and display the TV control and the required  buttons
		targetLi = event.currentTarget.id;

		//unhighlight all lis
		$('.feedListItem').css({"border": "none"});

		//highlight the one selected
		$('#'+ targetLi).css({"border": "2px solid blue"});

		highlightedFeed = app.getFeedFromInternalModel("appModel", targetLi);

		//change the contents of selectedFeedOptionsDiv
		var selectedFeedHTML = new EJS({url: 'templates/selectedFeedOptionsTemplate.ejs'})
									.render(app.getFeedFromInternalModel("appModel", targetLi));
		$('#selectedFeedOptionsDiv').html(selectedFeedHTML);


	}

	var feedButtonClickHandler = function(event)
	{
		var progress = 0,
		location = "start",
		device = "app";
		buttonHit = event.currentTarget.id;

		if(buttonHit == "resumeButton" || buttonHit == "okButton")
		{
			progress = app.getResumePosition(highlightedFeed);
			location = "resume";
		}

		if(buttonHit == "liveButton")
		{
			progress = highlightedFeed.liveTime;
			location = "live";
		}

		if($("#tvCheckBox").prop("checked"))
		{
			device = "tv";
		}
		//hide the modal and send to the update function


		app.update(moduleName,{"statusUpdate":{
						"type":"feedSelect",
						"device":device,
						"feedId": highlightedFeed.feedId,
						"progress": progress,
						"location": location}});

		$('#feedListModal').modal('hide');


	}



	var channelDivClickHandler = function(event)
	{
		var targetDiv = event.currentTarget.id;
		//set as the app selected channel
		selectChannel('appModel', targetDiv);
		//launch the modal with a list of feeds tv options
		feedSelector(app.getChannelFromApplicationModel(targetDiv));

	}
	$(".channelListContainer").on('click', '.channelDiv', channelDivClickHandler)


}());