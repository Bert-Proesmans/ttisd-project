"use strict";

process.title = "node-ttisd-server";

var https = require('https');
var fs = require('fs');
var path = require('path');
var inquirer = require('inquirer');
var WebsocketServer = require('websocket').server;

const hostname = 'localhost';
const port = 3000;

var client = null;
// All calibration happens in LANDSCAPE MODE!
// The alpha, beta, gamma values are always relative to the device orthogonal
// system.
// https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained 
var calibration = {
	valid: false,
	zero: {
		// Rotation around Z-axis, Z-axis is perpendicular to the ground plane
		// and is a vector moving outwards of the screen. Positive towards the user,
		// negative towards the back of the device.
		alpha: null,
		// Rotation around X-axis. Part of ground plane, positive upwards, negative
		// downwards. LANDSCAPE MODE.
		beta: null,
		// Rotation around Y-axis. Part of ground plane, positive towards left, negative
		// towards right. LANDSCAPE MODE.
		gamma: null,
	},
	max_min: {
		alpha: [0, 360],
		beta: [-180, 180],
		gamma: [-90, 90],
	}
};

var views = [];
// Contains callbacks which have to be resolved
var promise_snapshot_defer = null;

function toRadians(angle) {
	return angle * (Math.PI / 180);
}

function Deferred() {
	let resolve, reject, p = new Promise((res, rej) => [resolve, reject] = [res, rej]);
	return Object.assign(p, { resolve, reject });
}

function client_send_str(string_data) {
	if (!client) {
		console.log((new Date()) + " Non-existant client!");
		return;
	}
	client.sendUTF(string_data);
}

function client_send_bytes(byte_data) {
	if (!client) {
		console.log((new Date()) + " Non-existant client!");
		return;
	}
	client.sendBytes(byte_data);
}

const questions_racing = [
	{
		type: 'input',
		name: 'readyForSetup',
		message: 'Start calibrating the client',
		default: "OK",
		validate: function (value) {
			var valid = client != null;
			return valid || "There is currently NO CLIENT attached!\n";
		},
	},
	{
		type: 'list',
		name: 'game',
		message: 'What game logic do you wish?',
		choices: [
			'Racing',
		]
	},
	{
		type: 'input',
		name: 'defaultPosition',
		message: 'Bring the client into default position',
		default: "OK",
		validate: function (value) {
			// var done = this.async();
			var valid = promise_snapshot_defer == null;
			if (!valid) {
				return "Broke state machine";
			}
			//
			promise_snapshot_defer = Deferred();
			// d.then(value => done(null, true));
			// d.resolve('World');

			// Set head direction of device.
			// Request for a snapshot of the client.
			client_send_str("HEAD_STEP");
			// Make sure to throw away the data and just return true.
			return promise_snapshot_defer.then(function (data) {
				calibration.valid = false;
				calibration.zero.alpha = data.do.alpha;
				calibration.zero.beta = data.do.beta;
				calibration.zero.gamma = data.do.gamma;
				return true;
			});
		}
	},
	{
		type: 'input',
		name: 'fullRotateLeft',
		message: 'Rotate the steering wheel to the left as far as possible',
		default: 'OK',
		when: function (hash) {
			return hash.game === 'Racing';
		},
		validate: function (value) {
			// var done = this.async();
			var valid = promise_snapshot_defer == null;
			if (!valid) {
				return "Broke state machine";
			}
			//
			promise_snapshot_defer = Deferred();
			// Request for a snapshot of the client.
			client_send_str("STEP");
			// Make sure to throw away the data and just return true.
			return promise_snapshot_defer.then(function (data) {
				// Far left range
				calibration.max_min.alpha[0] = data.do.alpha;
				return true;
			});
		},
	},
	{
		type: 'input',
		name: 'fullRotateRight',
		message: 'Rotate the steering wheel to the right as far as possible',
		default: 'OK',
		when: function (hash) {
			return hash.game === 'Racing';
		},
		validate: function (value) {
			// var done = this.async();
			var valid = promise_snapshot_defer == null;
			if (!valid) {
				return "Broke state machine";
			}
			//
			promise_snapshot_defer = Deferred();
			// Request for a snapshot of the client.
			client_send_str("STEP");
			// Make sure to throw away the data and just return true.
			return promise_snapshot_defer.then(function (data) {
				// Far right range
				calibration.max_min.alpha[1] = data.do.alpha;
				return true;
			});
		},
	},
	{
		type: 'input',
		name: 'fullPull',
		message: 'Pull the steering wheel towards you as far as possible',
		default: 'OK',
		when: function (hash) {
			return hash.game === 'Racing';
		},
		validate: function (value) {
			// var done = this.async();
			var valid = promise_snapshot_defer == null;
			if (!valid) {
				return "Broke state machine";
			}
			//
			promise_snapshot_defer = Deferred();
			// Request for a snapshot of the client.
			client_send_str("STEP");
			// Make sure to throw away the data and just return true.
			return promise_snapshot_defer.then(function (data) {
				// Far right range
				calibration.max_min.gamma[0] = data.do.gamma;
				return true;
			});
		},
	},
	{
		type: 'input',
		name: 'fullPush',
		message: 'Push the steering wheel away from you as far as possible',
		default: 'OK',
		when: function (hash) {
			return hash.game === 'Racing';
		},
		validate: function (value) {
			// var done = this.async();
			var valid = promise_snapshot_defer == null;
			if (!valid) {
				return "Broke state machine";
			}
			//
			promise_snapshot_defer = Deferred();
			// Request for a snapshot of the client.
			client_send_str("STEP");
			// Make sure to throw away the data and just return true.
			return promise_snapshot_defer.then(function (data) {
				// Far right range
				calibration.max_min.gamma[1] = data.do.gamma;
				return true;
			});
		},
	},
	{
		type: 'input',
		name: 'allDone',
		message: 'Calibration complete',
		default: 'OK',
		when: function (hash) {
			return hash.game === 'Racing';
		},
		validate: function (value) {
			// var done = this.async();
			var valid = promise_snapshot_defer == null && client != null;
			if (!valid) {
				return "Broke state machine";
			}
			//
			calibration.valid = true;
			// Post processing

			return true;
		},
	},

];

