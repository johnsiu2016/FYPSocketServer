let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);
const path = require('path');
import {interpolateArray} from '../utils/utilityFunctions';

let _sockets = {};
let _waveformItems = {};

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

let data = [];

connector.on('on_data_available',
    function () {
        sampleArrayInput.read();
        numericInput.read();
        for (let i = 1; i <= sampleArrayInput.samples.getLength(); i++) {
            if (sampleArrayInput.infos.isValid(i)) {
                // console.log("sampleArray", sampleArrayInput.samples.getJSON(i));for (let socketId in _sockets) {
                let sampleArray = sampleArrayInput.samples.getJSON(i);
                let {
                    values,
                    frequency,
                    metric_id,
                    device_time,
                    presentation_time
                } = sampleArray;

                if (metric_id === "MDC_ECG_LEAD_II") {
                    const date = new Date(device_time.sec * 1000);
                    const hours = date.getHours();
                    const minutes = "0" + date.getMinutes();
                    const seconds = "0" + date.getSeconds();
                    const formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

                    const outputData = {
                        metric_id,
                        length: values.length,
                        values,
                        frequency,
                        formattedTime
                    };

                    let formatLength = 120 * Math.ceil(values.length / 120);
                    let formatWaveform = interpolateArray(values, formatLength);
                    const max = Math.min(...values);
                    const min = Math.max(...values);
                    const dataHeight = max - min;
                    let normalizedWaveform = [];

                    for (let i=0, len=formatWaveform.length; i<len; i++) {
                        normalizedWaveform.push((formatWaveform[i] - min) / dataHeight);
                    }

                    data.push(normalizedWaveform);
                }
            }
        }

        // for (let i=1; i <= numericInput.samples.getLength(); i++) {
        //     if (numericInput.infos.isValid(i)) {
        //         console.log("Numeric", JSON.stringify(numericInput.samples.getJSON(i)));
        //     }
        // }

    });

let intervalId = setInterval(() => {
    for (let socketId in _sockets) {
        const socket = _sockets[socketId];
        const waveformItems = _waveformItems[socketId];
        const outputData = data.shift();
        console.log(data);
        console.log(outputData);
        for (let key in waveformItems) {
            socket.emit(key, outputData);
        }
    }
}, 1000);

console.log("Waiting for data");
server.listen(5000);

app.get('/', function (req, res) {
    res.sendFile(path.join(process.cwd(), '/index.html'));
});