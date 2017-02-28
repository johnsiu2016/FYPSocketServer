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
                console.log("sampleArray", JSON.stringify(sampleArrayInput.samples.getJSON(i)));
                for (let socketId in _sockets) {
                    let socket = _sockets[socketId];
                    socket.emit("data", JSON.stringify(sampleArrayInput.samples.getJSON(i)));
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