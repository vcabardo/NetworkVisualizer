io.on('connection', async (socket) => {

    console.log('a user connected');
    const clients = await io.engine.clientsCount;
   
    const socketid = socket.id;
   
    socketHander = new SocketHander();
   
    socketHander.connect();
   
    const history = await socketHander.getMessages();
   
    io.to(socketid).emit('history', history);
    io.to(socketid).emit('clients', {
     clients: clients,
    });
   
    socket.on("disconnect", () => {
     console.log("a user go out");
     io.emit("clients", {
      clients: clients - 1,
     });
    });
   
    socket.on("message", (obj) => {
     socketHander.storeMessages(obj);
     io.emit("message", obj);
    });
   
    socket.on('clients', (obj) => {
     io.emit("clients", {
      clients: clients,
      user: obj,
     });
    });
   
   });