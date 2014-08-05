function addMessage(parent, message, cssClass, autoScroll) {
    parent.append('<p class="' + cssClass + '">' + message + '</p>');

    if (autoScroll) {
        chatbox.scrollTop = chatbox.scrollHeight;
    }
}

function clearUsers() {
    $('#userContainer').empty();
}

function getMessageClass(message) {
    return message.user === 'system' ? 'sys-message' : 'ext-message';
}

function removeUser(userElement, username) {
    $('#' + userElement.id + '>p:contains("username"').remove();
}

$(document).ready(function() {
    var chatbox = $('#chatbox');
    var userbox = $('#userContainer');
    var sessionid = $('#sessionid').val();

    var socket = io.connect('http://localhost?sessionId=' + sessionid);

    socket.emit('join');

    socket.on('message', function(message) {
        addMessage(chatbox, message.message, getMessageClass(message), true);
    });

    socket.on('messages', function(messages) {
        var parsedMessages = JSON.parse(messages);

        for (i = 0; i < parsedMessages.length; i++) {
            addMessage(chatbox, parsedMessages[i].message, getMessageClass(parsedMessages[i]), true);
        }
    });

    socket.on('message-sent', function(result) {
        if (result.success) {
            addMessage(chatbox, result.message, 'my-message', true);
        }
    });

    socket.on('userlist', function(userlist) {
        console.log("Recieved user list: ");
        console.log(userlist);

        clearUsers();

        for (i = 0; i < userlist.length; i++) {
            addMessage(userbox, userlist[i], 'username', false);
        }
    });

    socket.on('user-joined', function(user) {
        addMessage(userbox, user.username, 'username', false);
        addMessage(chatbox, user.username + ' has joined the chat', 'sys-message', true);
    });

    socket.on('user-left', function(user) {
        removeUser(userbox, user.username);
        addMessage(chatbox, user.username + ' has left the chat', 'sys-message', true);
    });

    $('#chatForm').submit(function(e) {
        e.preventDefault();

        var message = $('#messageInput').val();

        if (message && message.length > 0) {
            $('#messageInput').val("");
            socket.emit('send-message', {'user': 'testuser', 'message': message});
        }
    });
});


