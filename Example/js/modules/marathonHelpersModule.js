var marathonHelpers = (function()
{
	//TODO sort this for the proper videos this is a hack for Testing
	var idCounter = 19;
	var moduleName = "marathonHelpers";
	
	var showVideoPlaybackModal = function(feed, start, end, loadTagInterface, showPlaylistButton){
		var showPlaylist = showPlaylistButton | true
		var obj = {"showPlaylistButton": showPlaylist}
		var playEventHTML = new EJS({url: "templates/playEventModalTemplate.ejs"}).render(obj);
		$('#feedListModalContent').html(playEventHTML);

		$('#feedListModal').modal();

		//stick a listener onto the tablet and television buttons.
		$('#eventPlaybackButtonTelevision').click(function(event){deviceClickHandle("tv")});
		$('#eventPlaybackButtonTablet').click(function(event){deviceClickHandle("app")});
		$('#eventPlaybackButtonAddToPlaylist').click(function(event){deviceClickHandle("playlist")})
	

		var deviceClickHandle = function(device)
		{

			$('#feedListModal').modal('hide');
			if(device == "tv" || device =="app")
			{
				app.update(moduleName,{"statusUpdate":{
					"type":"feedSelect",
					"device":device,
					"feedId": feed,
					"progress": parseFloat(start),
					"endTime": parseFloat(end),
					"location": "none"}});

				if(device == "tv" && loadTagInterface)
				{
					//select the tagging feed
					app.update(moduleName, {"statusUpdate":{
					"type":"feedSelect",
					"device": "app",
					"feedId": 'taggingTIC',
					"progress": 0,
					"endTime": 0,
					"location": "none"}}) 
				}	
				return;
			}

			else if(device == "playlist")
			{
				playlist.addToPlaylist(feed, start, end);
			}
		}
	}

	var showVideoPlaybackOptionModal = function(tagsAndVideos)
	{
		var renderObject = {"data": tagsAndVideos}
		var playEventHTML = new EJS({url: "templates/playVideoOptionsModalTemplate.ejs"}).render(renderObject);
		$('#feedListModalContent').html(playEventHTML);
		$('#feedListModal').modal();

		$('#eventPlaybackButtonTelevision').click(function(event){deviceOptionClickHandle("tv")});
		$('#eventPlaybackButtonTablet').click(function(event){deviceOptionClickHandle("app")});
		$('#eventPlaybackButtonAddToPlaylist').click(function(event){deviceOptionClickHandle("playlist")})


		var deviceOptionClickHandle = function(device)
		{
			var checkedId = $("#feedListModal input:checked").attr("id");
			$('#feedListModal').modal('hide');

			var idStrings = checkedId.split('_');
			if(device == "tv" || device == "app")
			{
				app.update(moduleName,{"statusUpdate":{
					"type":"feedSelect",
					"device":device,
					"feedId": idStrings[0],
					"progress": parseFloat(idStrings[1]),
					"endTime": parseFloat(idStrings[2]),
					"location": "none"}});

				if(device == "tv" && idStrings[3] == "true")
				{
					//select the tagging feed
					app.update(moduleName, {"statusUpdate":{
					"type":"feedSelect",
					"device": "app",
					"feedId": 'taggingTIC',
					"progress": 0,
					"endTime": 0,
					"location": "none"}}) 
				}
				return;
			}	


			else if(device == "playlist")
			{
				playlist.addToPlaylist(idStrings[0], parseFloat(idStrings[1]), parseFloat(idStrings[2]));
			}

			//alert("the checked id is " + checkedId);
			//which one of the videos is selected?

		}
	}

	var getRunnerVideos = function(runner, startTime, endTime, videoTolerance)
	{
		//search through the tags and find ones of the runner 
		var runnerTags = {"existingTags":[], "possibleVideos":[]};
		for(var i in marathonData.tags)
		{
			if(marathonData.tags[i].raceNo == runner.raceNo)
			{
				marathonData.tags[i].videoPlaybackId = setDomObjectId(marathonData.tags[i]);
				applicationFeed = getFeedFromDataMapping(marathonData.tags[i].videoID);
				marathonData.tags[i].thumbnail = applicationFeed.thumbNail;
				runnerTags.existingTags.push(marathonData.tags[i])
				//add on the DomObjectId so we can jump to the playhead on a click
								
			}
	}

		//now the hard bit. Iterate through the videos and work out if the runner
		//might be in it.  Take the location of the video and work out the time the runner
		//should be at that location.  Do this by taking the closest location we have for the runner
		//either side of the video location. (tags and start and end times), calculate the runners speed
		//then time to travel to the location from the last one using this speed.
		var checkVideoInExisting = function(videoId){
			for(var j in runnerTags.existingTags)
			{
				if(runnerTags.existingTags[j].videoID == videoId)
				{
					return true;
				}
			}
			return false;
		}

		for (var i in marathonData.videos)
		{
			
			if(!checkVideoInExisting(marathonData.videos[i].id))
			{
				bestPreviousTime = startTime;
				bestNextTime = endTime;

				bestPreviousLocation = 0;
				bestNextLocation = 21097;

				for(var j in runnerTags.existingTags)
				{
					if(runnerTags.existingTags[j].distance > bestPreviousLocation && runnerTags.existingTags[j].distance < marathonData.videos[i].distance)
					{
						bestPreviousTime = runnerTags.existingTags[j].time;
						bestPreviousLocation = runnerTags.existingTags[j].distance;
					}

					else if (runnerTags.existingTags[j].distance < bestNextLocation && runnerTags.existingTags[j].distance > marathonData.videos[i].distance)
					{
						bestNextTime = runnerTags.existingTags[j].time;
						bestNextLocation = runnerTags.existingTags[j].distance;
					}
				}

				//calculate speed between bestPrevious and bestNext.
				var distance = bestNextLocation - bestPreviousLocation;
				var time = bestNextTime - bestPreviousTime;
				var speed = distance/time;

				//time at video location 
				var distanceToVideo = marathonData.videos[i].distance - bestPreviousLocation;
				var timeAtVideo = distanceToVideo/speed + bestPreviousTime;

				if(marathonData.videos[i].start - videoTolerance < timeAtVideo && marathonData.videos[i].end + videoTolerance > timeAtVideo)
				{
					marathonData.videos[i].videoPlaybackId = setDomObjectId(marathonData.videos[i], timeAtVideo);
					applicationFeed = getFeedFromDataMapping(marathonData.videos[i].id);
					marathonData.videos[i].thumbnail = applicationFeed.thumbNail;
					runnerTags.possibleVideos.push(marathonData.videos[i])
					runnerTags.possibleVideos[runnerTags.possibleVideos.length - 1].possibleTime = Math.round(timeAtVideo);
				}

			}
		}

		return runnerTags;
	}

	var setDomObjectId = function(tagOrVideo, t)
	{
		//idCounter++
		//return "EventButtonPlayback_raceOverviewVideo_" + idCounter + "_0"
		var time = t || 0;
		var fmapping;
		var startTime;

		if(tagOrVideo.hasOwnProperty('raceNo'))
		{
			var videoObj = getVideoDataFromVideoId(tagOrVideo.videoID);
			fMapping = getFeedMappingWithVideoId(tagOrVideo.videoID)
			var marathonVideoTagTime = tagOrVideo.time - videoObj.start;
			startTime = (fMapping.startTime + marathonVideoTagTime) - 20;
		}

		else
		{
			fMapping = getFeedMappingWithVideoId(tagOrVideo.id)
			var marathonVideoTagTime = time - tagOrVideo.start 
			startTime = (fMapping.startTime + marathonVideoTagTime) - 20;
		}

		return fMapping.feedId + "_" + startTime + "_" + (startTime + 50); 

	}

	var getRunnerByNumber = function(runnerNumber)
	{
		for(var i in marathonData.runners)
		{
			if(runnerNumber == marathonData.runners[i].raceNo)
			{
				return marathonData.runners[i];
			}
		}
	}

	//what feed is the video id in
	var getFeedFromDataMapping = function(videoId)
	{
		for (var i in feedMapping)
		{
			if(feedMapping[i].videoId == videoId)
			{
				return app.getFeedFromApplicationModel(feedMapping[i].feedId)
			}
		}
	}

	//what is the feed mapping of the feedid
	var getFeedMappingWithFeedId = function(feedId, time)
	{
		for (var i in feedMapping)
		{
			if(feedMapping[i].feedId == feedId && time >= feedMapping[i].startTime 
				&& time < feedMapping[i].endTime )
			{
				return feedMapping[i]
			}
		}
	}

	var getFeedMappingWithVideoId = function(videoId)
	{
		for(var i in feedMapping)
		{
			if(feedMapping[i].videoId == videoId)
			{
				return feedMapping[i];
			}
		}
	}

	//get the feed mapping object for the video id
	var getVideoDataFromVideoId = function(videoId)
	{
		for(var j in marathonData.videos)
		{
			if(marathonData.videos[j].id == videoId)
			{
				return marathonData.videos[j];
			}
		}
	}
	var createNewTag = function(feedId, time, raceNumber)
	{
		//get the video object for the new tag in the marathonData
		//work out the time of the tag as if it were a race time!
		//send out a message to update the marathonData object
		fMapping = getFeedMappingWithFeedId(feedId, time);
		videoFromMarathonData = getVideoDataFromVideoId(fMapping.videoId);
		var tagTime = (time - fMapping.startTime) + videoFromMarathonData.start;
		var newTag = {
			    "distance": videoFromMarathonData.distance,
     			"id": String(new Date().getTime()) + String(Math.floor(Math.random)*100),
     			"latitude": videoFromMarathonData.latitude,
    			"longitude": videoFromMarathonData.longitude,
  			    "raceNo": raceNumber,
 			    "spectatorID": videoFromMarathonData.spectatorID,
			    "time": tagTime,
  				"videoID": videoFromMarathonData.id
		};
		//marathonData.tags.push(newTag);
		app.update(moduleName, {"app":
			{
				"type": "newTag",
				"tag": newTag
			}})

	}

	return{
		showVideoPlaybackModal: showVideoPlaybackModal,
		getRunnerVideos: getRunnerVideos,
		showVideoPlaybackOptionModal: showVideoPlaybackOptionModal,
		createNewTag: createNewTag,
		getFeedFromDataMapping: getFeedFromDataMapping,
		getFeedMappingWithFeedId: getFeedMappingWithFeedId
	}
}())