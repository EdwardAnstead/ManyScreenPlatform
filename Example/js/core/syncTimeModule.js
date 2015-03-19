var syncTime = (function()
{
	var seedTime;
	var recievedTime;

	var setTime = function(sendTime, recieveTime, serverTime)
	{
		seedTime = parseInt(((recieveTime - sendTime)/2)+ serverTime);
		recievedTime = recieveTime;
		console.log("the time is " + new Date().getTime() + " I think it is " +  getSyncTime());
	} 

	var getSyncTime = function()
	{
		return (new Date().getTime() - recievedTime) + seedTime;
	}

	return{
		getSyncTime: getSyncTime,
		setTime: setTime
	}
}());