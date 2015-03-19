var fs = require('fs')
var exec = require('child_process').exec



var videoRoot = './'
var marathonLogFile = "grouped-data.js"
var videoChunkDuration = "00:00:20"
var videoChunkDurationUnformat = 20;
var videoChunkStartRelativeToTag = 10;
var outputDirPath =''

var feedToData = [];

var spectatorLookup = [
               {'spectatorId':'2a245f84-acb1-4bc5-aa4f-8951bd67d4e1', 'p_no':'p20', 'video_path':'p20 HORS303 2a2/MarathonVideos/'},
                {'spectatorId':'72337a3b-92e7-4124-9869-9312c559d9fe', 'p_no':'p19', 'video_path':'p19 HORN411 723/MarathonVideos/'},
                {'spectatorId':'3f968c32-1d8b-4cf0-98e3-90c3103444be', 'p_no':'p11', 'video_path':'p11 HORN402 3f9/MarathonVideos/'},
               {'spectatorId': '6c4038ee-05aa-49c4-8d56-d28b97a9f3fa', 'p_no':'p4', 'video_path':'p4 HORN404 6c4/MarathonVideos/'},
                {'spectatorId':'0677dbef-d149-425b-932e-0aae835fb941', 'p_no':'p7', 'video_path':'p7 HORN415 067/MarathonVideos/'},
               {'spectatorId': '82ac450e-788c-4a3d-b117-1329a2a90605', 'p_no':'p21', 'video_path':'p21 HORS302 82a/MarathonVideos/'},
               {'spectatorId': '818efab9-7a9a-4809-8093-a6e0d8ac340d', 'p_no':'p2', 'video_path':'p2 HORN418 818/MarathonVideos/'},
              {'spectatorId':  '3bcacad2-5569-48a2-a2d6-a8eadab3af4d', 'p_no':'p6', 'video_path':'p6 HORN405 3bc/MarathonVideos/'},
               {'spectatorId': '9382d064-c2a5-4875-abe6-d659ac4b2f4d', 'p_no':'p13', 'video_path':'p13 HORN419 938/MarathonVideos/'},
               {'spectatorId': '1f446739-bccc-4bdc-850e-7ccf7f2b77e4', 'p_no':'p17', 'video_path':'p17 HORN409 1f4/MarathonVideos/'},
                {'spectatorId':'7e4c0bcb-21ca-43e4-a45b-cd40268cb4fb', 'p_no':'p5', 'video_path':'p5 HORN410 7e4/MarathonVideos/'},
               {'spectatorId': '07d66396-41c1-408a-a2f2-f4730ba25bc1', 'p_no':'p12', 'video_path':'p12 HORN412 07d/MarathonVideos/'},
                {'spectatorId':'48f77c18-18f5-4cb7-afc5-ce8c9ccbbf8b', 'p_no':'p3', 'video_path':'p3 HOR(no lable) 48f/MarathonVideos/'},
                {'spectatorId':'6db39eef-7e79-41b9-a76a-b5f9b0e9f57d', 'p_no':'p15', 'video_path':'p15 HORN416 6db/MarathonVideos/'},
                {'spectatorId':'35c79598-2dbd-49f8-b438-090a2f47c572', 'p_no':'p18', 'video_path':'p18 HORS204 35c/MarathonVideos/'},
                {'spectatorId':'d588b006-c4d7-4c8b-93fb-d22b311a4dcf', 'p_no':'p16', 'video_path':'p16 HORN413 d58/MarathonVideos/'},
                {'spectatorId':'dcb42e4e-7196-4d11-837a-9b8aac8a3e8c', 'p_no':'p9', 'video_path':'p9 HORS200 dcb/MarathonVideos/'},
                {'spectatorId':'133b0eed-f890-4d97-bad6-be1946720211', 'p_no':'p8', 'video_path':'p8 HORN401 133/MarathonVideos/'}]

var marathonData;
//open the marathon data file
function getVideoPathBySpectatorId(sId)
{
	for(var i in spectatorLookup)
	{
		if(spectatorLookup[i].spectatorId == sId)
		{
			return videoRoot + spectatorLookup[i].video_path;
		}
	}

	return 0;
}

