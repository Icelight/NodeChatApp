var socket = io();

$(document).ready(function() {
    socket.emit('init', 'init');

    socket.on('message', function(message) {
        console.log(message);

        $('#chatbox').append('<p>' + message.message + '</p>');
    });

    $('#chatForm').submit(function(e) {
        e.preventDefault();

        var message = $('#messageInput').val();

        if (message && message.length > 0) {
            socket.emit('message', {'user': 'testuser', 'message': message});
        }
    });
});


