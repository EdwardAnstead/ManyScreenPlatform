var messageBusModel = (function() {

	//private members
	
	var url = "ws://localhost:61623";
	var client = Stomp.client(url);
	
	var errorCallback = function (error){
		alert("Unable to connect to the message bus ");
	}
	
	var connectCallback = function(){
		$("#bum").text("Socket test successful");
			var subCallback = function(message)
	{
		console.log("got the message " + message.body);
	};
	
	client.subscribe("/topic/multiscreen", subCallback);
	}
	
	client.connect("admin", "password", connectCallback, errorCallback);
	
	var disconnectClient = function(string){
		client.disconnect(function(){
			alert(string);
		});
	}
	

	return {
		disconnect: disconnectClient
		};
	

}());