function outputMapping()
{
	var writeStream = fs.createWriteStream(outputDirPath + 'feedMapping.json', { flags : 'w' });
	writeStream.write(JSON.stringify(feedToData));
	writeStream.close();
}

function getVideoObjectByVideoId(videoId)
{
	for(var i in marathonData.videos)
	{
		if(marathonData.videos[i].id == videoId)
		{
			return marathonData.videos[i];
		}
	}

	return 0;
}

function getSpectatorId(participantId)
{
	for(var i in spectatorLookup)
	{
		if(participantId == spectatorLookup[i].p_no)
		{
			return spectatorLookup[i].spectatorId;
		}
	}
	return 0;
}
function getRunnerVideos()
{
	//search through the marathon data for videos of the runner
	var raceNo = process.argv[3];
	var tagList = []
	for(var i in marathonData.tags)
	{
		if(marathonData.tags[i].raceNo == raceNo)
		{
			tagList.push(marathonData.tags[i]);
		}
	}

	//call up the generate videos function to create the videos of the runner
	console.log("got this many videos " + tagList.length) 
	genRunnerVideos(tagList, raceNo);
}

function getVideoDuration(videoId)
{
	for(var i in marathonData.videos)
	{
		if(videoId == marathonData.videos[i].id)
		{
			return marathonData.videos[i].duration;
		}
	}

	return 0;
}

function formatTime(startTime)
{
	hours = Math.floor(parseInt(startTime)/3600)
	mins = Math.floor((parseInt(startTime) % 3600)/60)
	seconds = parseInt(startTime) % 60;

	formattedHours = (hours < 10 )? '0'+hours : hours.toString();
	formattedMins = (mins < 10 )? '0' + mins : mins.toString();
	formattedSeconds = (seconds < 10 )? '0' + seconds: seconds.toString();
	return formattedHours + ":" + formattedMins + ":" + formattedSeconds;
}

function genRunnerVideos(tagList, raceNo)
{
	

	//generate the full length video first create the ffmpeg input file for the concat demuxer
	var writeStream = fs.createWriteStream(outputDirPath + 'inputFileFull.txt', { flags : 'w' });
	var fileString =''
	var timeCounter = 0;
	for(var i in tagList)
	{
		fileString += "file '." + getVideoPathBySpectatorId(tagList[i].spectatorID) + tagList[i].videoID + ".mp4'"
				+ " duration '" + formatTime(getVideoDuration(tagList[i].videoID)) + "'\n";

		feedToData.push({"feedId": 'runner' + raceNo + 'FullVideo', "startTime": timeCounter, "endTime": timeCounter + getVideoDuration(tagList[i].videoID)})
		timeCounter += getVideoDuration(tagList[i].videoID)
	}

	writeStream.write(fileString);
	writeStream.close();
	//now write this out to ffmpeg
	catVideos(outputDirPath + "inputFileFull.txt", process.argv[3] + 'FullVideo',function(){
		console.log("i called back!")
		genRunnerVideosCropped(tagList, raceNo);
	})
}