function delegate_command(data_string, connection) {
	switch (data_string) {
		case "ANNOUNCE: CLIENT":
			if (client == null) {
				console.log({ action: "REG_CLIENT", status: "OK" });
				client = connection;
			} else {
				console.log({ action: "REG_CLIENT", status: "ALREADY REGISTERED" });
				connection.sendUTF("FAIL_REGISTER");
			}
			break;
		case "ANNOUNCE: VIEW":
			function check_duplicate_views(check) {
				return connection != check;
			}
			// The connection object doesn't already exist within the view array.
			if (views.every(check_duplicate_views) == true) {
				console.log({ action: "REG_VIEW", status: "OK" });
				views.push(connection);
			} else {
				console.log({ action: "REG_VIEW", status: "ALREADY REGISTERED" });
			}
			break;
	}
}

function delegate_data(data_bytes, connection) {
	var obj = JSON.parse(data_bytes.toString('utf8'));
	if (!obj.type) {
		console.log({ action: "delegate_bytes", status: "FAIL", message: "No type key present in payload" });
		return;
	}

	// console.log({ dbg: true, var: "obj.data", type: typeof obj.data });
	if (!obj.data) {
		console.log({ action: "delegate_bytes", status: "FAIL", message: "No/invalid data present in payload" });
		return;
	}

	// console.log({ dbg: true, var: "obj", value: obj });

	switch (obj.type) {
		case "SNAPSHOT":
			if (promise_snapshot_defer) {
				promise_snapshot_defer.resolve(obj.data);
				promise_snapshot_defer = null;
				console.log({ action: "SNAPSHOT", status: "OK" });
			} else {
				console.log({ action: "SNAPSHOT", status: "WARN", message: "No promise to resolve" });
			}
			break;
		case "RUNNING":
			if (connection !== client) break;

			// Calculate the ratio's for each movement.
			var zAngle = obj.data.do.alpha - calibration.zero.alpha;
			var yAngle = obj.data.do.gamma - calibration.zero.gamma;

			var multicastObj = {
				type: "RUNNING",
				data: {
					ratioLeft: 0,
					ratioRight: 0,
					ratioForward: 0,
					ratioBackward: 0,
				}
			};

			zAngle = Math.sin(toRadians(zAngle));
			yAngle = Math.sin(toRadians(yAngle));

			if (zAngle < 0) { // Turn right
				multicastObj.data.ratioRight = Math.abs(zAngle);
				multicastObj.data.ratioLeft = 0;
			} else { // Turn left
				multicastObj.data.ratioRight = 0;
				multicastObj.data.ratioLeft = Math.abs(zAngle);
			}

			if (yAngle < 0) { // Pull
				multicastObj.data.ratioBackward = Math.abs(zAngle);
				multicastObj.data.ratioForward = 0;
			} else {
				multicastObj.data.ratioBackward = 0;
				multicastObj.data.ratioForward = Math.abs(zAngle);
			}

			console.log({ ratios: multicastObj });
			multicastObj = JSON.stringify(multicastObj);

			// Send it to all views
			var index;
			for (index = 0; index < views.length; ++index) {
				views[index].sendUTF(multicastObj);
			}
			break;
		default:
			console.log((new Date()) + " Unrecognized payload!");
			break;
	}


	// var floats = new Float32Array(toArrayBuffer(message.binaryData));
	// var x_accel = floats[0];
	// var y_accel = floats[1];
	// var z_accel = floats[2];
	// console.log(`X: ${x_accel} Y: ${y_accel} Z: ${z_accel}`);
}

