var tvOverlays = (function(){
	
	var overlayTimeout;
	$(".tvOverlay").hide();

	var playOverlay = function(feedName)
	{
		feed = feedName || "";
		clearTimeout(overlayTimeout);
		$(".tvOverlay").hide();
		$(".tvOverlay").html("<h1> Playing " + feed + "</h1>");
		$(".tvOverlay").show(200);
		overlayTimeout = setTimeout(function(){
			$(".tvOverlay").hide(200);
		},2000)
	}

	var rewindOverlay = function(time)
	{
		clearTimeout(overlayTimeout);
		$(".tvOverlay").hide(100);
		$(".tvOverlay").html("<h1> Rewind 30</h1>")
		$(".tvOverlay").show(200);
		overlayTimeout = setTimeout(function(){
			$(".tvOverlay").hide(200);
		},2000)
	}

	var fastForwardOverlay = function(time)
	{
		clearTimeout(overlayTimeout);
		$(".tvOverlay").hide(100);
		$(".tvOverlay").html("<h1>FastForward 30</h1>")
		$(".tvOverlay").show(200);
		overlayTimeout = setTimeout(function(){
			$(".tvOverlay").hide(200);
		},2000)
	}

	var pauseOverlay = function()
	{
		clearTimeout(overlayTimeout);
		$(".tvOverlay").hide(100);
		$(".tvOverlay").html("<h1>Paused</h1>")
		$(".tvOverlay").show(200);
		overlayTimeout = setTimeout(function(){
			$(".tvOverlay").hide(200);
		},2000)
	}


	return{
		playOverlay: playOverlay,
		rewindOverlay: rewindOverlay,
		fastForwardOverlay: fastForwardOverlay,
		pauseOverlay: pauseOverlay
	}
});