var genRunnerVideosCropped = function(tagList, raceNo)
{
	var fileString = '';
	var writeStream = fs.createWriteStream(outputDirPath + 'inputFileCropped.txt', {flags: 'w'});
	it = 0;
	noDone = 0;
	var createCroppedVideos = function()
	{
		videoObj = getVideoObjectByVideoId(tagList[it].videoID);
		videoPath = getVideoPathBySpectatorId(tagList[it].spectatorID);
		//work out the times for the start point.
		startTime = parseInt(tagList[it].time) - parseInt(videoObj.start) - videoChunkStartRelativeToTag;
		var formattedStartTime;
		if(startTime <= 0 )
		{
			formattedStartTime = "00:00:00";
		}

		else
		{
			formattedStartTime = formatTime(startTime);
		}

		ffmpegString = "./ffmpeg  -i '" +videoPath + videoObj.id + ".mp4' -ss " 
					+ formattedStartTime + " -t " + videoChunkDuration + " -async 1 -vcodec copy -acodec copy " 
					+ outputDirPath + "outputOfCrop" + it + ".mp4"; 
			console.log("the cropping command is " + ffmpegString); 

		var fullChild = exec(ffmpegString,
		  function (error, stdout, stderr) 
		  {		
		    	console.log('stdout: ' + stdout);
		   	 	console.log('stderr: ' + stderr);
		   	 	it++;
		   	 	if(it < tagList.length)
		   	 	{
		   	 		createCroppedVideos();
		   	 	}
		   	 	else
		   	 	{
			   	 	var timeCounter = 0;
					for(var i in tagList)
					{
						fileString += "file './" + "outputOfCrop" + i + ".mp4' duration = '" + videoChunkDuration + "'\n";
						feedToData.push({"feedId": 'runner' + raceNo + 'FullVideo', "startTime": timeCounter, "endTime": timeCounter + videoChunkDurationUnformat})
						timeCounter += videoChunkDuration
					}
					writeStream.write(fileString);
					writeStream.close();

					catVideos(outputDirPath + 'inputFileCropped.txt', process.argv[3] + 'CroppedVideo', outputMapping)	
		   	 	}
		   	 	
		    	if (error !== null) {
		   		   	console.log('exec error: ' + error);
		    	}
			});
	}
	createCroppedVideos(function(){
		var timeCounter = 0;
		for(var i in tagList)
		{
			fileString += "file './" + "outputOfCrop" + i + ".mp4' duration = '" + videoChunkDuration + "'\n";
			feedToData.push({"feedId": 'runner' + raceNo + 'FullVideo', "startTime": timeCounter, "endTime": timeCounter + videoChunkDurationUnformat})
			timeCounter += videoChunkDuration
		}
		writeStream.write(fileString);
		writeStream.close();

		catVideos(outputDirPath + 'inputFileCropped.txt', process.argv[3] + 'CroppedVideo', outputMapping)
	});
}

function getSpectatorVideos()
{
	var specId = getSpectatorId(process.argv[3])
	var videoList = []
	for (var i in marathonData.videos)
	{
		if(marathonData.videos[i].spectatorID == specId)
		{
			videoList.push(marathonData.videos[i])
		}
	} 

	var writeStream = fs.createWriteStream(outputDirPath + 'inputFileFull.txt', { flags : 'w' });
	var fileString =''
	var timeCounter = 0;
	for(var i in videoList)
	{
		fileString += "file '" + getVideoPathBySpectatorId(videoList[i].spectatorID) + videoList[i].videoID + ".mp4'"
				+ " duration '" +  formatTime(videoList[i].duration) + "'\n";
		feedToData.push({"feedId": 'spectator' + specId + 'Video', "startTime": timeCounter, "endTime": timeCounter + videoList[i].duration})
		timeCounter += videoList[i].duration
	}

	writeStream.write(fileString);
	writeStream.close();
	//now write this out to ffmpeg
	catVideos(outputDirPath + "inputFileFull.txt", process.argv[3] + "Video", outputMapping);


}

function catVideos(inputFile, feedId, callback)
{
	var ffmpegRenderString = './ffmpeg -f concat -i ' + inputFile + ' -c copy ./' + outputDirPath + feedId + '.mp4'
	   console.log(ffmpegRenderString);

	var fullChild = exec(ffmpegRenderString,
	  function (error, stdout, stderr) {
	    console.log('stdout: ' + stdout);
	    console.log('stderr: ' + stderr);
	    if (error !== null) {
	      console.log('exec error: ' + error);
	    }
	});

	fullChild.on('exit', function(code){
		console.log("done concat")
		if(callback){
			callback();
		}
	})
}



fs.readFile(marathonLogFile, "utf8", function(err, data){

	if(err)
	{
		return console.log(err);
	}
	
	marathonData = JSON.parse(data)

	if(process.argv[2] == "spectator")
	{
		outputDirPath = 'spectator' + process.argv[3] + 'output';
		fs.mkdir(outputDirPath, function(){
			outputDirPath += "/"
			getSpectatorVideos();
		});
		
	}

	if(process.argv[2] == "runner")
	{
		outputDirPath = 'runner' + process.argv[3] + 'output';
		fs.mkdir(outputDirPath, function(){
			outputDirPath += "/"
			getRunnerVideos();
		});
		
	}
});

