var Authentication = require('../config/auth.js');
var cookieParser = require('cookie-parser');

module.exports = function(app, passport, io, express, sessionStore) {
    var router = express.Router();
    var userSocketMap = {};
    var usernames = [];
    var sessionId

    var lastMessages = [];
    var numMessagesToSave = 5;

    var EXPRESS_SESSION_COOKIE = 'connect.sid';


    /* GET chat page */
    router.get('/',  Authentication.redirectIfNotAuthenticated, function(req, res) {
        console.log("User: " + req.session.passport.user + " has connected to the chat.");
        console.log("Session Id: " + req.session.id);
        console.log(req.user);
        res.locals.sessionId = req.session.id;
        res.render('chat', { title: 'My Simple Chat', user: req.user });

        req.session.lastAccess = new Date().getTime();
    });

    io.use(function(socket, callback) {

        console.log('Performing socketio handshake');
        
        if (socket && socket.handshake && socket.handshake.query && socket.handshake.query.sessionId) {
            var sessionId = socket.handshake.query.sessionId;
            sessionStore.get(sessionId, function(error, session) {
                socket.handshake.sessionId = sessionId;

                if (error) {
                    callback('Could not set session id with socket io authorization handshake!', false);
                } else if (!session) {
                    callback('There was no session found during socket io authorization handshake!', false);
                } 

                socket.session = session;
                callback(null, true);
            });
        } else {
            console.log('No sessionId value was provided in query string to socket io connect from client');
            callback('No sessionId value was provided in query string to socket io connect from client', false);
        }
    });

    io.on('connection', function(socket) {
        console.log("A user has connected to socket.io");

        socket.on('disconnect', function() {
            var username = userSocketMap[socket.id];

            console.log('User ' + '"' + username + '"' + ' has disconnected from the chat');

            index = usernames.indexOf(username);

            if (index >= 0) {
                usernames.splice(index, 1);
            }

            delete userSocketMap[socket.id];

            console.log(usernames);
            console.log(userSocketMap);

            //Broadcast to all active clients that a user just left.
            socket.broadcast.emit('user-left', {'username': username});
        });

        socket.on('init', function(info) {
            if (info && info.hasOwnProperty('username')) {
                userSocketMap[socket.id] = info.username;
                usernames.push(info.username);

                //Send the welcome message and a list of all current users to the new user.
                socket.emit('message', {'user': 'system', 'message': 'Welcome to the chat!'});  
                socket.emit('userlist', usernames);

                //Send the historical list of messages if there are any
                if (lastMessages.length > 0) {
                    var messages = JSON.stringify(lastMessages);
                    socket.emit('messages', messages);
                }   

                //Send the new user to all current clients
                socket.broadcast.emit('user-joined', {'username': info.username}); 
            }
        });

        socket.on('send-message', function(message) {
            console.log('Received message: ' + message.message + ' from user: ' + message.user);

            lastMessages.push(message);

            if (lastMessages.length > numMessagesToSave) {
                lastMessages.shift();
            }

            socket.broadcast.emit('message', message);
            socket.emit('message-sent', {'success': 'true', 'message': message.message});
        });
    });

    return router;
}