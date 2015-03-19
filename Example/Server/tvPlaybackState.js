var main = require("./main.js");
var connection = require('./connection.js');

var tvPlayheadInterval;
var selectedFeed;
var linkedFeeds = [];

exports.parseTvPlayheadMessage = function(message)
{
	//update the state of the intrenal TV model based on the message
	//play / pause
	if(selectedFeed && message.state != selectedFeed.state)
	{
		selectedFeed.state = message.state;
		clearInterval(tvPlayheadInterval);
		selectedFeed.progress = message.progress
		if(selectedFeed.state == "playing")
		{
			updatePlayhead();
		}
	}
	//seek
	if(message.seeked)
	{
		clearInterval(tvPlayheadInterval);
		selectedFeed.progress += message.seeked;
		if(selectedFeed.state == "playing")
		{
			updatePlayhead();
		}
	}

	//TODO event update


}

exports.parseTvStatusMessage = function(message)
{
	//take the status message and update the selected TV feed if needed
	if(message.type == "feedSelect")
	{
		//tvDevices = connection.getDeviceByType("tv")
		selectFeed(message.feedId);
		
	}

}

function selectFeed(feedId)
{
	var iModelForTv = connection.getDeviceByType('tv')[0].internalModel;
	for(var i in iModelForTv)
	{
		for(var i1 in iModelForTv[i].feeds)
		{
			if(iModelForTv[i].feeds[i1].selected)
			{
				iModelForTv[i].feeds[i1].selected = false;
			}

			if(iModelForTv[i].feeds[i1].feedId == feedId)
			{
				iModelForTv[i].feeds[i1].selected = true;
				selectedFeed = iModelForTv[i].feeds[i1];
			}
		}
	}

	var applicationLinked = main.getLinkedFeedsFromAppData;
	linkedFeeds = [];
	for (var i in applicationLinked)
	{
		for(var j in iModelForTv)
		{
			for(var k in iModelForTv[j].feeds)
			{
				if(iModelForTv[j].feeds[k].feedId == applicationLinked[i].feedId)
				{
					linkedFeeds.push(iModelForTv[j].feeds[k])
				}
			}
		}
	}


}

exports.stopTvPlaying = function()
{
	if(selectedFeed)
	{
		clearInterval(tvPlayheadInterval);
		//send a tvPlayheadUpdate out to the other devices
		main.publishMessage({tvPlayheadUpdate:{
					headOnly: false,
					feedId: selectedFeed.feedId,
					progress: selectedFeed.progress,
					state: "none",
					seeked: false,
					localTimestamp: new Date().getTime(),
					eventsViewed: {},
					pageLoad: undefined
				}});
	}
}

function updatePlayhead()
{
	//loop through and update the expected location of the playhead
	tvPlayheadInterval = setInterval(function(){
		selectedFeed.progress += 0.1;
		for(var i in linkedFeeds)
		{
			linkedFeeds[i].progress +=0.1;
		}
		//console.log("progress " + selectedFeed.progress);
	},100)
}
