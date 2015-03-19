var observer = (function(){

	subscribers = [];
	var subscribe = function(subscriberName, functionName)
	{
		//add modules to the list of subscribers
		subscribers.push({name: subscriberName, fn: functionName});
	} 

	var unsubscribe = function(subscriberName)
	{
		//remove modules from the list of subscribers
		for(i in subscribers)
		{
			if(subscribers.name == subscriberName)
			{
				subscribers.splice(i, 1);
			}
		}
	}

	var publish = function(sourceModule, updateType)
	{
		//publish message to subsrcibers informing them of updates to the model
		//the updateType is a string of either "playhead", "ready" or "state"

		for(i in subscribers)
		{
			if(sourceModule != subscribers[i].name)
			{
				subscribers[i].fn(updateType);
			}
		}
	}


	return{
		subscribe:subscribe,
		unsubscribe:unsubscribe,
		publish:publish,
		subscribers:subscribers
	}
}())