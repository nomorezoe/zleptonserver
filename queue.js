"strict mode"

const QueueManager = require("./queue_manager");
const SocketManager = require("./socket_manager");

function Queue(sessionkey) {
    this.key = sessionkey;
    this.tasks = [];
    this.currentTask = null;
    this.timer = 0;
}

Queue.prototype = {
    excuteQueue: function () {
        this.estimateTaskDuration = this.tasks[0].getDuration();
        this.totalTasks = this.tasks.length;

        this.sendStartQueue();
        this.nextTask();
    },

    nextTask: function () {

        if (this.currentTask != null) {
            return;
        }

        if (this.tasks.length == 0) {
            this._sendCompleteQueueFailed();
            QueueManager.instance.completeAQueue(this);
            return;
        }
        
        this.timer = Date.now();
        this.currentTask = this.tasks.splice(0, 1)[0];
        this.currentTask.excuteTask(this);
        console.log("remainTask" + this.tasks.length);

        this.sendTaskStatus();
    },

    completeTask: function () {
        console.log("completeTask");

        /*if(this.currentTask){
            let time = Date.now() - this.timer;
            console.log("Task takes "  + time);
            this._sendCompleteTaskSuccess(this.currentTask);
        }*/
        this.currentTask = null;
        this.nextTask();
    },

    sendStartQueue: function(){
        let socket =  SocketManager.getSocketByKey(this.key);
        if(socket){
            console.log('emit startQueue' + socket.id);
            socket.emit("startQueue");
        }
    },

    sendTaskStatus: function () {
        var sendObject = {};
        sendObject.totalTasks = this.totalTasks;
        sendObject.remainTasks = this.tasks.length;
        sendObject.duration = this.estimateTaskDuration;

        let socket =  SocketManager.getSocketByKey(this.key);
        if(socket){
            console.log('emit progressQueue' + socket.id);
            socket.emit("progressQueue",JSON.stringify(sendObject));
        }
    },


    _sendCompleteQueueFailed: function(){
        let socket =  SocketManager.getSocketByKey(this.key);
        if(socket){
            console.log('emit completeQueue' + socket.id);
            socket.emit("completeQueue");
        }
    },
}

module.exports = Queue;