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

// let zeroConnector = new rti.Connector("MyParticipantLibrary::Zero", path.join(process.cwd(), "/openice-dds.xml"));
// let zeroSampleArrayInput = zeroConnector.getInput("MySubscriber::SampleArrayReader");
// let zeroNumericInput = zeroConnector.getInput("MySubscriber::NumericReader");
// zeroConnector.on('on_data_available', onDataAvailable);

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




// function onDataAvailable() {
// 	zeroSampleArrayInput.take();
// 	zeroNumericInput.take();
// 	//deviceIdentityInput.take();
// 	//deviceConnectivityInput.take();
//
// 	// console.log("sampleArrayInput",sampleArrayInput.samples.getLength())
// 	// console.log("numericInput",numericInput.samples.getLength())
// 	// console.log("sample1", sampleArrayInput.samples.getJSON(1))
// 	// console.log("sample2", sampleArrayInput.samples.getJSON(2))
// 	// console.log("sample3", sampleArrayInput.samples.getJSON(3))
// 	// console.log("sample4", sampleArrayInput.samples.getJSON(4))
// 	// console.log("sample5", sampleArrayInput.samples.getJSON(5))
// 	// console.log("sample6", sampleArrayInput.samples.getJSON(6))
// 	//
// 	//
// 	// console.log("numeric1", numericInput.samples.getJSON(1))
// 	// console.log("numeric2", numericInput.samples.getJSON(2))
// 	// console.log("numeric3", numericInput.samples.getJSON(3))
// 	// console.log("numeric4", numericInput.samples.getJSON(4))
// 	// console.log("numeric5", numericInput.samples.getJSON(5))
// 	// console.log("numeric6", numericInput.samples.getJSON(6))
// 	// console.log("numeric7", numericInput.samples.getJSON(7))
// 	// console.log("numeric8", numericInput.samples.getJSON(8))
//
//
// 	console.log('sampleArrayInput length',zeroSampleArrayInput.samples.getLength())
// 	for (let i = 1; i <= zeroSampleArrayInput.samples.getLength(); i++) {
// 		if (zeroSampleArrayInput.infos.isValid(i)) {
// 			// console.log("sampleArray", sampleArrayInput.samples.getJSON(i));for (let socketId in _sockets) {
// 			let sampleArray = zeroSampleArrayInput.samples.getJSON(i);
// 			let {
// 				values,
// 				frequency,
// 				metric_id,
// 				device_time,
// 				presentation_time,
// 				unique_device_identifier
// 			} = sampleArray;
//
// 			let formatLength = 120 * Math.ceil(values.length / 120);
// 			let formatWaveform = interpolateArray(values, formatLength);
// 			const max = Math.max(...values);
// 			const min = Math.min(...values);
// 			const dataHeight = max - min;
// 			let normalizedWaveform = [];
// 			for (let i = 0, len = formatWaveform.length; i < len; i++) {
// 				normalizedWaveform.push(1 - ((formatWaveform[i] - min) / dataHeight));
// 			}
//
//
// 			if (!devices[unique_device_identifier]) {
// 				devices[unique_device_identifier] = {};
// 			}
// 			if (!devices[unique_device_identifier][metric_id]) {
// 				devices[unique_device_identifier][metric_id] = [];
// 			}
// 			devices[unique_device_identifier][metric_id].push(normalizedWaveform);
// 		}
// 	}
//
// 	console.log('numericInput length',zeroNumericInput.samples.getLength())
// 	for (let i = 1; i <= zeroNumericInput.samples.getLength(); i++) {
// 		if (zeroNumericInput.infos.isValid(i)) {
// 			let numeric = zeroNumericInput.samples.getJSON(i);
// 			let {
// 				value,
// 				metric_id,
// 				device_time,
// 				presentation_time,
// 				unique_device_identifier
// 			} = numeric;
//
// 			if (!devices[unique_device_identifier]) {
// 				devices[unique_device_identifier] = {};
// 			}
// 			if (!devices[unique_device_identifier][metric_id]) {
// 				devices[unique_device_identifier][metric_id] = [];
// 			}
// 			devices[unique_device_identifier][metric_id].push(value);
// 		}
// 	}
//
//
// 	// console.log('deviceIdentity length',deviceIdentityInput.samples.getLength())
// 	// for (let i = 1; i <= deviceIdentityInput.samples.getLength(); i++) {
// 	// 	if (deviceIdentityInput.infos.isValid(i)) {
// 	// 		let deviceIdentity = deviceIdentityInput.samples.getJSON(i);
// 	//
// 	// 		console.log(i);
// 	// 		console.log('deviceIdentity', deviceIdentity);
// 	// 	}
// 	// }
// 	//
// 	// console.log('deviceConnectivityInput length',deviceConnectivityInput.samples.getLength())
// 	// for (let i = 1; i <= deviceConnectivityInput.samples.getLength(); i++) {
// 	// 	if (deviceConnectivityInput.infos.isValid(i)) {
// 	// 		let deviceConnectivity = deviceConnectivityInput.samples.getJSON(i);
// 	//
// 	// 		console.log(i);
// 	// 		console.log('deviceConnectivity', deviceConnectivity);
// 	// 	}
// 	// }
//
// 	//console.log('before',devices);
//
// 	let deviceData;
// 	for (let deviceId in devices) {
// 		deviceData = devices[deviceId];
// 	}
// 	for (let metricId in deviceData) {
// 		const sampleArrayOrNumeric = deviceData[metricId].shift();
// 		switch (metricId) {
// 			case "MDC_ECG_LEAD_I":
// 				emitDatatoClient(metricId, sampleArrayOrNumeric);
// 				break;
// 			case "MDC_ECG_LEAD_II":
// 				emitDatatoClient(metricId, sampleArrayOrNumeric);
// 				break;
// 			case "MDC_ECG_LEAD_III":
// 				emitDatatoClient(metricId, sampleArrayOrNumeric);
// 				break;
// 			case "MDC_PRESS_BLD_ART_ABP":
// 				emitDatatoClient(metricId, sampleArrayOrNumeric);
// 				break;
// 			case "MDC_PULS_OXIM_PLETH":
// 				emitDatatoClient(metricId, sampleArrayOrNumeric);
// 				break;
// 			case "MDC_AWAY_CO2":
// 				emitDatatoClient(metricId, sampleArrayOrNumeric);
// 				break;
//
// 			case "MDC_ECG_HEART_RATE":
// 				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
// 				break;
// 			case "MDC_TTHOR_RESP_RATE":
// 				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
// 				break;
// 			case "MDC_PULS_OXIM_PULS_RATE":
// 				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
// 				break;
// 			case "MDC_PULS_OXIM_SAT_O2":
// 				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
// 				break;
// 			case "MDC_PRESS_BLD_ART_ABP_SYS":
// 				ABPTemplate(sampleArrayOrNumeric, 'sys');
// 				break;
// 			case "MDC_PRESS_BLD_ART_ABP_DIA":
// 				ABPTemplate(sampleArrayOrNumeric, 'dia');
// 				break;
// 			case "MDC_CO2_RESP_RATE":
// 				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
// 				break;
// 			case "MDC_AWAY_CO2_ET":
// 				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
// 				break;
//
// 		}
// 	}
//
// 	//console.log('after',devices);
// }

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