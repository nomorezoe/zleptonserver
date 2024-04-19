"strict mode"

const SocketManager = require("./socket_manager");

function QueueManager() {
    this.queues = [];
    this.currentQueue = [];
    this.QUEUE_COUNT = 1;
}


QueueManager.prototype.addToQueue = function (queue) {
    this.queues.push(queue);
    console.log("add queue" + this.queues.length);
    this.sendQueueStatus();
}

QueueManager.prototype.addMaskToQueue = function (queue) {
    this.queues =  [queue].concat(this.queues);
    console.log("add queue" + this.queues.length);
    this.sendQueueStatus();
}

QueueManager.prototype.getNextQueue = function () {
    if (this.currentQueue.length >= this.QUEUE_COUNT) {
        return;
    }

    if (this.queues.length <= 0) {
        console.log("0 queue")
        return;
    }

    while (this.currentQueue.length < this.QUEUE_COUNT && this.queues.length > 0) {
        let q = this.queues.splice(0, 1)[0];
        this.currentQueue.push(q);
        q.excuteQueue();
    }

    console.log("new queue start" + this.queues.length);
    this.sendQueueStatus();

}

QueueManager.prototype.completeAQueue = function (queue) {
    let index = this.currentQueue.indexOf(queue);
    if (index >= 0) {
        console.log("completeAQueue" + index);
        this.currentQueue.splice(index, 1);
    }
    console.log("completeQueue" + index);
    this.getNextQueue();
}

QueueManager.prototype.handleLeaveFromQueue = function (key) {
    for (var i = 0; i < this.queues.length; i++) {
        if (this.queues[i].key == key) {
            this.queues.splice(i, 1);
            console.log("handleLeaveFromQueue" + key);
            i--;
        }
    }
}

QueueManager.prototype.sendQueueStatus = function () {
    for (var i = 0; i < this.queues.length; i++) {
        let socket = SocketManager.getSocketByKey(this.queues[i].key);
        if (socket) {
            console.log('emit updateQueue' + socket.id);
            socket.emit("updateQueue", i + this.currentQueue.length);
        }
    }
}

QueueManager.prototype.remainQueueCount = function(){
    return this.queues.length + this.currentQueue.length;
}

QueueManager.instance = new QueueManager();

module.exports = QueueManager;