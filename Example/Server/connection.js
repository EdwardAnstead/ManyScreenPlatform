/*
Holds an array of the currently connected devices

1. Allows for the devices to be added type of tv, remote or, app
2. devices to be deleted

*/

var main = require("./main.js");
var tvPlaybackState = require("./tvPlaybackState.js")

var devices = [];

exports.newMessage = function(message){

	//two message types either a newConnection or a disconnection
	//new connection: add to devices and respond with a timestamp and the appData
	//disconnection remove from the devices list.
	
	switch (message.connectionType)
	{
		case "newConnection":
			devices.push({"deviceId": message.deviceId, 
				"deviceType": message.deviceType, 
				"internalModel": main.getInternalModel()});
			main.publishMessage({
					"type": "connectionAccept", 
					"deviceId": message.deviceId, 
					"data": {"app": main.getAppData(), "tvStartState": getTvState()},
					"timestamp": new Date().getTime()});
			break;
		case "disconnect":
			//remove the device from the devices list 
					if(message.deviceType == "tv")
					{
						stopTvPlayingState();
						tvPlaybackState.stopTvPlaying();
					}
			for(i in devices)
			{
				if(devices[i].deviceId == message.deviceId)
				{
					devices.splice(i,1);
				}
			}
			break;
		default:
			console.log("connectionType incorrect")
	}

}

exports.getDeviceById = function(id)
{
	for (i in devices)
	{
		if(devices[i].DeviceId == id)
		{
			return devices[i];
		}
	}
}

function stopTvPlayingState()
{
	currentTvState = getTvState()
	for(var i in currentTvState){
		for (var i1 in currentTvState[i].feeds){
			currentTvState[i].feeds[i1].state = "none";
		}
	}
}

function getTvState()
{
	var d = exports.getDeviceByType("tv");

	if(d.length)
	{
		return d[0].internalModel;
	}

	else
	{ 
		return main.getInternalModel();
	} 
}

exports.getDeviceByType = function(type)
{
	var devicesList = []
	for(i in devices)
	{
		if(devices[i].deviceType == type)
		{
			devicesList.push(devices[i]);
		}
	}

	return devicesList;
}

exports.getDevices = function()
{
	return devices;
}
