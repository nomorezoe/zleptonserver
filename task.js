"strict mode"

const TaskComfyRender = require("./task_comfy_render");
const TaskComfyInPaint = require("./task_comfy_inpaint");
const TaskComfyUpscale = require("./task_comfy_upscale");
const TaskComfyTweak = require('./task_comfy_tweak');
const SocketManager = require("./socket_manager");
const TaskComfySuperUpscale = require("./task_comfy_superupscale");
const TaskComfyMask = require("./task_comfy_mask");
const TaskComfyChCreator = require("./task_comfy_ch_creator");
const TaskComfyStyleTransfer = require("./task_comfy_style_transfer");
const TaskComfyRenderStyleTransfer = require("./task_comfy_style_transfer_render");
const TaskComfyScribble = require("./task_comfy_scribble");
const TaskComfyScribbleFastUpscale = require("./task_comfy_scribble_fast_upscale");
const TaskComfyScribbleEnhance = require("./task_comfy_scribble_enhance");
const TaskComfyScribbleEnhance4X = require("./task_comfy_scribble_enhance_4x");
const TaskComfyScribbleEnhance8X = require("./task_comfy_scribble_enhance_8x");
const TaskAdvanceStyleTransfer = require("./task_adv_style_transfer");
const TaskComfyGetDescription = require("./task_comfy_get_description");
const Tool = require("./tool");
const PipeAdvanceTweak = require("./pipe_adv_tweak");
const TaskComfyFaceFusion = require("./task_comfy_facefusion");


function Task(type, index, req) {
    this.type = type;
    this.index = index;
    this.req = req;
    this.key = "";
    this.imageFileNames = [];
    this.timer = 0;
    this.pipeline = "";
    this.requestCompletedCount = 0;
    this.dataCompletedCount = 0;
}

