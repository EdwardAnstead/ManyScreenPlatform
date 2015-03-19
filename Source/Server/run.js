//start the server load the params from the command line and run the main module

var arguments = process.argv.splice(2);
var main = require("./main.js");
var http = require('http');

main.setupAppData(arguments[0]);

//create a simple http server to keep the status sent out to any listening webpages for 
//debugging purposes

http.createServer(function (req, res) {




},500);


