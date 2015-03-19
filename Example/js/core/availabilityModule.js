/*available loop module 
loops checking the current time and seeing if the channl or feed available needs to be updated

*/

var availability = (function()
{
	var time;
	var updated;
	var internalModel;

	var loop = function(callback)
	{
		internalModel = app.getInternalModel();
	
	setInterval(function(){
			updated = false;
			for(var i in internalModel.tvModel)
			{
				time = syncTime.getSyncTime();
				checkChannel(internalModel.tvModel[i]);
				if(internalModel.hasOwnProperty("appModel"))
				{
					checkChannel(internalModel.appModel[i]);
				}

			}

			if(updated)
			{
				app.update("avail",{"statusUpdate": {"type": "availabilityUpdate"}});
			}
		},1000);
		//never getting here
		callback;
	}

	var checkChannel = function(channel)
	{
		if(channel.available!= "live" && channel.startTime <= time && channel.endTime > time)
		{
			channel.available = "live"
			console.log("updated " + channel.channelId + " to live");
			updated = true;
	
		}

		if(channel.available != "yes" && channel.endTime < time)
		{
			console.log("updated " + channel.channelId + " to yes");

			channel.available = "yes"
			updated = true;
		}

		if(channel.available == "live")
		{
			for (var i in channel.feeds)
			{
				checkFeed(channel.feeds[i]);
			}
		}

	}

	var checkFeed = function(feed)
	{
		if(feed.available!= "live" && feed.startTime <= time && feed.endTime > time)
		{
			console.log("updated " + feed.feedId + " to live");
			feed.available = "live";
			updated = true;
		}

		if(feed.available != "yes" && feed.endTime < time)
		{
			console.log("updated " + feed.feedId + " to yes");

			feed.available = "yes"
			updated = true;
		}

		if(feed.available == "live")
		{
			feed.liveTime = (syncTime.getSyncTime() - feed.startTime) /1000;

		}
	}

	return{
		loop:loop
	};
} ())