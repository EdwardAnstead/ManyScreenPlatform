var tabletTagOverlay = (function()
{
	var moduleName = "tabletTagOverlayModule"
	var selectedFeedApp;
	var selectedFeedInternal;
	var observerCallback = function(message)
	{
		//on video playback is the feed taggable
		if(message.hasOwnProperty('statusUpdate') && message.statusUpdate.type == "feedSelect" && message.statusUpdate.device=="app")
		{
			if(selectedFeedApp == undefined || message.statusUpdate.feedId != selectedFeedApp.feedId)
			{
				selectedFeedApp = app.getFeedFromApplicationModel(message.statusUpdate.feedId);
				selectedFeedInternal = app.getFeedFromInternalModel('appModel', message.statusUpdate.feedId)

				if(selectedFeedApp.type == "video" 
					&& selectedFeedApp.hasOwnProperty('custom') 
					&& selectedFeedApp.custom.showTaggingButton)
				{
					showTaggingButton();

				}


			}
		}
	}

	var showTaggingButton = function()
	{
		var taggingViewHTML = new EJS({url: "templates/tabletTagOverlayTemplate.ejs"}).render(selectedFeedApp.custom);
		videoViewHTML = $('#taggingButtonOverlay').html();
		$('#taggingButtonOverlay').html(taggingViewHTML + videoViewHTML);

		$('.runnerTabletTagButton').unbind().on('click', function(event){
					var idStrings = event.target.id.split('_');
					marathonHelpers.createNewTag(selectedFeedInternal.feedId, selectedFeedInternal.progress, idStrings[0]);
					alert("new tag created for runner" + idStrings[0]);
				});
	}

	app.subscribe(moduleName, observerCallback);


}())