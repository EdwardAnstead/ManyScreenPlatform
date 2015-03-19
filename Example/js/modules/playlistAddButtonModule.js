var playlistAddButton = (function()
{
	var moduleName = "playlistButtonModule";

	var observerCallback = function(message)
	{
		//if(message.hasOwnProperty("playheadUpdate") && message.playheadUpdate.pageLoad != undefined)
		if(message == "ready")
		{
			$("#appWindow").unbind().on("click", ".playlistAddButton", playlistAddButtonClickHandler);

		}
	}

	app.subscribe(moduleName, observerCallback);

	var playlistAddButtonClickHandler = function(event)
	{
		var IdStrings = []
		idStrings = event.currentTarget.id.split("_");
		playlist.addToPlaylist(idStrings[1], idStrings[2], idStrings[3]);
	}
	
}());