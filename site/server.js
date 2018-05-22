"use strict";

process.title = "node-ttisd-server";

var http = require('http');
var fs = require('fs');
var WebsocketServer = require('websocket').server;

const hostname = 'localhost';
const port = 3000;

function toArrayBuffer(buffer) {
	var ab = new ArrayBuffer(buffer.length);
	var view = new Uint8Array(ab);
	for (var i = 0; i < buffer.length; ++i) {
			view[i] = buffer[i];
	}
	return ab;
}


var httpServer = http.createServer(function (req, res) {
	var localPath;
	// console.log(req.url);

	if (req.url == "/jquery.js") {
		localPath = "jquery.js";
	} else if (req.url == "/" || req.url == "/index.html") {
		localPath = "demo.html";
		console.log((new Date()) + " Serving index.html");
	}
	else {
		res.writeHead(404);
		res.write("File not found");
		res.end();
		return;
	}

	fs.readFile(localPath, function (err, data) {
		res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
		res.write(data);
		res.end();
	});
});
httpServer.listen(port, () => {
	console.log((new Date()) + ` Listening on port ${port}`);
});

var wsServer = new WebsocketServer({
	httpServer: httpServer
});

wsServer.on('request', function (request) {
	var connection_outer = request.accept(null, request.origin);

	// Received new data from client
	connection_outer.on('message', function (message) {
		if (message.type == 'utf8') {
			console.log((new Date()) + " Received message from " + connection_outer.remoteAddress + ": " + message.utf8Data);
		} else if (message.type == 'binary') {
			console.log((new Date()) + " Received binary message from " + connection_outer.remoteAddress);
			// console.log(Array.apply([], new Uint8Array(message.binaryData)).join(","));

			var floats = new Float32Array(toArrayBuffer(message.binaryData));
			var x_accel = floats[0];
			var y_accel = floats[1];
			var z_accel = floats[2];
			console.log(`X: ${x_accel} Y: ${y_accel} Z: ${z_accel}`);
		}
		else {
			console.error((new Date()) + " Invalid message type!");
		}
	});

	// Client closed connection
	connection_outer.on('close', function (connection) {
		console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
	});
})
