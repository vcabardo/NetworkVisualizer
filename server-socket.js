var app = require('express')();

var server = require('http').Server(app);

var io = require('socket.io')(server);
server.listen(8001);
const io = require("socket.io");
io.on('connection', function (socket) {
  var clients = socket.client.conn.emit.length;
  console.log( socket.client.conn.server.clientsCount + " users connected" );
  console.log("clients: " + clients);
});



