const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const rti = require('rticonnextdds-connector');
import {interpolateArray} from '../utils/utilityFunctions';


let _sockets = {};
let _waveformItems = {};
let devices = {};

io.on('connection', function (socket) {
	socket.on('initial', function (data, ackCb) {
		_sockets[socket.id] = socket;
		let {waveformItems} = data;
		_waveformItems[socket.id] = waveformItems;




		console.log(devices)
		//console.log(_waveformItems)
		console.log(Object.keys(_sockets).length);

		if (ackCb) {
			ackCb("server: initial success");
		}
	});

	socket.on('disconnect', () => {
		delete _sockets[socket.id];
		delete _waveformItems[socket.id];
	});
});

let sampleArrayConnector = new rti.Connector("MyParticipantLibrary::SampleArray", path.join(process.cwd(), "/openice-dds.xml"));
let numericConnector = new rti.Connector("MyParticipantLibrary::Numeric", path.join(process.cwd(), "/openice-dds.xml"));
let deviceInfoConnector = new rti.Connector("MyParticipantLibrary::DeviceInfo", path.join(process.cwd(), "/openice-dds.xml"));

let sampleArrayInput = sampleArrayConnector.getInput("MySubscriber::SampleArrayReader");
let numericInput = numericConnector.getInput("MySubscriber::NumericReader");
let deviceIdentityInput = deviceInfoConnector.getInput("MySubscriber::DeviceIdentityReader");
let deviceConnectivityInput = deviceInfoConnector.getInput("MySubscriber::DeviceConnectivityReader");

sampleArrayConnector.on('on_data_available', onDataAvailableSA);
numericConnector.on('on_data_available', onDataAvailableN);
deviceInfoConnector.on('on_data_available', onDataAvailableInfo);

function onDataAvailableSA() {
	sampleArrayInput.take();

	let identifier;
	console.log('sampleArrayInput length',sampleArrayInput.samples.getLength())
	for (let i = 1; i <= sampleArrayInput.samples.getLength(); i++) {
		if (sampleArrayInput.infos.isValid(i)) {
			let sampleArray = sampleArrayInput.samples.getJSON(i);
			let {
				values,
				frequency,
				metric_id,
				device_time,
				presentation_time,
				unique_device_identifier
			} = sampleArray;
			identifier = unique_device_identifier;

			let formatLength = 120 * Math.ceil(values.length / 120);
			let formatWaveform = interpolateArray(values, formatLength);
			const max = Math.max(...values);
			const min = Math.min(...values);
			const dataHeight = max - min;
			let normalizedWaveform = [];
			for (let i = 0, len = formatWaveform.length; i < len; i++) {
				normalizedWaveform.push(1 - ((formatWaveform[i] - min) / dataHeight));
			}

			if (!devices[unique_device_identifier]) {
				devices[unique_device_identifier] = {};
			}
			if (!devices[unique_device_identifier]['sampleArray']) {
				devices[unique_device_identifier]['sampleArray'] = {};
			}
			if (!devices[unique_device_identifier]['sampleArray'][metric_id]) {
				devices[unique_device_identifier]['sampleArray'][metric_id] = [];
			}
			//devices[unique_device_identifier]['sampleArray'][metric_id].push(normalizedWaveform);
			emitDatatoClient(metric_id, normalizedWaveform);
		}
	}
}

function onDataAvailableN() {
	numericInput.take();

	let identifier;
	console.log('numericInput length',numericInput.samples.getLength())
	for (let i = 1; i <= numericInput.samples.getLength(); i++) {
		if (numericInput.infos.isValid(i)) {
			let numeric = numericInput.samples.getJSON(i);
			let {
				value,
				metric_id,
				device_time,
				presentation_time,
				unique_device_identifier
			} = numeric;
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
					ABPTemplate(value, 'sys');
					break;
				case "MDC_PRESS_BLD_ART_ABP_DIA":
					ABPTemplate(value, 'dia');
					break;
				default:
					emitDatatoClient(metric_id, numericalTemplate(value));
					break;
			}
		}
	}
}

function onDataAvailableInfo() {
	deviceConnectivityInput.take();
	console.log('deviceConnectivityInput length',deviceConnectivityInput.samples.getLength())
	for (let i = 1; i <= deviceConnectivityInput.samples.getLength(); i++) {
		if (deviceConnectivityInput.infos.isValid(i)) {
			let deviceConnectivity = deviceConnectivityInput.samples.getJSON(i);
			let unique_device_identifier = deviceConnectivity.unique_device_identifier;

			if (!devices[unique_device_identifier]) {
				devices[unique_device_identifier] = {};
			}
			if (!devices[unique_device_identifier]['deviceConnectivity']) {
				devices[unique_device_identifier]['deviceConnectivity'] = {};
			}

			delete deviceConnectivity['unique_device_identifier'];
			devices[unique_device_identifier]['deviceConnectivity'] = deviceConnectivity;

			console.log(deviceConnectivity);
			if (deviceConnectivity.state === 4) {
				delete devices[unique_device_identifier];
				// setTimeout(()=>{
				// 	delete devices[unique_device_identifier];
				// }, 1000 * 10);

				console.log('return');
				return;
			}
		}
	}


	deviceIdentityInput.take();
	console.log('deviceIdentity length',deviceIdentityInput.samples.getLength())
	for (let i = 1; i <= deviceIdentityInput.samples.getLength(); i++) {
		if (deviceIdentityInput.infos.isValid(i)) {
			let deviceIdentity = deviceIdentityInput.samples.getJSON(i);
			let unique_device_identifier = deviceIdentity.unique_device_identifier;

			if (!devices[unique_device_identifier]) {
				devices[unique_device_identifier] = {};
			}
			if (!devices[unique_device_identifier]['deviceIdentity']) {
				devices[unique_device_identifier]['deviceIdentity'] = {};
			}

			delete deviceIdentity['unique_device_identifier'];
			devices[unique_device_identifier]['deviceIdentity'] = deviceIdentity;
		}
	}
}

function emitDatatoClient(metric_id, sampleArrayOrNumeric) {
	for (let socketId in _sockets) {
		const socket = _sockets[socketId];
		socket.emit(metric_id, sampleArrayOrNumeric)
	}
}

function numericalTemplate(data) {
	return {
		data: data
	}
}

let ABPTemplate = (function() {
	let ABPFlag = 0;
	let ABP = {
		systolic: null,
		diastolic: null,
		mean: null
	};

	return (data, name) => {
		if (name === "sys") {
			ABP.systolic = data;
			ABPFlag = ABPFlag + 1;
		} else if (name === "dia") {
			ABP.diastolic = data;
			ABPFlag = ABPFlag + 1;
		}

		if (ABPFlag === 2) {
			ABP.mean = Math.round((ABP.systolic + ABP.diastolic * 2) / 3);
			emitDatatoClient("MDC_PRESS_BLD_ART_ABP_NUMERIC", ABP);
			ABPFlag = 0;
		}
	};
})();

console.log("Waiting for data");
server.listen(5000);

app.get('/', function (req, res) {
	res.sendFile(path.join(process.cwd(), '/index.html'));
});