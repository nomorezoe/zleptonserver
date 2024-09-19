"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');
const Upscale4X = require('./pipe_upsale_4x');
const PipeAdvancePhotoRealismUpscale = require("./pipe_adv_photo_realism_upscale");
const PipeAdvanceDSLRUpscale = require("./pipe_adv_photo_dslr_upscale");
const PipeAdvanceLooseColorUpscale = require('./pipe_adv_loose_color_upscale');
const PipeAdvanceBWLooseUpscale = require('./pipe_adv_bw_loose_color_upscale');
const PipeAdvanceEpicRealUpscale = require("./pipe_adv_epic_real_upscale");
const PipeIllustrationComicUpscale = require("./pipe_illustration_coimic_upscale")
const PipeFluxUpscale = require("./pipe_flux_upscale");
function TaskComfyUpscale(task, req, queue) {

    var session = req.body.session;
    var denoise = req.body.denoise;
    var cfg = parseFloat(req.body.cfg);
    var samplingsteps = parseInt(req.body.samplingsteps);
    var sampler = req.body.sampler;
    var scheduler = req.body.scheduler;
    var upscaleModel = req.body.model;

    var fullfilepath = req.body.fullfilepath;

    console.log("denoise:" + denoise);
    console.log("cfg:" + cfg);
    console.log("samplingsteps:" + samplingsteps);
    console.log("sampler:" + sampler);
    console.log("scheduler:" + scheduler);
    console.log("upscaleModel:" + upscaleModel);
    console.log("fullfilepath" + fullfilepath);



    var faceParams = null;
    if (req.body.face_denoise != undefined) {
        var face_denoise = req.body.face_denoise;
        var face_cfg = parseFloat(req.body.face_cfg);
        var face_samplingsteps = parseInt(req.body.face_samplingsteps);
        var face_sampler = req.body.face_sampler;
        var face_scheduler = req.body.face_scheduler;

        console.log("face_denoise:" + face_denoise);
        console.log("face_cfg:" + face_cfg);
        console.log("face_samplingsteps:" + face_samplingsteps);
        console.log("face_sampler:" + face_sampler);
        console.log("face_scheduler:" + face_scheduler);

        faceParams = {};
        faceParams.face_denoise = face_denoise;
        faceParams.face_cfg = face_cfg;
        faceParams.face_samplingsteps = face_samplingsteps;
        faceParams.face_sampler = face_sampler;
        faceParams.face_scheduler = face_scheduler;
    }




    //lock character
    var isLockCharacter = (req.body.lockCharacter == 1) && (req.body.fullCharacterFile != undefined);
    var fullCharacterPath = "";
    if (isLockCharacter) {

        if (req.body.fullCharacterFile != undefined) {
            fullCharacterPath = req.body.fullCharacterFile;
            console.log("fullCharacterPath:" + fullCharacterPath);
        }
    }

    let style = null;
    let negtext = null;
    let model = null;
    let prompt = null;
    var jsonSettings = null;
    let useHumanLora = false;
    if (req.body.tags != undefined) {
        var tagString = req.body.tags
        var tags = JSON.parse(tagString);
        if (tags.prompt) {
            var jsonString = tags.prompt.value;
            console.log("EXif:" + jsonString);
            jsonSettings = JSON.parse(jsonString);
            for (let i in jsonSettings) {
                if (jsonSettings[i]["class_type"] == "SDXLPromptStyler") {
                    style = jsonSettings[i]["inputs"]["style"];
                    negtext = jsonSettings[i]["inputs"]["text_negative"];
                    prompt = jsonSettings[i]["inputs"]["text_positive"];
                    console.log("find style:" + style);
                    console.log("find negtext:" + negtext);
                    console.log("find prompt:" + prompt);
                    break;
                }
            }
            // get old model
            for (var i in jsonSettings) {
                if (jsonSettings[i]["class_type"] == "CheckpointLoaderSimple") {
                    if (Tool.isQualifiedCkpt(jsonSettings[i]["inputs"]["ckpt_name"])) {
                        model = jsonSettings[i]["inputs"]["ckpt_name"];
                        console.log("find model:" + model);
                        break;
                    }
                }
            }

            //humanlora
            for (var i in jsonSettings) {
                if (jsonSettings[i]["class_type"] == "CR LoRA Stack") {
                    if (jsonSettings[i]["inputs"]["lora_name_1"] == "real-humans-PublicPromptsXL.safetensors"
                        && jsonSettings[i]["inputs"]["switch_1"] == "On") {
                        useHumanLora = true;
                    }
                }
            }

        }
    }

    let promptjson;
    if (!isLockCharacter && Tool.checkIsSamePipeLine(jsonSettings, "workflow_api_adv_realism_photo.json")) {
        task.pipeline = "upscale_photorealism";
        promptjson = PipeAdvancePhotoRealismUpscale.process(fullfilepath, faceParams, denoise, cfg, samplingsteps, sampler, scheduler, prompt, model, style, useHumanLora, negtext, isLockCharacter, fullCharacterPath);
    }
    else if (!isLockCharacter && Tool.checkIsSamePipeLine(jsonSettings, "workflow_api_adv_dslr.json")) {
        task.pipeline = "upscale_dslr";
        promptjson = PipeAdvanceDSLRUpscale.process(fullfilepath, faceParams, denoise, cfg, samplingsteps, sampler, scheduler, prompt, model, style, useHumanLora, negtext, isLockCharacter, fullCharacterPath);
    }
    else if (!isLockCharacter && Tool.checkIsSamePipeLine(jsonSettings, "workflow_api_adv_loose_color_2.json")) {
        task.pipeline = "upscale_loose_color";
        promptjson = PipeAdvanceLooseColorUpscale.process(fullfilepath, faceParams, denoise, cfg, samplingsteps, sampler, scheduler, prompt, model, style, negtext, isLockCharacter, fullCharacterPath);
    }
    else if (!isLockCharacter && Tool.checkIsSamePipeLine(jsonSettings, "workflow_api_adv_epic_real.json")) {
        task.pipeline = "upscale_real_epic";
        promptjson = PipeAdvanceEpicRealUpscale.process(fullfilepath, faceParams, denoise, cfg, samplingsteps, sampler, scheduler, prompt, model, style, useHumanLora, negtext, isLockCharacter, fullCharacterPath);
    }
    else if (!isLockCharacter &&
        (Tool.checkIsSamePipeLine(jsonSettings, "workflow_api_adv_bw_loose_color_2.json")
            || Tool.checkIsSamePipeLine(jsonSettings, "workflow_api_adv_bw_grain.json"))) {
        task.pipeline = "upscale_bw_loose";
        promptjson = PipeAdvanceBWLooseUpscale.process(fullfilepath, faceParams, denoise, cfg, samplingsteps, sampler, scheduler, prompt, model, style, negtext, isLockCharacter, fullCharacterPath);
    }
    else if (!isLockCharacter && Tool.checkIsSamePipeLine(jsonSettings, "workflow_api_illustration_comic.json")) {
        task.pipeline = "upscale_illustration_comic";
        promptjson = PipeIllustrationComicUpscale.process(fullfilepath, faceParams, denoise, cfg, samplingsteps, sampler, scheduler, prompt, model, style, negtext);
    }
    else if (!isLockCharacter && (Tool.checkIsSamePipeLine(jsonSettings, "/advance/flux_stage_canny.json")
        || Tool.checkIsSamePipeLine(jsonSettings, "/advance/flux_stage_depth.json") ||
        Tool.checkIsSamePipeLine(jsonSettings, "/advance/flux_stage_hed.json"))) {
        task.pipeline = "upscale_flux";
        promptjson = PipeFluxUpscale.process(fullfilepath, denoise, cfg, samplingsteps, sampler, scheduler, prompt, model, style, negtext, isLockCharacter, fullCharacterPath);
    }
    else {
        task.pipeline = "upscale_normal";
        let isPhoto = Tool.getIsPhotoStyle(model, style);
        promptjson = Upscale4X.process(fullfilepath, denoise, cfg, samplingsteps, sampler, scheduler, prompt, model, style, negtext, isPhoto, isLockCharacter, fullCharacterPath);
    }
    task.pipeline += "_" + isLockCharacter;
    //
    Tool.applyRandomFileName(promptjson);
    sendRequest(promptjson, queue, task);
}

