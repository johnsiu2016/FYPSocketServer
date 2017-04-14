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

		if (ackCb) {
			ackCb("server: initial success");
		}
	});

	socket.on('disconnect', () => {
		delete _sockets[socket.id]
	});
});


let connector = new rti.Connector("MyParticipantLibrary::Zero", path.join(process.cwd(), "/openice-dds.xml"));
let sampleArrayInput = connector.getInput("MySubscriber::SampleArrayReader");
let numericInput = connector.getInput("MySubscriber::NumericReader");
let deviceIdentityInput = connector.getInput("MySubscriber::DeviceIdentityReader");
let deviceConnectivityInput = connector.getInput("MySubscriber::DeviceConnectivityReader");
let ABPTemplate = ABPTemplateCreator();

connector.on('on_data_available', onDataAvailable);


function onDataAvailable() {
	sampleArrayInput.take();
	numericInput.take();
	deviceIdentityInput.take();
	deviceConnectivityInput.take();

	// console.log("sampleArrayInput",sampleArrayInput.samples.getLength())
	// console.log("numericInput",numericInput.samples.getLength())
	// console.log("sample1", sampleArrayInput.samples.getJSON(1))
	// console.log("sample2", sampleArrayInput.samples.getJSON(2))
	// console.log("sample3", sampleArrayInput.samples.getJSON(3))
	// console.log("sample4", sampleArrayInput.samples.getJSON(4))
	// console.log("sample5", sampleArrayInput.samples.getJSON(5))
	// console.log("sample6", sampleArrayInput.samples.getJSON(6))
	//
	//
	// console.log("numeric1", numericInput.samples.getJSON(1))
	// console.log("numeric2", numericInput.samples.getJSON(2))
	// console.log("numeric3", numericInput.samples.getJSON(3))
	// console.log("numeric4", numericInput.samples.getJSON(4))
	// console.log("numeric5", numericInput.samples.getJSON(5))
	// console.log("numeric6", numericInput.samples.getJSON(6))
	// console.log("numeric7", numericInput.samples.getJSON(7))
	// console.log("numeric8", numericInput.samples.getJSON(8))


	for (let i = 1; i <= sampleArrayInput.samples.getLength(); i++) {
		if (sampleArrayInput.infos.isValid(i)) {
			// console.log("sampleArray", sampleArrayInput.samples.getJSON(i));for (let socketId in _sockets) {
			let sampleArray = sampleArrayInput.samples.getJSON(i);
			let {
				values,
				frequency,
				metric_id,
				device_time,
				presentation_time,
				unique_device_identifier
			} = sampleArray;

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
			if (!devices[unique_device_identifier][metric_id]) {
				devices[unique_device_identifier][metric_id] = [];
			}
			devices[unique_device_identifier][metric_id].push(normalizedWaveform);
		}
	}

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

			if (!devices[unique_device_identifier]) {
				devices[unique_device_identifier] = {};
			}
			if (!devices[unique_device_identifier][metric_id]) {
				devices[unique_device_identifier][metric_id] = [];
			}
			devices[unique_device_identifier][metric_id].push(value);
		}
	}

	console.log('before',devices);

	let deviceData;
	for (let deviceId in devices) {
		deviceData = devices[deviceId];
	}
	for (let metricId in deviceData) {
		const sampleArrayOrNumeric = deviceData[metricId].shift();
		switch (metricId) {
			case "MDC_ECG_LEAD_I":
				emitDatatoClient(metricId, sampleArrayOrNumeric);
				break;
			case "MDC_ECG_LEAD_II":
				emitDatatoClient(metricId, sampleArrayOrNumeric);
				break;
			case "MDC_ECG_LEAD_III":
				emitDatatoClient(metricId, sampleArrayOrNumeric);
				break;
			case "MDC_PRESS_BLD_ART_ABP":
				emitDatatoClient(metricId, sampleArrayOrNumeric);
				break;
			case "MDC_PULS_OXIM_PLETH":
				emitDatatoClient(metricId, sampleArrayOrNumeric);
				break;
			case "MDC_AWAY_CO2":
				emitDatatoClient(metricId, sampleArrayOrNumeric);
				break;

			case "MDC_ECG_HEART_RATE":
				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
				break;
			case "MDC_TTHOR_RESP_RATE":
				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
				break;
			case "MDC_PULS_OXIM_PULS_RATE":
				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
				break;
			case "MDC_PULS_OXIM_SAT_O2":
				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
				break;
			case "MDC_PRESS_BLD_ART_ABP_SYS":
				ABPTemplate(sampleArrayOrNumeric, 'sys');
				break;
			case "MDC_PRESS_BLD_ART_ABP_DIA":
				ABPTemplate(sampleArrayOrNumeric, 'dia');
				break;
			case "MDC_CO2_RESP_RATE":
				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
				break;
			case "MDC_AWAY_CO2_ET":
				emitDatatoClient(metricId, numericalTemplate(sampleArrayOrNumeric));
				break;

		}
	}

	console.log('after',devices);
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

function ABPTemplateCreator() {
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
}


console.log("Waiting for data");
server.listen(5000);

app.get('/', function (req, res) {
	res.sendFile(path.join(process.cwd(), '/index.html'));
});