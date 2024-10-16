"strict mode"

const QueueManager = require("./queue_manager");
const SocketManager = require("./socket_manager");
const { v4: uuidv4 } = require('uuid');

function Queue(sessionkey) {
    this.key = sessionkey;
    this.tasks = [];
    this.currentTask = null;
    this.id = uuidv4();
    this.priority = -1;
}

Queue.prototype = {
    setPriority: function (value){
        this.priority = value;
    },

    getPriority : function(){
        return this.priority;
    },

    getType: function(){
        if(this.currentTask != null){
            return this.currentTask.type;
        }

        if(this.tasks.length >0){
            return this.tasks[0].type;
        }
        return null;
    },
    
    excuteQueue: function () {
        this.estimateTaskDuration = this.tasks[0].getDuration();
        this.downloadDuration = this.tasks[0].getDownloadDuration();
        this.totalTasks = this.tasks.length;

        this.sendStartQueue();
        this.nextTask();
    },

    nextTask: function () {

        if (this.currentTask != null) {
            return;
        }

        if (this.tasks.length == 0) {
            this._sendCompleteQueue();
            QueueManager.instance.completeAQueue(this);
            return;
        }
        

        this.currentTask = this.tasks.splice(0, 1)[0];
        try{
            this.currentTask.excuteTask(this);
            console.log("remainTask" + this.tasks.length);
        }
        catch(e){
            console.log("error:" + e);
            this.completeTaskFailed();
        }
       

        //this.sendTaskStatus();
    },

    completeTask: function () {
        console.log("completeTask");
        this.currentTask.sendCompletePipeline();
        
        this.currentTask = null;
        this.nextTask();
    },

    completeTaskFailed: function(){
        console.log("completeTaskFailed");
        this.currentTask.sendCompletePipeline();
        this.currentTask.sendCompleteDownload();
        
        this.currentTask = null;
        this.nextTask();


    },

    sendStartQueue: function(){
        var sendObject = {};
        sendObject.duration = this.estimateTaskDuration;
        sendObject.downloadDuration = this.downloadDuration;
        sendObject.id = this.id;
        sendObject.type = this.tasks[0].type;

        let socket =  SocketManager.getSocketByKey(this.key);
        if(socket){
            console.log('emit startQueue' + socket.id);
            socket.emit("startQueue", JSON.stringify(sendObject));
        }
    },

    _sendCompleteQueue: function(){
        let socket =  SocketManager.getSocketByKey(this.key);
        if(socket){
            console.log('emit completeQueue' + socket.id);
            socket.emit("completeQueue",  this.id);
        }
    },
}

module.exports = Queue;