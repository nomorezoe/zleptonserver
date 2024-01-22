"strict mode"

const TaskComfyRender = require("./task_comfy_render");
const TaskComfyInPaint = require("./task_comfy_inpaint");
const TaskComfyUpscale = require("./task_comfy_upscale");


function Task(type, req) {
    this.type = type;
    this.req = req;
    this.imageFileNames = [];
}

Task.prototype = {

    excuteTask: function (queue) {
        switch (this.type) {
            case "render":
                //TaskRender(this, this.req, queue);
                TaskComfyRender(this, this.req, queue);
                break;
            case "upscale":
                TaskComfyUpscale(this, this.req, queue);
                break;
            case "inpaint":
                TaskComfyInPaint(this, this.req, queue);
                break;
        }
    },

    getDuration: function(){
        switch (this.type) {
            case "render":
                console.log("render duration"+this.req.body.model);
                switch(this.req.body.model){
                    case "dynavisionXL":
                    return 150;
                    break;
                case "realism_engine_sdxl":
                    return 150;
                    break;
                case "realistic_vision_v6":
                    return 150;
                    break;
                case "dreamshaper":
                    return 150;
                    break;
                case "Deliberate_v5":
                    return 150;
                    break;
                }
                return 150;
                /*if(this.req.model == ""){
                    return 60;
                }*/
                break;
            case "upscale":
                return 90;
                break;
            case "inpaint":
                return 120;
                break;
        } 
    }

}

module.exports = Task;