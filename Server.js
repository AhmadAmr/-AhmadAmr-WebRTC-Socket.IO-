const console = require('console');
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
var port  = 8080;

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('index')
})

io.sockets.on('connection',  (socket) => {

    socket.on('message', (message,roomId) => {
        socket.to(roomId).emit('message', message);
    });
    
    socket.on('createOrJoin', (room) => {
        
         let clientsInRoom = io.of("/").adapter.rooms.get(room);
         let numClients = clientsInRoom ? clientsInRoom.size : 0;
         console.log(numClients);
        if (numClients === 0) {
          socket.join(room);
          io.sockets.in(room).emit('join', room);
    
        } else if (numClients === 1) {
          socket.join(room);
          socket.emit('joined', room, socket.id);
          io.sockets.in(room).emit('ready');
        } 
        else 
        { 
          socket.emit('full', room);
        }
      });
});

server.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});