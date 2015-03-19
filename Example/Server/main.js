/*Server main module 

1.Loads in the JSON object for the Application data
2.connects to the message bus.
3.Listens for messages on the bus.
4.routes messages to the right module Either (or and) to the logging module, connectionModule
or the playbackState module

5. Allows other modules to raise messages

*/


var stomp = require("stompjs");
//var playbackSate = require("./playbackState.js");
var connection = require("./connection.js");
var tvPlaybackState = require("./tvPlaybackState.js")
var playlistServer = require("./playlistServer.js")
var logger = require("./logging.js")

var fs = require("fs");
//var tvPlaybackState = require(".tvPlaybackState.js");


var client;
var appData = 0;
var internalModel = [];
var serverStartTime = new Date().getTime();

exports.setupAppData = function(filename, logName)
{	
	console.log(filename);
	//setup the logger
	logger.setupLogging(logName);
	fs.readFile(filename, "utf8", function (err, data) {
		if(err){
		return console.log(err);
		}
		appData = JSON.parse(data);
		//set the timings for the start and endtimes to be relative to the current clock time
		for(var i in appData)
		{
			appData[i].startTime = appData[i].startTime * 1000 + serverStartTime;
			appData[i].endTime = appData[i].endTime * 1000 + serverStartTime;

			for (var i1 in appData[i].feeds)
			{
				appData[i].feeds[i1].startTime = appData[i].feeds[i1].startTime *1000 + serverStartTime;
				appData[i].feeds[i1].endTime = appData[i].feeds[i1].endTime *1000 + serverStartTime;
			} 
		}

		for(i in appData)
		{
			var channelModel = {
			channelId : appData[i].channelId,
			startTime: appData[i].startTime,
			endTime: appData[i].endTime,
			feeds : [],
			available: "no",
			selected: false};

			for(i1 in appData[i].feeds)
			{
				var feedModel = {
				feedId : appData[i].feeds[i1].feedId,
				type: appData[i].feeds[i1].type,
				startTime: appData[i].feeds[i1].startTime,
				endTime: appData[i].feeds[i1].endTime,
				progress : 0,
				liveTime: 0,
				state: "none", //could be playing, paused or none
				eventsViewed : [],
				available: "no",
				selected: false,
				};
				
				channelModel.feeds.push(feedModel);
			}

			internalModel.push(channelModel);
		}

		connectToBus()
	});

	
}


exports.getAppData = function()
{
	return appData;
}

exports.getLinkedFeedsFromAppData = function(feedId)
{
	var linkedFeeds = [];

	for (var i in appData)
	{
		for (var j in appData)
		{
			if(appData[i].feeds[j].linkedToVideo == feedId)
			{
				linkedFeeds.push(appData[i].feeds[j].FeedId);
			}
		} 
	}
}



exports.getInternalModel = function()
{
	return internalModel;
}

function connectToBus()
{

	client = stomp.overWS('ws://localhost:61623/');
	//client = stomp.overTCP('localhost', 61613);
	
	var errorCallback = function (error){
		console.log("Unable to connect to the message bus ");
	}
	
	var connectCallback = function(){
		console.log("Connected to the messageBus");
		
		//ISSUES WITH THE BUS - UNCOMMENT THIS
		//client.debug = console.log;
		
		messageConsumer();

	}
	client.connect("admin", "password", connectCallback, errorCallback);
	
}


function messageConsumer()
{

	// when a message comes in from the bus send it to the right module to process

	var subCallback = function(message)
	{
		//console.log("got the message " + message.body);
		jMessage = JSON.parse(message.body);

		logger.logMessage(jMessage);

		if (jMessage.type == "connection")
		{
				connection.newMessage(jMessage);

				return;
		}	
	
		else if(jMessage.hasOwnProperty("tvPlayheadUpdate"))
		{
			//update the internal model for TV 
			tvPlaybackState.parseTvPlayheadMessage(jMessage.tvPlayheadUpdate);

		}

		else if (jMessage.hasOwnProperty('playheadUpdate'))
		{
			//update the internal model for the device

		}

		else if (jMessage.hasOwnProperty('app'))
		{
			//HACK route to the playlist server module
			playlistServer.parsePlaylistMessage(jMessage.app);
		}

		else if(jMessage.hasOwnProperty('statusUpdate'))
		{
			//test if it's for the TV or the device.  if for TV
			//then update, send to TV and log otherwise just update and log

			if(jMessage.statusUpdate.device == "tv")
			{
				//update the TV model and send a message to the clients to update it's tv internal model
				//tvPlaybackState.update(jMessage);
				tvPlaybackState.parseTvStatusMessage(jMessage.statusUpdate);

			}
		}
	};
	
	client.subscribe("/topic/multiscreen", subCallback);

}

exports.publishMessage = function(message)
{
	client.send("/topic/multiscreen", {}, JSON.stringify(message));
}