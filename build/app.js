'use strict';

var _utilityFunctions = require('./utils/utilityFunctions');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var rti = require('rticonnextdds-connector');

// const fs = require('fs');
// let file = fs.createWriteStream('./test.csv');

var _sockets = {};
var devices = process.devices = {};
var _devicesId = {};

io.on('connection', function (socket) {
	socket.on('initial', function (deviceId, ackCb) {
		_sockets[socket.id] = socket;

		if (deviceId && devices[deviceId]) {
			if (!devices[deviceId]['sockets']) {
				devices[deviceId]['sockets'] = [];
			}
			devices[deviceId]['sockets'].push(socket.id);
			_devicesId[socket.id] = deviceId;
		}

		console.log(devices);
		console.log(Object.keys(_sockets).length);

		if (ackCb) {
			ackCb("server: initial success");
		}
	});

	socket.on('disconnect', function () {
		delete _sockets[socket.id];
		if (devices[_devicesId[socket.id]]) {
			devices[_devicesId[socket.id]].sockets = devices[_devicesId[socket.id]].sockets.filter(function (id) {
				return !socket.id;
			});
		}
	});
});

var sampleArrayConnector = new rti.Connector("MyParticipantLibrary::SampleArray", path.join(process.cwd(), "/openice-dds.xml"));
var numericConnector = new rti.Connector("MyParticipantLibrary::Numeric", path.join(process.cwd(), "/openice-dds.xml"));
var deviceInfoConnector = new rti.Connector("MyParticipantLibrary::DeviceInfo", path.join(process.cwd(), "/openice-dds.xml"));

var sampleArrayInput = sampleArrayConnector.getInput("MySubscriber::SampleArrayReader");
var numericInput = numericConnector.getInput("MySubscriber::NumericReader");
var deviceIdentityInput = deviceInfoConnector.getInput("MySubscriber::DeviceIdentityReader");
var deviceConnectivityInput = deviceInfoConnector.getInput("MySubscriber::DeviceConnectivityReader");

sampleArrayConnector.on('on_data_available', onDataAvailableSA);
numericConnector.on('on_data_available', onDataAvailableN);
deviceInfoConnector.on('on_data_available', onDataAvailableInfo);

function onDataAvailableSA() {
	sampleArrayInput.take();

	var identifier = void 0;
	//console.log('sampleArrayInput length',sampleArrayInput.samples.getLength())
	for (var i = 1; i <= sampleArrayInput.samples.getLength(); i++) {
		if (sampleArrayInput.infos.isValid(i)) {
			var sampleArray = sampleArrayInput.samples.getJSON(i);
			var values = sampleArray.values,
			    metric_id = sampleArray.metric_id,
			    unique_device_identifier = sampleArray.unique_device_identifier,
			    frequency = sampleArray.frequency;

			identifier = unique_device_identifier;

			// console.log(sampleArray.metric_id);
			// console.log(sampleArray.frequency);
			// console.log(sampleArray.values.length);

			var formatFrequency = 60 * Math.ceil(frequency / 60); // format to 60m, m is integer
			// device time range, eg. frequency 500, data length 1000. After format: 540, data length 1080, time range 2s
			var time = Math.floor(values.length / frequency);
			var formatLength = formatFrequency * time;
			var formatWaveform = (0, _utilityFunctions.interpolateArray)(values, formatLength);
			// console.log('formatLength', formatLength);
			// console.log('formatFrequency', formatFrequency);
			// console.log('time', Math.floor((values.length / frequency)));

			var max = Math.max.apply(Math, _toConsumableArray(values));
			var min = Math.min.apply(Math, _toConsumableArray(values));
			var dataHeight = max - min;
			var normalizedWaveform = [];
			for (var _i = 0, len = formatWaveform.length; _i < len; _i++) {
				normalizedWaveform.push(1 - (formatWaveform[_i] - min) / dataHeight);
			}

			if (!devices[unique_device_identifier]) {
				devices[unique_device_identifier] = {};
			}
			if (!devices[unique_device_identifier]['sampleArray']) {
				devices[unique_device_identifier]['sampleArray'] = {};
			}
			if (!devices[unique_device_identifier]['sampleArray'][metric_id]) {
				devices[unique_device_identifier]['sampleArray'][metric_id] = {
					value: [],
					frequency: frequency
				};
			}
			if (devices[unique_device_identifier]["recording"] && devices[unique_device_identifier]["recording"]["sampleArray"][metric_id]) {
				var _devices$unique_devic;

				(_devices$unique_devic = devices[unique_device_identifier]['sampleArray'][metric_id].value).push.apply(_devices$unique_devic, _toConsumableArray(values));
				//console.log(devices[unique_device_identifier]['sampleArray'][metric_id].value.length);
			}
			emitDatatoClient(unique_device_identifier, metric_id, {
				normalizedWaveform: normalizedWaveform,
				frequency: formatFrequency
			});

			//console.log('test',devices);

			// console.log('length', normalizedWaveform.length);
			// console.log('frequency', formatFrequency);
		}
	}
}

