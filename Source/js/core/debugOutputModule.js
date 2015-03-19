var debugOutputModule = (function(){
		
	var internalModel;	
	var observerCallback = function(message)
	{
		if(message == "ready")
		{
			internalModel = app.getInternalModel();
			redraw();
		}
		else
		{
			redraw();
		}
	}

	app.subscribe("debugOutput", observerCallback);

	var redraw = function()
	{
		//list out the channels in the internal Model with the feed under
		var channelHTML = new EJS({url: "templates/debugTemplate.ejs"}).render(internalModel);
		$(".debugOutputContainer").html(channelHTML);
	}

	$(document).keypress(function(e){
		if(e.which == 21 && e.ctrlKey)
		{
			redraw();
		}
	})


}());