var playlist = (function()
{
	moduleName = "playlistModule";
	var playlist = [];
	var waitingForFetch = false;
	var showingPlaylist = false;
	var playingPlaylist = "no";
	var nextPlaylistEntry = 0;

	var observerCallback = function(message)
	{
		if(message.hasOwnProperty('app'))
		{
			if(message.app.type == "update")
			{
				playlist = message.app.playlist;
				if(showingPlaylist)
				{
					drawPlaylist();
				}
			}

			if(message.app.type == 'latest' && waitingForFetch)
			{
				waitingForFetch = false;
				if(message.app.playlist != {}){
					playlist = message.app.playlist;
				}
			} 
		}

		if(message.hasOwnProperty("playheadUpdate") && message.playheadUpdate.pageLoad != undefined)
		{
			if($('#playlistPage').length)
			{
				showingPlaylist = true;
				drawPlaylist();
			}

		}
		if(message.hasOwnProperty("statusUpdate") && message.statusUpdate.device == "app")
		{
			showingPlaylist = false;
		}

		if(message == 'ready')
		{
			waitingForFetch = true;
			app.update(moduleName, {
				"app": {"type": "fetch"}
			})
		}

		if(message.hasOwnProperty("playheadUpdate") && playingPlaylist == "app" && 
			message.playheadUpdate.state == "ended")
		{
			playPlaylistEntry("app");
		}

		if(message.hasOwnProperty("tvPlayheadUpdate") && playingPlaylist == "tv" &&
			message.tvPlayheadUpdate.state == "ended")
		{
			playPlaylistEntry("tv");
		}

	}	

	app.subscribe(moduleName, observerCallback)


	var drawPlaylist = function()
	{
		var renderObj = {"playlist": playlist}
		var playlistHTML = new EJS({url: "templates/playlistTemplate.ejs"}).render(renderObj);
		$('#playlistPage').html(playlistHTML);

		//setup a the listeners for the buttons
		$('.removePlaylistButton').click(removePlaylistButtonClickHandler);
		$('.moveUpPlaylistButton').click(moveUpPlaylistButtonClickHandler);
		$('.moveDownPlaylistButton').click(moveDownPlaylistButtonClickHandler);
		$('.playPlaylistButton').click(playPlaylistButtonClickHandler);
		$('.playlistStopButton').click(function(event){stopPlaylistPlaying()});
	}

	var removePlaylistButtonClickHandler = function(event)
	{
		//get the feedId from the parent object
		feedClicked = event.currentTarget.parentElement.id;
		idStrings = feedClicked.split('_');
		removeFromPlaylist(idStrings[0]);
	}

	var moveUpPlaylistButtonClickHandler = function(event)
	{
		feedClicked = event.currentTarget.parentElement.id;
		idStrings = feedClicked.split('_');
		moveInPlaylist(idStrings[0], 'up');
	
	}

	var moveDownPlaylistButtonClickHandler = function(event)
	{
		feedClicked = event.currentTarget.parentElement.id;
		idStrings = feedClicked.split('_');
		moveInPlaylist(idStrings[0], 'down');
	

	}

	var playPlaylistButtonClickHandler = function(event)
	{
		//pull up the play on TV / tablet modal
		var obj = {"showPlaylistButton": false}
		var playEventHTML = new EJS({url: "templates/playEventModalTemplate.ejs"}).render(obj);
		$('#feedListModalContent').html(playEventHTML);
		$('#feedListModal').modal();
		//hook up a couple of listeners to each of the buttons
		$('#eventPlaybackButtonTelevision').click(function(event){deviceClickHandle("tv")});
		$('#eventPlaybackButtonTablet').click(function(event){deviceClickHandle("app")});
		drawPlaylist();
	}

	var playPlaylistEntry = function(device)
	{
		console.log("next playlist entry is " + nextPlaylistEntry + " and the length is " + playlist.length)
		if(nextPlaylistEntry < playlist.length)
		{
			app.update(moduleName,{"statusUpdate":{
					"type":"feedSelect",
					"device":device,
					"feedId": playlist[nextPlaylistEntry].feedId,
					"progress": parseInt(playlist[nextPlaylistEntry].startTime),
					"endTime": parseInt(playlist[nextPlaylistEntry].endTime),
					"location": "none"}});
			nextPlaylistEntry++;

		}

		else
		{
			stopPlaylistPlaying();
		}


	}

	var stopPlaylistPlaying = function()
	{
		if(playingPlaylist == "tv")
		{
			app.update(moduleName, {tvPlayheadUpdate:{
					headOnly: false,
					feedId: playlist[nextPlaylistEntry-1].feedId,
					progress: 0,
					state: "paused",
					seeked: false,
					localTimestamp: new Date().getTime(),
					eventsViewed: [],
					pageLoad: undefined
				}});
		}

		playingPlaylist = "no";
		nextPlaylistEntry =  0;
	}

	var deviceClickHandle = function(device)
	{
		$('#feedListModal').modal('hide');

		if(device == "tv")
		{
			//set the playingPlaylist flag to TV 
			playingPlaylist = "tv";
			playPlaylistEntry(playingPlaylist);
		}

		if(device == "app")
		{
			//set the playingPlaylist flag to app
			playingPlaylist = "app";
			playPlaylistEntry(playingPlaylist);

		}
	}
	var addToPlaylist = function(feedId, startTime, endTime)
	{
		//gen a playlistId for the item
		playlistId = String(new Date().getTime()) + String(Math.floor(Math.random())*101) 
		applicationFeed = app.getFeedFromApplicationModel(feedId);
		playlist.push({"feedId": feedId, 
						"startTime": parseInt(startTime), 
						"endTime": parseInt(endTime), 
						"playlistId": playlistId,
						"thumbnail": applicationFeed.thumbNail, 
						"feedName": applicationFeed.feedName
					});
		updateCentralPlaylist();
		drawPlaylist(); 

	}

	var removeFromPlaylist = function(playlistId)
	{
		for(var i in playlist)
		{
			if(playlistId == playlist[i].playlistId)
			{
				playlist.splice(i,1);
				updateCentralPlaylist();
			}
		}
		drawPlaylist(); 
	}

	var moveInPlaylist = function(playlistId, direction)
	{
		for(var i in playlist)
		{
			if(playlistId == playlist[i].playlistId)
			{
				var tempEntry = playlist[i];
				if(direction == "up" && i != 0)
				{
					playlist.splice(i,1)
					playlist.splice(i-1, 0, tempEntry )
					break;
				}

				if(direction == "down" && i < playlist.length )
				{
					playlist.splice(i,1)
					playlist.splice(parseInt(i)+1, 0, tempEntry);
					break;
				}	
			}
		}

		updateCentralPlaylist();
		drawPlaylist(); 

	}

	var updateCentralPlaylist = function()
	{
		app.update(moduleName, {
			"app": {"type": "update", "playlist": playlist}
		})
	}

	return{
		addToPlaylist: addToPlaylist
	}
}())
