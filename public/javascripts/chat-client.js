var socket = io();

function addMessage(parent, message, cssClass, autoScroll) {
    parent.append('<p class="' + cssClass + '">' + message + '</p>');

    if (autoScroll) {
        chatbox.scrollTop = chatbox.scrollHeight;
    }
}

$(document).ready(function() {
    var chatbox = $('#chatbox');
    var userbox = $('#userContainer');

    socket.emit('init', {'username': 'test-user'});

    socket.on('message', function(message) {
        console.log(message);

        addMessage(chatbox, message.message, 'ext-message', true);
    });

    socket.on('message-sent', function(result) {
        if (result.success) {
            addMessage(chatbox, result.message, 'my-message', true);
        }
    });

    socket.on('userlist', function(userlist) {
        console.log("Recieved user list: ");
        console.log(userlist);

        for (var key in userlist) {
            if (userlist.hasOwnProperty(key)){
                addMessage(userbox, userlist[key], '', false);
            }
        }
    });

    $('#chatForm').submit(function(e) {
        e.preventDefault();

        var message = $('#messageInput').val();

        if (message && message.length > 0) {
            $('#messageInput').val("");
            socket.emit('message', {'user': 'testuser', 'message': message});
        }
    });
});