Task.prototype = {

    excuteTask: function (queue) {
        this.key = queue.key;
        this.timer = Date.now();
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
            case "superUpscale":
                TaskComfySuperUpscale(this, this.req, queue);
                break;
            case "mask":
                TaskComfyMask(this, this.req, queue);
                break;
            case "chcreator":
                TaskComfyChCreator(this, this.req, queue);
                break;
            case "styletransfer":
                //TaskComfyStyleTransfer(this, this.req, queue);
                TaskAdvanceStyleTransfer(this, Tool.toAdvStyleTransfer(this.req), queue);
                break;
            case "styletransferrender":
                TaskComfyRenderStyleTransfer(this, this.req, queue);
                break;
            case "scribble":
                TaskComfyScribble(this, this.req, queue);
                break;
            case "rt_fast_upscale":
                TaskComfyScribbleFastUpscale(this, this.req, queue);
                break;
            case "rt_enhance":
            case "sp_enhance":
                TaskComfyScribbleEnhance(this, this.req, queue);
                break;
            case "rt_enhance_4x":
                TaskComfyScribbleEnhance4X(this, this.req, queue);
                break;
            case "rt_enhance_8x":
                TaskComfyScribbleEnhance8X(this, this.req, queue);
                break;
            case "adv_styletransfer":
                TaskAdvanceStyleTransfer(this, this.req, queue);
                break;
            case "get_desc":
                TaskComfyGetDescription(this, this.req, queue);
                break;
            case "adv_tweak":
                PipeAdvanceTweak(this, this.req, queue);
                break;
            case "facefusion":
                TaskComfyFaceFusion(this, this.req, queue);
                break;
        }
    },

    getDuration: function () {
        switch (this.type) {
            case "render":
                console.log("render duration" + this.req.body.model);
                switch (this.req.body.model) {
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
            case "superUpscale":
                return 300;
                break;
            case "mask":
                return 30;
                break;
            case "styletransfer":
                return 120;
                break;
            case "chcreator":
                return 120;
                break;
            case "styletransferrender":
                return 240;
                break;
            case "scribble":
                return 10;
                break;
            case "rt_fast_upscale":
                return 20;
                break;
            case "rt_enhance":
            case "sp_enhance":
                return 20;
                break;
            case "rt_enhance_4x":
                return 120;
                break;
            case "rt_enhance_8x":
                return 120;
                break;
            case "adv_styletransfer":
                return 240;
                break;
            case "get_desc":
                return 60;
                break;
            case "adv_tweak":
                return 240;
                break;
            case "facefusion":
                return 240;
                break;
        }
    },

    getDownloadDuration: function () {
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
            case "superUpscale":
                return 120;
                break;
            case "mask":
                return 30;
                break;
            case "styletransfer":
                return 120;
                break;
            case "chcreator":
                return 120;
                break;
            case "styletransferrender":
                return 60;
                break;
            case "scribble":
                return 15;
                break;
            case "rt_fast_upscale":
                return 60;
                break;
            case "rt_enhance":
            case "sp_enhance":
                return 60;
                break;
            case "rt_enhance_4x":
                return 120;
                break;
            case "rt_enhance_8x":
                return 120;
                break;
            case "adv_styletransfer":
                return 240;
                break;
            case "get_desc":
                return 20;
                break;
            case "adv_tweak":
                return 240;
                break;
            case "facefusion":
                return 240;
                break;
        }
    },

    sendCompleteTaskSuccess: function () {
        let socket = SocketManager.getSocketByKey(this.key);
        if (socket) {
            socket.emit("completeDownload", this.id);
            if (this.type == "render") {
                socket.emit("completeRenderTask", this.imageFileNames.join(','));
            }
            else if (this.type == "upscale") {
                socket.emit("completeUpscaleTask", this.imageFileNames.join(','));
            }
            else if (this.type == "tweak") {
                socket.emit("completeTweakTask", this.imageFileNames.join(','));
            }
            else if (this.type == "superUpscale") {
                socket.emit("completeSuperUpscaleTask", this.imageFileNames.join(','));
            }
            else if (this.type == "mask") {
                socket.emit("completeMaskTask", this.imageFileNames.join(','));
            }
            else if (this.type == "chcreator") {
                socket.emit("completeChCreatorTask", this.imageFileNames.join(','));
            }
            else if (this.type == "styletransfer") {
                socket.emit("completeStyleTransferTask", this.imageFileNames.join(','));
            }
            else if (this.type == "adv_styletransfer") {
                socket.emit("completeAdvStyleTransferTask", this.imageFileNames.join(','));
            }
            else if (this.type == "inpaint") {
                socket.emit("completeInpaintTask", this.imageFileNames.join(','));
            }
            else if (this.type == "styletransferrender") {
                socket.emit("completeStyleTransferRender", this.imageFileNames.join(','));
            }
            else if (this.type == "scribble") {
                socket.emit("completeScribble", this.imageFileNames.join(','));
            }
            else if (this.type == "rt_fast_upscale") {
                socket.emit("completeRTFastUpscale", this.imageFileNames.join(','));
            }
            else if (this.type == "rt_enhance") {
                socket.emit("completeRTEnhance", this.imageFileNames.join(','));
            }
            else if (this.type == "rt_enhance_4x") {
                socket.emit("completeRTEnhance4X", this.imageFileNames.join(','));
            }
            else if (this.type == "rt_enhance_8x") {
                socket.emit("completeRTEnhance8X", this.imageFileNames.join(','));
            }
            else if (this.type == "get_desc") {
                socket.emit("completeGetDesc", this.imageFileNames.join(','));
            }
            else if (this.type == "adv_tweak") {
                socket.emit("completeAdvTweak", this.imageFileNames.join(','));
            }
            else if (this.type == "facefusion") {
                socket.emit("completeAdvFaceFusion", this.imageFileNames.join(','));
            }
            else if (this.type == "sp_enhance") {
                socket.emit("completeSPEnhance", this.imageFileNames.join(','));
            }
        }
    },

    sendSocketMsg: function (evt, msg) {
        let socket = SocketManager.getSocketByKey(this.key);
        if (socket) {
            socket.emit(evt, msg);
        }
    },

    sendCompletePipeline: function () {
        let timer = Date.now();
        let socket = SocketManager.getSocketByKey(this.key);
        if (socket) {
            let sendObject = {};
            sendObject.pipeline = this.pipeline;
            sendObject.time = timer - this.timer;
            socket.emit("completePipeline", JSON.stringify(sendObject));
        }
    },

    sendCompleteDownload: function () {
        let socket = SocketManager.getSocketByKey(this.key);
        if (socket) {
            socket.emit("completeDownload", this.id);
        }
    }

}

module.exports = Task;