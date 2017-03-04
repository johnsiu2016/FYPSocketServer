let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);
const path = require('path');
import {interpolateArray} from '../utils/utilityFunctions';
import throttle from 'lodash/throttle';

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

const rti = require('rticonnextdds-connector');
const connector = new rti.Connector("MyParticipantLibrary::Zero", path.join(process.cwd(), "/openice-dds.xml"));
const sampleArrayInput = connector.getInput("MySubscriber::SampleArrayReader");
const numericInput = connector.getInput("MySubscriber::NumericReader");

function onDataAvailable() {
    sampleArrayInput.read();
    numericInput.read();

    // console.log("sampleArrayInput",sampleArrayInput.samples.getLength())
    // console.log("numericInput",numericInput.samples.getLength())
    // console.log("sample1", sampleArrayInput.samples.getJSON(1))
    // console.log("sample2", sampleArrayInput.samples.getJSON(2))
    // console.log("sample3", sampleArrayInput.samples.getJSON(3))
    // console.log("sample4", sampleArrayInput.samples.getJSON(4))
    // console.log("sample5", sampleArrayInput.samples.getJSON(5))
    // console.log("sample6", sampleArrayInput.samples.getJSON(6))
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
            const date = new Date(device_time.sec * 1000);
            const hours = date.getHours();
            const minutes = "0" + date.getMinutes();
            const seconds = "0" + date.getSeconds();
            const formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

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
        let numeric = numericInput.samples.getJSON(i);
        let {
            value,
            metric_id,
            device_time,
            presentation_time,
            unique_device_identifier
        } = numeric;
        const date = new Date(device_time.sec * 1000);
        const hours = date.getHours();
        const minutes = "0" + date.getMinutes();
        const seconds = "0" + date.getSeconds();
        const formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);


        if (!devices[unique_device_identifier]) {
            devices[unique_device_identifier] = {};
        }
        if (!devices[unique_device_identifier][metric_id]) {
            devices[unique_device_identifier][metric_id] = [];
        }
        devices[unique_device_identifier][metric_id].push(value);

        console.log(devices)
    }
}
const throttled = throttle(onDataAvailable, 10);
connector.on('on_data_available', throttled);

let intervalId = setInterval(() => {
    let deviceData = null;
    for (let deviceId in devices) {
        deviceData = devices[deviceId];
    }

    let ABP = {
        systolic: null,
        diastolic: null,
        mean: null
    };
    let data = {
        data: null
    };
    let ABPFlag = 0;
    for (let metricId in deviceData) {
        const sampleArrayOrNumeric = deviceData[metricId].shift();
        data.data = sampleArrayOrNumeric;
        switch (metricId) {
            case "MDC_ECG_LEAD_I":
                emitDatatoClient("MDC_ECG_LEAD_I", sampleArrayOrNumeric);
                break;
            case "MDC_ECG_LEAD_II":
                emitDatatoClient("MDC_ECG_LEAD_II", sampleArrayOrNumeric);
                break;
            case "MDC_ECG_LEAD_III":
                emitDatatoClient("MDC_ECG_LEAD_III", sampleArrayOrNumeric);
                break;
            case "MDC_PRESS_BLD_ART_ABP":
                emitDatatoClient("MDC_PRESS_BLD_ART_ABP", sampleArrayOrNumeric);
                break;
            case "MDC_PULS_OXIM_PLETH":
                emitDatatoClient("MDC_PULS_OXIM_PLETH", sampleArrayOrNumeric);
                break;
            case "MDC_AWAY_CO2":
                emitDatatoClient("MDC_AWAY_CO2", sampleArrayOrNumeric);
                break;

            case "MDC_ECG_HEART_RATE":
                emitDatatoClient("MDC_ECG_HEART_RATE", data);
                break;
            case "MDC_TTHOR_RESP_RATE":
                emitDatatoClient("MDC_TTHOR_RESP_RATE", data);
                break;
            case "MDC_PULS_OXIM_PULS_RATE":
                emitDatatoClient("MDC_PULS_OXIM_PULS_RATE", data);
                break;
            case "MDC_PULS_OXIM_SAT_O2":
                emitDatatoClient("MDC_PULS_OXIM_SAT_O2", data);
                break;
            case "MDC_PRESS_BLD_ART_ABP_SYS":
                ABP.systolic = sampleArrayOrNumeric;
                ABPFlag = ABPFlag + 1;

                if (ABPFlag === 2) {
                    ABP.mean = Math.round((ABP.systolic + ABP.diastolic * 2) / 3);
                    emitDatatoClient("MDC_PRESS_BLD_ART_ABP_NUMERIC", ABP);
                    ABPFlag = 0;
                }

                break;
            case "MDC_PRESS_BLD_ART_ABP_DIA":
                ABP.diastolic = sampleArrayOrNumeric;
                ABPFlag = ABPFlag + 1;

                if (ABPFlag === 2) {
                    ABP.mean = Math.round((ABP.systolic + ABP.diastolic * 2) / 3);
                    emitDatatoClient("MDC_PRESS_BLD_ART_ABP_NUMERIC", ABP);
                    ABPFlag = 0;
                }
                break;
            case "MDC_CO2_RESP_RATE":
                emitDatatoClient("MDC_CO2_RESP_RATE", data);
                break;
            case "MDC_AWAY_CO2_ET":
                emitDatatoClient("MDC_AWAY_CO2_ET", data);
                break;

        }
    }
}, 100);

function emitDatatoClient(metric_id, sampleArrayOrNumeric) {
    for (let socketId in _sockets) {
        const socket = _sockets[socketId];
        socket.emit(metric_id, sampleArrayOrNumeric)
    }
}


console.log("Waiting for data");
server.listen(5000);

app.get('/', function (req, res) {
    res.sendFile(path.join(process.cwd(), '/index.html'));
});