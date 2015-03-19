var fs = require('fs');

var logWriter;
var expectedTvState;

exports.setupLogging = function(loggingFile)
{
	logWriter = fs.WriteStream(loggingFile + '/log' + new Date().toUTCString() + '.txt', {"flags": "a"})
}

exports.logMessage = function(message)
{
	if(message.type != "connectionAccept")
	{	
	

		if((message.hasOwnProperty("tvPlayheadUpdate") && message.tvPlayheadUpdate.state != expectedTvState)||
		(message.hasOwnProperty("tvPlayheadUpdate") && message.tvPlayheadUpdate.seeked))
		{
				messageString = JSON.stringify(message);
				expectedTvState = message.tvPlayheadUpdate.state;
				console.log("\nsetting expectedTvState " + expectedTvState)

		}

		else if(!message.hasOwnProperty('tvPlayheadUpdate'))
		{
			messageString = JSON.stringify(message);
			logWriter.write(messageString + "\n");
		}
	}
}