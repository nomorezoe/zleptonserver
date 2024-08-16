"strict mode"

const Queue = require("./queue");
const SocketManager = require("./socket_manager");

function QueueManager() {
    this.queues = [];
    this.currentQueue = [];
    this.QUEUE_COUNT = 1;
}

QueueManager.prototype.addToQueue = function (queue) {
    if(queue.getPriority() <0){
        this.queues.push(queue);
    }
    else{
        let i = 0;
        for (i = 0; i < this.queues.length; i++) {
            console.log("i:" + i);
            if (this.queues[i].getPriority() < queue.getPriority()) {
                console.log("break;");
                break;
            }
        }
        console.log("insert:" + i);
        this.queues.splice(i, 0, queue);
    }
    console.log("add queue" + this.queues.length);
    this.sendQueueStatus();
}

QueueManager.prototype.addNoRepeatToQueue = function (queue) {

    //remove curernt
    for (let k = 0; k < this.queues.length; k++) {
        if (this.queues[k].key == queue.key) {
            if (this.queues[k].getType() == queue.getType()) {
                this.queues.splice(k, 1);
                break;
            }
        }
    }

    this.addToQueue(queue);
}


QueueManager.prototype.getNextQueue = function () {
    if (this.currentQueue.length >= this.QUEUE_COUNT) {
        return;
    }

    if (this.queues.length <= 0) {
        console.log("0 queue")
        return;
    }

    let seek = 0;

    while (this.currentQueue.length < this.QUEUE_COUNT && seek < this.queues.length) {
        let q = this.queues[seek];
        if (this.canStart(q)) {
            this.queues.splice(seek, 1);
            this.currentQueue.push(q);
            q.excuteQueue();
        }
        else {
            seek++;
        }
    }

    console.log("new queue start" + this.queues.length);
    this.sendQueueStatus();

}

QueueManager.prototype.canStart = function (queue) {
    for (let i = 0; i < this.currentQueue.length; i++) {
        if (queue.key == this.currentQueue[i].key) {
            if (this.formatType(queue.getType()) == this.formatType(this.currentQueue[i].getType())) {
                return false;
            }
        }
    }
    return true;
}

QueueManager.prototype.formatType = function (type) {
    if (type == "styletransferrender") {
        return "render";
    }
    return type;
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

QueueManager.prototype.remainQueueCount = function () {
    return this.queues.length + this.currentQueue.length;
}

QueueManager.instance = new QueueManager();

module.exports = QueueManager;