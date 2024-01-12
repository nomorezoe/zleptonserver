"strict mode"

const TaskRender = require('./task_render');
const TaskUpscale = require('./task_upscale');
const TaskInpaint = require('./task_inpaint');

function Task(type, req) {
    this.type = type;
    this.req = req;
    this.imageFileName = "";
}

Task.prototype = {

    excuteTask: function (queue) {
        switch (this.type) {
            case "render":
                TaskRender(this, this.req, queue);
                break;
            case "upscale":
                TaskUpscale(this, this.req, queue);
                break;
            case "inpaint":
                TaskInpaint(this, this.req, queue);
                break;
        }
    },

    getDuration: function(){
        switch (this.type) {
            case "render":
                return 60;
                /*if(this.req.model == ""){
                    return 60;
                }*/
                break;
            case "upscale":
                return 30;
                break;
            case "inpaint":
                return 60;
                break;
        } 
    }

}

module.exports = Task;