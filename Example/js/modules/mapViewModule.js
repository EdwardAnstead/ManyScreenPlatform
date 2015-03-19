//map view module

var mapView = (function()
{

	moduleName = 'mapViewModule';
	relativeMapCoordinates = [];
	var stage;
	var mapLayer;
	var spotL;
	var scaleFactor;
	var runner;
	var applicationFeed;

	var marathonStartGun = 1380443400;
	var startTime;
	var endTime;
	var videoTolerance = 60;
	var waitForFetch = false;

	var observerCallback = function(message)
	{
		//if we get a playhead update which includes a page load then see if it 
		//has a mapViewContainer in the page.

		if(message == "ready")
		{
			waitingForFetch = true;
			app.update(moduleName, {
				"app": {"type": "fetchTags"}
			})
		}

		if(message.hasOwnProperty("app") && message.app.type == "latestTags" && waitingForFetch)
		{
			waitingForFetch = false;
			if(message.app.tagList != {})
			{
				marathonData.tags = marathonData.tags.concat(message.app.tagList);
			}
		}

		if(message.hasOwnProperty("playheadUpdate") && message.playheadUpdate.pageLoad != undefined)
		{
			//wait until the document has a div for the page
			if($('#mapViewContainer').length)
			{
				//set the runner
				var startMap = function()
				{
						applicationFeed = app.getFeedFromApplicationModel(message.playheadUpdate.feedId);
						for(var i in marathonData.runners)
						{
							for(var j in applicationFeed.pageList)
							{
								if(applicationFeed.pageList[j].pageId == message.playheadUpdate.pageLoad && 
									marathonData.runners[i].raceNo == applicationFeed.pageList[j].custom.raceNo)
								{
									runner = marathonData.runners[i];
									mapImageSrc = applicationFeed.pageList[j].custom.mapImage;
									startTime = marathonStartGun + (runner.gunSecs - runner.chipSecs);
									endTime = startTime + runner.chipSecs;
									break;
								}
							}
						}
						stage = new Kinetic.Stage({
			    			container: 'mapViewContainer',
			    			width: $('#mapViewContainer').width(),
			    			height: $('#mapViewContainer').width()*coursePath.proportion
						});

						mapLayer = new Kinetic.Layer({width:stage.width(), height:stage.height()});
						relativeMapCoordinates = [];

						drawMap();
				}

				setTimeout(startMap, 50);

			}

			else
			{
				if(stage)
				{
					stage.destroy();
				}
			}	

		}

		if(message.hasOwnProperty("app"))
		{
			if(message.app.type == "newTag")
			{
				marathonData.tags.push(message.app.tag);
				if($('#mapViewContainer').length && runner.raceNo == message.app.tag.raceNo)
					{
						updateMapPoints(message.app.tag);
					}

			}
		}
	}

	app.subscribe(moduleName, observerCallback);

	var drawMap = function()
	{
		stage.clear();
		mapLayer.clear();
		//var imageLayer = new Kinetic.Layer({width:stage.width(), height:stage.height()});
		//take the coordinates from the coursePath and scale them to fit the page container
		drawingWidth = stage.width() - 20;
		scaleFactor = coursePath.widestPoint/drawingWidth;

		backgroundLayer = new Kinetic.Layer(); 

		var background = new Kinetic.Rect({
			x: 0,
			y: 0,
			fill: 'rgb(149,194,32)',
			width: stage.width(),
			height: stage.height()
		});
		backgroundLayer.add(background);
		stage.add(backgroundLayer);

		drawKey();
		for(var i in coursePath.path)
		{

			coursePath.path[i].id = "mapVector" + i;

			var path = new Kinetic.Line({
				points: [coursePath.path[i].x1/scaleFactor, coursePath.path[i].y1/scaleFactor, 
							coursePath.path[i].x2/scaleFactor, coursePath.path[i].y2/scaleFactor],
				stroke: 'blue',
				strokeWidth: 6,
				id: coursePath.path[i].id,
				lineCap: 'round',
				lineJoin: 'round'
			})

			mapLayer.add(path);

		}
		stage.add(mapLayer);

		runner.tags = marathonHelpers.getRunnerVideos(runner, startTime, endTime, videoTolerance);
		console.log(runner.tags);
		//position videos on the map
		positionVideos();

	}

	var drawKey = function()
	{
		var keyLayer = new Kinetic.Layer()
		var spot1 = new Kinetic.Circle
					({
						x: 20,
						y: 30,
						radius: 15,
						fill: 'white',
						stroke: 'black',
						strokeWidth: 2,
						opacity: 0.8,
					});
		keyLayer.add(spot1);
		var label1 = new Kinetic.Text({
			x: 50,
			Y:20,
			Text: "videos of " + runner.name,
			fontSize: 20,
			fontFamily: 'Helvetica',
			fill: 'black'
		})
		keyLayer.add(label1);
		
		var spot2 = new Kinetic.Circle
					({
						x: 20,
						y: 70,
						radius: 15,
						fill: 'gray',
						stroke: 'black',
						strokeWidth: 2,
						opacity: 0.8,
					});
		keyLayer.add(spot2);

		var label2 = new Kinetic.Text({
			x: 50,
			Y:60,
			Text: "Possible Sightings of " + runner.name,
			fontSize: 20,
			fontFamily: 'Helvetica',
			fill: 'black'
		})
		keyLayer.add(label2);
		stage.add(keyLayer);

	}

	var updateMapPoints = function(tag)
	{
		//iterate through the points we have now and find out which one (if any) relates
		//to the new tag. Use the feed mapping to work out if the video in the tag is the same
		//as the one attached to the spot
		var spots = spotL.find(".mapSpot");
		for(var i in spots)
		{
			var targetIdStrings = spots[i].id().split('_');
			videoOfSpot = marathonHelpers.getFeedMappingWithFeedId(targetIdStrings[1], parseInt(targetIdStrings[2])+20 );
			if(videoOfSpot.videoId == tag.videoID)
			{
				//change the spot colour to white and the size to 15
				spots[i].setRadius(15);
				spots[i].setFill("white"); 
				spotL.draw();
				return;
			}
		}
	}

	var positionVideos = function()
	{
		spotL = new Kinetic.Layer();

		var getPosition = function(tag, colour, size)
		{
			distanceSoFar = 0;
			for(var i in coursePath.path)
			{
				if(distanceSoFar + coursePath.path[i].realWorldDistance > tag.distance)
				{
					//what proportion through the line is the tag
					var distanceToGo = tag.distance - distanceSoFar;
					//var proportionOfLine = distanceToGo/coursePath.path[i].realWorldDistance;

					var line = stage.find("#" + coursePath.path[i].id)[0];
					console.log("got the line with id " + line.id());
					lineDistance = Math.sqrt(Math.pow(line.points()[0] - line.points()[1], 2) + Math.pow(line.points()[2] - line.points()[3],2));
					
					pixelsToAMetre = lineDistance/coursePath.path[i].realWorldDistance;
					pointDistance = distanceToGo*pixelsToAMetre; 
					//pointDistance = proportionOfLine*lineDistance; 
					

					vx = (line.points()[2] - line.points()[0]) / lineDistance;
					vy = (line.points()[3] - line.points()[1]) / lineDistance;


					pointX = line.points()[0] + vx * pointDistance;
					pointY = line.points()[1] + vy * pointDistance;

					var spot = new Kinetic.Circle
					({
						x: pointX,
						y: pointY,
						radius: size,
						fill: colour,
						stroke: 'black',
						strokeWidth: 2,
						opacity: 0.8,
						id: "eventPlaybackButton_" +  tag.videoPlaybackId,
						name: "mapSpot"
					});

					spotL.add(spot);
					break;

				}

				else
				{
					distanceSoFar += coursePath.path[i].realWorldDistance;
				}
			}
		}

		for(var i in runner.tags.existingTags)
		{
			getPosition(runner.tags.existingTags[i], 'white', 15);
		}

		for(var i in runner.tags.possibleVideos)
		{
			getPosition(runner.tags.possibleVideos[i], 'gray',10);
		}

		stage.add(spotL);
		$("#mapViewContainer").unbind().on('click touchstart',spotClickHandler);

	}

	var spotClickHandler = function (event)
	{
		var spots = spotL.find('.mapSpot');


		if(event.type == "touchstart")
		{
			var pointX = event.originalEvent.touches[0].clientX - $('#mapViewContainer').position().left;
			var pointY = event.originalEvent.touches[0].clientY - $('#mapViewContainer').position().top;
		}
		else
		{
			var pointX = event.offsetX;
			var pointY = event.offsetY;
		}
		var tagsAndVideos = [];
		

		 for(var p = 0; p < spots.length; ++p)
		 {
		 	if(pointX > spots[p].x()-20 && pointX < spots[p].x()+20 &&
		 		pointY > spots[p].y()-20 && pointY < spots[p].y()+20 )
		 	{
				for(var j in runner.tags.existingTags)
				{
					if(spots[p].id() == "eventPlaybackButton_" + runner.tags.existingTags[j].videoPlaybackId)
					{
						//tappedTags.push(runner.tags.existingTags[j]);
						var targetIdStrings = spots[p].id().split('_');
						tagsAndVideos.push({"type": "tag" , "feedId": targetIdStrings[1], "start": targetIdStrings[2], 
												"end":targetIdStrings[3], "showTaggingPage": false});
					}
				}

				for(var k in runner.tags.possibleVideos)
				{
					if(spots[p].id() == "eventPlaybackButton_" + runner.tags.possibleVideos[k].videoPlaybackId)
					{
						//tappedTags.push(runner.tags.existingTags[j]);
						var targetIdStrings = spots[p].id().split('_');
						tagsAndVideos.push({"type": "video" , "feedId": targetIdStrings[1], "start": targetIdStrings[2], 
												"end":targetIdStrings[3], "showTaggingPage": true});
					}
				}
		 	}
		 }
     		 if(tagsAndVideos.length > 1)
		 {
		 	marathonHelpers.showVideoPlaybackOptionModal(tagsAndVideos);
		 	return;
		 }

		 else if(tagsAndVideos.length == 1)
		 {
			marathonHelpers.showVideoPlaybackModal(tagsAndVideos[0].feedId, tagsAndVideos[0].start, 
				tagsAndVideos[0].end, tagsAndVideos[0].showTaggingPage);
		 }

	}


}());