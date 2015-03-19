var main = require("./main.js")

var playlist = [];
var newTags = [];

exports.parsePlaylistMessage = function(message)
{
	if(message.type == "fetch")
	{
		console.log("got a request for the playlist");
		main.publishMessage({"app":{"type": "latest", "playlist": playlist}})
	}

	else if(message.type == "update")
	{
		//update the local copy of the playlist
		console.log("got an update to the playlist:" + message.playlist)
		//playlist = JSON.parse(message.playlist);
		playlist = message.playlist;
		console.log("got an update to the playlist:" + message.playlist)

	}

	else if(message.type == "newTag")
	{
		newTags.push(message.tag);
	}

	else if(message.type == "fetchTags")
	{
		main.publishMessage({"app": {"type": "latestTags", 'tagList': newTags}});
	}
}

