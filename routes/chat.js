module.exports = function(io, express) {
    var router = express.Router();
    var userSocketMap = {};

    /* GET chat page */
    router.get('/', function(req, res) {
      res.render('chat', { title: 'My Simple Chat' });
    });

    io.on('connection', function(socket) {
        console.log("A user has connected to socket.io");

        socket.on('disconnect', function() {
            console.log('A user has disconnected from socket.io');
            delete userSocketMap[socket.id];
        });

        socket.on('init', function(info) {
            if (info && info.hasOwnProperty('username')) {
                userSocketMap[socket.id] = info.username;
                socket.emit('message', {'user': 'system', 'message': 'Welcome to the chat!'});  
                socket.emit('userlist', userSocketMap); 

                console.log("Current user list is: " + userSocketMap); 
            }
            
        });

        socket.on('message', function(message) {
            console.log('Received message: ' + message.message + ' from user: ' + message.user);

            socket.broadcast.emit('message', message);
            socket.emit('message-sent', {'success': 'true', 'message': message.message});
        });
    });

    return router;
}