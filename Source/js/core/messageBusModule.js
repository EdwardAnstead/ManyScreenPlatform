/*

MessageBus connector module

connects the message bus and disconnects if the page is closed.

inistigated by the appModule and all communication should go though that module 
to ensure the model is consistent between server and application

*/

var messageBus = (function (){

	//var url = "ws://localhost:61623";
	var client;
	var topic = "/topic/multiscreen";
	var id = new Date().getTime();
	var appDataRecieved = false;

	var sendTime;
	var recievedTime;

	function subCallback (message)
	{
		//got a message back from the server 

		var	parsedMessage = JSON.parse(message.body);


		if(!appDataRecieved)
		{
			recievedTime = new Date().getTime();

			//the first message back from  the server should contain the appData
			if(parsedMessage.hasOwnProperty('data') && parsedMessage.deviceId == id)
			{
				app.setAppData(parsedMessage);
				appDataRecieved = true;
				syncTime.setTime(sendTime, recievedTime, parsedMessage.timestamp);
			}

			//TODO do something to check if the data has come from the server.  Maybe a timeout ignoring all other messages until 
			//the applicationData has arrived.
		}
			
		else if(parsedMessage.deviceId != id)
		{
			parsedMessage = JSON.parse(message.body);
			app.update("mbModule", parsedMessage, true);
		}
	}
	
	var connect = function(type, url)
	{ 
		client = Stomp.client(url);

	
		var errorCallback = function (error){
			connect(type, url);
		}
	
		var connectCallback = function(){
	
			client.subscribe(topic, subCallback);
			sendTime = new Date().getTime();
			client.send(topic, {}, '{"type": "connection", ' +
									'"connectionType": "newConnection", ' +
									'"deviceId":' + id +',' +
									'"deviceType":"' + type + '"} ')
		}
	
		client.connect("admin", "password", connectCallback, errorCallback);

		$(window).unload(function(){
			client.send(topic, {target :'server'}, '{"type": "connection", "connectionType": "disconnect", "deviceID":' + id +', "deviceType":"' + type + '"}')
			client.disconnect(function(){
				$("#output").append("<p>Client has been disconnected</p>");
			});
		})
	}

	var sendMessage = function(message)
	{
		client.send(topic, {}, JSON.stringify(message));
	}

	var getDeviceId = function()
	{
		return id;
	}
	
	return{
		sendMessage: sendMessage,
		connect: connect,
		getDeviceId: getDeviceId
	}

}())