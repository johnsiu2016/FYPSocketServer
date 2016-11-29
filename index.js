let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);

server.listen(5000);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    socket.on('initial', function (data) {
        socket.emit('initialAck');
        console.log(data);
    });
});