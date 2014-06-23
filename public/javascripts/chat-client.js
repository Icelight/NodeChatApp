var socket = io();

function addMessage(message, cssClass) {
    var chatbox = $('#chatbox');
    chatbox.append('<p class="' + cssClass + '">' + message + '</p>');
    chatbox.scrollTop = chatbox.scrollHeight;
}

$(document).ready(function() {
    socket.emit('init', 'init');

    socket.on('message', function(message) {
        console.log(message);

        addMessage(message.message, 'ext-message');
    });

    socket.on('message-sent', function(result) {
        if (result.success) {
            addMessage(result.message, 'my-message');
        }
    })

    $('#chatForm').submit(function(e) {
        e.preventDefault();

        var message = $('#messageInput').val();

        if (message && message.length > 0) {
            socket.emit('message', {'user': 'testuser', 'message': message});
        }
    });
});