function sendRequest(promptjson, queue, task) {

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": promptjson }));

    //send request
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
        timeout: 6000000,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': "Bearer ozlh7xvpezbtwlr9tseg14imf4fhqo5v"
        }
    };

    var datastring = "";
    const reqhttps = https.request(options, (reshttps) => {
        console.log('statusCode:', reshttps.statusCode);
        console.log('headers:', reshttps.headers);

        if (reshttps.statusCode == 200) {

            queue.completeTask();
            console.log("200");
            reshttps.on('data', (d) => {
                datastring += d;
                // console.log("ondata");
            });

            reshttps.on('end', (d) => {
                let jsonobj = JSON.parse(datastring);
                console.log("onend_upscale: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var upscaleImageName = uuidv4() + "_upscale.png";
                    console.log("upscaleImageName:" + upscaleImageName);
                    task.imageFileNames.push(upscaleImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + upscaleImageName, jsonobj[i], {
                        encoding: "base64",
                    });
                }
                task.sendCompleteTaskSuccess();
            });
        }
        else {
            queue.completeTaskFailed();
        }
    });

    reqhttps.on('error', (error) => {
        console.error(error);
        queue.completeTaskFailed();
    });

    reqhttps.write(data);
    reqhttps.end();
}

module.exports = TaskComfyUpscale;