function toArrayBuffer(buffer) {
	var ab = new ArrayBuffer(buffer.length);
	var view = new Uint8Array(ab);
	for (var i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return ab;
}

var options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem'),
	passphrase: 'test',
};

var httpServer = https.createServer(options, function (req, res) {
	var localPath = null;
	console.log({ type: "GET", url: req.url });

	if (req.url.startsWith("/dist")) {
		localPath = req.url;
	} else if (req.url == "/client.html") {
		localPath = "client.html";
	} else if (req.url == "/view.html" || req.url == "/") {
		localPath = "view.html";
	}

	if (typeof localPath !== 'string') {
		console.log({ message: "Cancelled request due to invalid localPath", path: localPath });
		res.writeHead(404);
		res.write("File not found");
		res.end();
		return;
	}
	// Throws if localPath is NON-STRING
	localPath = path.join(__dirname, localPath);
	if (localPath == null || fs.existsSync(localPath) != true) {
		res.writeHead(404);
		res.write("File not found");
		res.end();
		return;
	}

	console.log((new Date()) + ` Serving ${localPath}`);
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
			// console.log((new Date()) + " Received string from " + connection_outer.remoteAddress + ": " + message.utf8Data);
			//
			delegate_command(message.utf8Data, connection_outer);
		} else if (message.type == 'binary') {
			// console.log((new Date()) + " Received binary from " + connection_outer.remoteAddress);
			// console.log(Array.apply([], new Uint8Array(message.binaryData)).join(","));
			//
			delegate_data(message.binaryData, connection_outer);
		}
		else {
			console.error((new Date()) + " Invalid message type!");
		}
	});

	// connection_outer.send();
	// connection_outer.sendBytes();
	// connection_outer.sendUTF();

	// Client closed connection
	connection_outer.on('close', function (connection) {
		console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
		if (client === connection) {
			client = null;
			console.log({ action: "CLOSE", message: "Client disconnected!" });
		}
	});
});

// Wait for random input on STDIN before starting interactive cli.
process.stdin.once('data', function () {
	// Execute inquirer for interactive calibration
	inquirer.prompt(questions_racing).then(function (answers) {
		if (calibration.valid) {
			console.log({ action: "Interactive calibration", status: "OK", data: answers });
			console.log({ message: "Calibration complete", calib: calibration });
			console.log(calibration.max_min);
			// Instruct client to send updates
			client_send_str("FLOOD");
		}
	});
});
