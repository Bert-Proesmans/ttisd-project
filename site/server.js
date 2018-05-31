"use strict";

process.title = "node-ttisd-server";

var https = require('https');
var fs = require('fs');
var path = require('path');
var inquirer = require('inquirer');
var WebsocketServer = require('websocket').server;

const hostname = 'localhost';
const port = 3000;
const update_interval = (1.0 / 50.0)

var client = null;
var distanceCounter = null;
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
			'Rowing',
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
		name: 'accelerateUp',
		message: 'Pull the cords to lift the client',
		default: 'OK',
		when: function (hash) {
			return hash.game === 'Rowing';
		}
	},
	{
		type: 'input',
		name: 'accelerateDown',
		message: 'Release the cords to lower the client',
		default: 'OK',
		when: function (hash) {
			return hash.game === 'Rowing';
		}
	},
	{
		type: 'input',
		name: 'allDone',
		message: 'Calibration complete',
		default: 'OK',
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

// Kalman filter to produce a noise free acceleration.
// Use this filter one the combined acceleration of all axis. This both
// reduces the amount of calculations necessary and makes the acceleration 
// single-dimensional -> because we don't know which axis we ACTUALLY want..
// The view application decides what the acceleration means, TODO: pass down 
// client IDs so the client can link up data with the semantic meaning.
function Kalman() {
	this.G = 1; // filter gain
	this.Rw = 1; // noise power desirable
	this.Rv = 10; // noise power estimated

	this.A = 1;
	this.C = 1;
	this.B = 0;
	this.u = 0;
	this.P = NaN;
	this.x = NaN; // estimated signal without noise
	this.y = NaN; //measured		

	this.onFilteringKalman = function (ech)//signal: signal measured
	{
		this.y = ech;

		if (isNaN(this.x)) {
			this.x = 1 / this.C * this.y;
			this.P = 1 / this.C * this.Rv * 1 / this.C;
		}
		else {
			// Kalman Filter: Prediction and covariance P
			this.x = this.A * this.x + this.B * this.u;
			this.P = this.A * this.P * this.A + this.Rw;
			// Gain
			this.G = this.P * this.C * 1 / (this.C * this.P * this.C + this.Rv);
			// Correction
			this.x = this.x + this.G * (this.y - this.C * this.x);
			this.P = this.P - this.G * this.C * this.P;
		};
		return this.x;
	};

	this.setRv = function (Rv)//signal: signal measured
	{
		this.Rv = Rv;
	};
};

function DistanceCalculator() {
	this.acc_norm = new Array(); // amplitude of the acceleration 

	this.var_acc = 0.; // variance of the acceleration on the window L
	this.min_acc = 1. / 0.;  // minimum of the acceleration on the window L
	this.max_acc = -1. / 0.; // maximum of the acceleration on the window L
	this.threshold = -1. / 0.; // threshold to detect any acceleration
	this.sensibility = 1. / 30.;  // sensibility to detect any acceleration in relation
	// to running avg acceleration.

	this.speed = 0;  // instantaneous speed of the pedestrian (m/s)
	this.meanSpeed = 0;  // mean speed of the pedestrian (m/s)

	this.filter = new Kalman();

	// initialization of arrays.
	//
	// USAGE:
	// createTable(2/[interval (s)]);
	this.createTable = function (lWindow) {
		this.acc_norm = new Array(lWindow);
	};

	// update arrays
	this.update = function () {
		this.acc_norm.shift();
	};

	this.setSensibility = function (sensibility) {
		this.sensibility = sensibility;
	};

	// compute norm of the acceleration vector.
	// this combines accelerometer data from all axes (including GRAVITY?).	
	//
	// USAGE: 
	// normalized_acc = computeNorm(data.dm.gx, data.dm.gy, data.dm.gz);
	// [this].acc_norm.push(normalized_acc);
	// update();
	this.computeNorm = function (x, y, z) {
		var norm = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
		var norm_filt = this.filter.onFilteringKalman(norm);

		return norm_filt / 9.80665;
	};

	// seek variance
	this.varAcc = function (acc) {
		var moy = 0.;//mean
		var moy2 = 0.;//square mean
		for (var k = 0; k < acc.length - 1; k++) {
			moy += acc[k];
			moy2 += Math.pow(acc[k], 2);
		};
		this.var_acc = (Math.pow(moy, 2) - moy2) / acc.length;
		if (this.var_acc - 0.5 > 0.) {
			this.var_acc -= 0.5;
		};
		if (isNaN(this.var_acc) == 0) {
			this.filter.setRv(this.var_acc);
			this.setSensibility(2. * Math.sqrt(this.var_acc) / Math.pow(9.80665, 2));
		}
		else {
			this.setSensibility(1. / 30.);
		};
	};

	// seek minimum
	this.minAcc = function (acc) {
		var mini = 1. / 0.;
		for (var k = 0; k < acc.length; k++) {
			if (acc[k] < mini) {
				mini = acc[k];
			};
		};
		return mini;
	};

	// seek maximum
	this.maxAcc = function (acc) {
		var maxi = -1. / 0.;
		for (var k = 0; k < acc.length; k++) {
			if (acc[k] > maxi) {
				maxi = acc[k];
			};
		};
		return maxi;
	};

	// compute the threshold
	this.setThreshold = function (min, max) {
		this.threshold = (min + max) / 2;
	};

	// Return 
	//
	// USAGE: 
	// normalized_acc = computeNorm(data.dm.gx, data.dm.gy, data.dm.gz);
	// [this].acc_norm.push(normalized_acc);
	// update();
	// data = onMeasurement([this].acc_norm)
	this.onMeasurement = function (acc) {
		this.varAcc(acc);
		this.min_acc = this.minAcc(acc);
		this.max_acc = this.maxAcc(acc);

		this.setThreshold(this.min_acc, this.max_acc);

		var diff = this.max_acc - this.min_acc;

		var isSensibility = (Math.abs(diff) >= this.sensibility)// the acceleration has to go over the sensibility
		var isOverThreshold = ((acc[acc.length - 1] >= this.threshold) && (acc[acc.length - 2] < this.threshold));// if the acceleration goes over the threshold and the previous was below this threshold

		if (isSensibility && isOverThreshold) {
			return acc[acc.length - 1];
		} else {
			// return acc[acc.length - 1];
			return 0;
		}
	};
}

function delegate_command(data_string, connection) {
	switch (data_string) {
		case "ANNOUNCE: CLIENT":
			if (client == null) {
				console.log({ action: "REG_CLIENT", status: "OK" });
				client = connection;
				distanceCounter = new DistanceCalculator();
				distanceCounter.createTable(Math.round(2 / update_interval));
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

			var multicastObj = {
				type: "RUNNING",
				data: {
					ratioLeft: 0,
					ratioRight: 0,
					ratioForward: 0,
					ratioBackward: 0,
					acceleration: 0,
				}
			};

			if (distanceCounter != null) {
				var mgx = obj.data.dm.gx;
				var mgy = obj.data.dm.gy;
				var mgz = obj.data.dm.gz;
				var norm = distanceCounter.computeNorm(mgx, mgy, mgz);
				distanceCounter.acc_norm.push(norm);
				distanceCounter.update();
				var acceleration = distanceCounter.onMeasurement(distanceCounter.acc_norm);
				multicastObj.data.acceleration = acceleration;
				// console.log({ dbg: true, acceleration: acceleration });
			}

			if (calibration.valid == true) {
				// Calculate the ratio's for each movement.
				var zAngle = obj.data.do.alpha - calibration.zero.alpha;
				var yAngle = obj.data.do.gamma - calibration.zero.gamma;

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
			}

			// console.log({ dbg: true, ratios: multicastObj });
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
			distanceCounter = null;
			console.log({ action: "CLOSE", message: "Client disconnected!" });
		}
	});
});

// Wait for random input on STDIN before starting interactive cli.
process.stdin.once('data', function () {
	console.log({ message: "Calibration complete" });
	// Execute inquirer for interactive calibration
	inquirer.prompt(questions_racing).then(function (answers) {
		if (calibration.valid && answers.game === 'Racing') {
			console.log({ action: "Interactive calibration", status: "OK", data: answers });
			console.log(calibration.max_min);
		}

		// Instruct client to send updates
		client_send_str("FLOOD");
	});
});
