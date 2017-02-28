let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);

let _sockets = {};

io.on('connection', function (socket) {
    socket.on('initial', function (data, ackCb) {
        _sockets[socket.id] = socket;
        ackCb("initial success")
    });

    socket.on('disconnect', () => {
        delete _sockets[socket.id]
    });
});

const rti   = require('rticonnextdds-connector');
const connector = new rti.Connector("MyParticipantLibrary::Zero", __dirname + "/openice-dds.xml");
const sampleArrayInput = connector.getInput("MySubscriber::SampleArrayReader");
const numericInput = connector.getInput("MySubscriber::NumericReader");

connector.on('on_data_available',
    function() {
        sampleArrayInput.read();
        numericInput.read();
        for (let i=1; i <= sampleArrayInput.samples.getLength(); i++) {
            if (sampleArrayInput.infos.isValid(i)) {
                // console.log("sampleArray", sampleArrayInput.samples.getJSON(i));
                for (let socketId in _sockets) {
                    let socket = _sockets[socketId];
                    let sampleArray = sampleArrayInput.samples.getJSON(i);
                    let {values,
                        frequency,
                        metric_id,
                        device_time,
                        presentation_time} = sampleArray;

                    if (metric_id === "MDC_ECG_LEAD_II") {
                        const date = new Date(device_time.sec*1000);
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
                        socket.emit("data", JSON.stringify(outputData));
                    }
                }
            }
        }

        // for (let i=1; i <= numericInput.samples.getLength(); i++) {
        //     if (numericInput.infos.isValid(i)) {
        //         console.log("Numeric", JSON.stringify(numericInput.samples.getJSON(i)));
        //     }
        // }

    });

console.log("Waiting for data");
server.listen(5000);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});