function onDataAvailableN() {
	numericInput.take();

	var identifier = void 0;
	//console.log('numericInput length',numericInput.samples.getLength())
	for (var i = 1; i <= numericInput.samples.getLength(); i++) {
		if (numericInput.infos.isValid(i)) {
			var numeric = numericInput.samples.getJSON(i);
			var value = numeric.value,
			    metric_id = numeric.metric_id,
			    unique_device_identifier = numeric.unique_device_identifier;

			identifier = unique_device_identifier;

			if (!devices[unique_device_identifier]) {
				devices[unique_device_identifier] = {};
			}
			if (!devices[unique_device_identifier]['numeric']) {
				devices[unique_device_identifier]['numeric'] = {};
			}
			if (!devices[unique_device_identifier]['numeric'][metric_id]) {
				devices[unique_device_identifier]['numeric'][metric_id] = [];
			}
			//devices[unique_device_identifier]['numeric'][metric_id].push(value);
			switch (metric_id) {
				case "MDC_PRESS_BLD_ART_ABP_SYS":
					ABPTemplate(unique_device_identifier, value, 'sys');
					break;
				case "MDC_PRESS_BLD_ART_ABP_DIA":
					ABPTemplate(unique_device_identifier, value, 'dia');
					break;
				default:
					emitDatatoClient(unique_device_identifier, metric_id, numericalTemplate(value));
					break;
			}
		}
	}
}

function onDataAvailableInfo() {
	deviceConnectivityInput.take();
	//console.log('deviceConnectivityInput length',deviceConnectivityInput.samples.getLength())
	for (var i = 1; i <= deviceConnectivityInput.samples.getLength(); i++) {
		if (deviceConnectivityInput.infos.isValid(i)) {
			var deviceConnectivity = deviceConnectivityInput.samples.getJSON(i);
			var unique_device_identifier = deviceConnectivity.unique_device_identifier;

			if (!devices[unique_device_identifier]) {
				devices[unique_device_identifier] = {};
			}
			if (!devices[unique_device_identifier]['deviceConnectivity']) {
				devices[unique_device_identifier]['deviceConnectivity'] = {};
			}

			var message = void 0;
			switch (deviceConnectivity.state) {
				case 0:
					message = 'Initial';
					break;
				case 1:
					message = 'Connected';
					break;
				case 2:
					message = 'Connecting';
					break;
				case 3:
					message = 'Negotiating';
					break;
				case 4:
					message = 'Terminal';
					break;
				default:
					message = 'error';
					break;
			}
			deviceConnectivity.state = message;
			deviceConnectivity.info = Buffer.from(deviceConnectivity.info.slice(2), 'hex').toString();
			delete deviceConnectivity['unique_device_identifier'];
			devices[unique_device_identifier]['deviceConnectivity'] = deviceConnectivity;
			if (deviceConnectivity.state === 'Terminal') {
				delete devices[unique_device_identifier];
				return;
			}
		}
	}

	deviceIdentityInput.take();
	//console.log('deviceIdentity length',deviceIdentityInput.samples.getLength())
	for (var _i2 = 1; _i2 <= deviceIdentityInput.samples.getLength(); _i2++) {
		if (deviceIdentityInput.infos.isValid(_i2)) {
			var deviceIdentity = deviceIdentityInput.samples.getJSON(_i2);
			var _unique_device_identifier = deviceIdentity.unique_device_identifier;

			if (!devices[_unique_device_identifier]) {
				devices[_unique_device_identifier] = {};
			}
			if (!devices[_unique_device_identifier]['deviceIdentity']) {
				devices[_unique_device_identifier]['deviceIdentity'] = {};
			}

			deviceIdentity.manufacturer = Buffer.from(deviceIdentity.manufacturer.slice(2), 'hex').toString();
			deviceIdentity.model = Buffer.from(deviceIdentity.model.slice(2), 'hex').toString();
			deviceIdentity.icon.image = 'data:' + deviceIdentity.icon.content_type + ';base64,' + Buffer.from(deviceIdentity.icon.image).toString('base64');
			delete deviceIdentity['unique_device_identifier'];
			devices[_unique_device_identifier]['deviceIdentity'] = deviceIdentity;
		}
	}
}

function emitDatatoClient(deviceId, metric_id, sampleArrayOrNumeric) {
	if (devices[deviceId]['sockets']) {
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = devices[deviceId]['sockets'][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var socketId = _step.value;

				var socket = _sockets[socketId];
				socket.emit(metric_id, sampleArrayOrNumeric);
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}
	}
}

function numericalTemplate(data) {
	return {
		data: data
	};
}

var ABPTemplate = function () {
	var ABPFlag = 0;
	var ABP = {
		systolic: null,
		diastolic: null,
		mean: null
	};

	return function (deviceId, data, name) {
		if (name === "sys") {
			ABP.systolic = data;
			ABPFlag = ABPFlag + 1;
		} else if (name === "dia") {
			ABP.diastolic = data;
			ABPFlag = ABPFlag + 1;
		}

		if (ABPFlag === 2) {
			ABP.mean = Math.round((ABP.systolic + ABP.diastolic * 2) / 3);
			emitDatatoClient(deviceId, "MDC_PRESS_BLD_ART_ABP_NUMERIC", ABP);
			ABPFlag = 0;
		}
	};
}();

console.log("Waiting for data");
server.listen(5000);

app.get('/', function (req, res) {
	res.sendFile(path.join(process.cwd(), '/index.html'));
});

require('./apiapp');