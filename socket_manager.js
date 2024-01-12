"strict mode"

function SocketManager() {

}

let users = {};
let socketInfos = {};
let io = null;

SocketManager.initialize = function (value) {
    io = value;
}

SocketManager.addSocket = function (key, socket_id) {
    console.log("addSocket" + key +":"+ socket_id);
    users[key] = socket_id;
    socketInfos[socket_id] = key;
}

SocketManager.removeSocket = function (socket_id) {

    console.log("removeSocket" + socket_id);
    let key = socketInfos[socket_id];

    delete users[key];
    delete socketInfos[socket_id];
}

SocketManager.getSocketByKey = function (key) {
    return io.of('/').sockets.get(users[key]);
}

SocketManager.getKeyBySocketId = function (socket_id) {
    return socketInfos[socket_id];
}

module.exports = SocketManager;