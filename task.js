"strict mode"

const TaskComfyRender = require("./task_comfy_render");
const TaskComfyInPaint = require("./task_comfy_inpaint");
const TaskComfyUpscale = require("./task_comfy_upscale");
const TaskComfyTweak = require('./task_comfy_tweak');
const SocketManager = require("./socket_manager");

function Task(type, index, req) {
    this.type = type;
    this.index = index;
    this.req = req;
    this.key = "";
    this.imageFileNames = [];
    this.timer = 0;
    this.pipeline = "";
}

Task.prototype = {

    excuteTask: function (queue) {
        this.key = queue.key;
        this.timer  = Date.now();
        this.id = queue.id;
        switch (this.type) {
            case "render":
                //TaskRender(this, this.req, queue);
                this.pipeline = "render_normal";
                TaskComfyRender(this, this.req, queue);
                break;
            case "upscale":
                this.pipeline = "upscale_normal";
                TaskComfyUpscale(this, this.req, queue);
                break;
            case "inpaint":
                this.pipeline = "inpaint_normal";
                TaskComfyInPaint(this, this.req, queue);
                break;
            case "tweak":
                this.pipeline = "tweak";
                TaskComfyTweak(this, this.req, queue);
                break;
        }
    },

    getDuration: function(){
        switch (this.type) {
            case "render":
                console.log("render duration"+this.req.body.model);
                switch(this.req.body.model){
                    case "dynavisionXL":
                    return 240;
                    break;
                case "realism_engine_sdxl":
                    return 240;
                    break;
                case "realistic_vision_v6":
                    return 240;
                    break;
                case "dreamshaper":
                    return 240;
                    break;
                case "Deliberate_v5":
                    return 240;
                    break;
                }
                return 240;
                /*if(this.req.model == ""){
                    return 60;
                }*/
                break;
            case "upscale":
                return 240;
                break;
            case "inpaint":
                return 240;
                break;
            case "tweak":
                return 120;
                break;
        } 
    },

    getDownloadDuration: function(){
        switch (this.type) {
            case "render":
                return 60;
                break;
            case "upscale":
                return 60;
                break;
            case "inpaint":
                return 60;
                break;
            case "tweak":
                return 60;
                break;
        } 
    },

    sendCompleteTaskSuccess: function(){
        let socket =  SocketManager.getSocketByKey(this.key);
        if(socket){
            socket.emit("completeDownload", this.id);
            if(this.type == "render"){
                socket.emit("completeRenderTask", this.imageFileNames.join(','));
            }
            else if(this.type == "upscale"){
                socket.emit("completeUpscaleTask", this.imageFileNames.join(','));
            }
            else if(this.type == "tweak"){
                socket.emit("completeTweakTask", this.imageFileNames.join(','));
            }
            else{
                console.log("here");
                socket.emit("completeInpaintTask", this.imageFileNames.join(','));
            }
        }
    },

    sendSocketMsg: function(evt, msg){
        let socket =  SocketManager.getSocketByKey(this.key);
        if(socket){
            socket.emit(evt, msg);
        }
    },

    sendCompletePipeline: function(){
       let timer = Date.now();
        let socket =  SocketManager.getSocketByKey(this.key);
        if(socket){
            let sendObject  = {};
            sendObject.pipeline = this.pipeline;
            sendObject.time  =  timer - this.timer;
            socket.emit("completePipeline", JSON.stringify(sendObject));
        }
    },

    sendCompleteDownload: function(){
        let socket =  SocketManager.getSocketByKey(this.key);
        if(socket){
            socket.emit("completeDownload", this.id);
        }
    }

}

module.exports = Task;