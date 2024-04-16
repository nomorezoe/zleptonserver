"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');
const NormalRender = require("./pipe_render_normal");
const IllustrationToneRender = require("./pipe_illustration_tone");
const IllustrationRender = require("./pipe_illustration");
const IllustrationGrainRender = require("./pipe_illustration_grain");
const RealismPhotographyRender = require('./pipe_realism_photography');
const RealismPhotographySharpenRender = require('./pipe_realism_photography_sharpen');
const DeliberatePhotographyRender = require('./pipe_deliberate_photography');
const IllustrationComicRender = require('./pipe_illustration_comic');
const PipeAdvancePhotoRealism = require('./pipe_adv_photo_realism');
const PipeAdvanceLooseColor = require('./pipe_adv_loose_color');
const PipeAdvanceBWLooseColor = require('./pipe_adv_bw_loose_color');
const PipeAdvanceDSLR = require("./pipe_adv_dslr");
const PipeAdvanceBWGrain = require('./pipe_adv_bw_grain');
const PipeAdvanceEpicReal = require('./pipe_adv_epic_real')
const CharacterTool = require("./character_tool");

function TaskComfyRender(task, req, queue) {
    Tool.renderParams = {};
    console.log('TaskComfyRender' + req.body.cfg);
    let imgData;
    var rawImg = req.files.imageByteArray.data;
    imgData = Buffer.from(rawImg).toString('base64');

    //capture
    var captureFile = uuidv4() + "capture.png";
    fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, imgData, {
        encoding: "base64",
    });

    task.sendSocketMsg("generateScreenCapture", captureFile);

    //
    var reqModel = req.body.model == undefined ? "dynavisionXL" : req.body.model;
    var model = Tool.getModelFile(reqModel);

    var cfg = parseFloat(req.body.cfg);
    var originalPosPrompt = req.body.prompt;
    var sampleSteps = parseInt(req.body.sampleSteps);
    var scheduler = req.body.scheduler;
    var sampler = req.body.sampler;
    var negtext = req.body.negtext;
    var pretext = req.body.pretext;
    var style = req.body.style;
    var lora = req.body.loras;
    var lora_weights = req.body.lora_weights;
    var rd_style = req.body.rd_style;
    var depthStrength = parseFloat(req.body.depthStrength);
    var depthStart = parseFloat(req.body.depthStart);
    var depthEnd = parseFloat(req.body.depthEnd);

    var poseStrength = parseFloat(req.body.poseStrength);
    var poseStart = parseFloat(req.body.poseStart);
    var poseEnd = parseFloat(req.body.poseEnd);

    var cannyStrength = -1;
    var cannyStart = -1;
    var cannyEnd = -1;
    if (req.body.cannyStrength != undefined) {
        cannyStrength = parseFloat(req.body.cannyStrength);
        cannyStart = parseFloat(req.body.cannyStart);
        cannyEnd = parseFloat(req.body.cannyEnd);
    }

    var animalStrength = -1;
    var animalStart = -1;
    var animalEnd = -1;
    if (req.body.animalStrength != undefined) {
        animalStrength = parseFloat(req.body.animalStrength);
        animalStart = parseFloat(req.body.animalStart);
        animalEnd = parseFloat(req.body.animalEnd);
    }

    var hasBackDrop = false;
    if (req.body.hasBackDrop != undefined) {
        hasBackDrop = parseInt(req.body.hasBackDrop) == 1;
    }

    var hasAnimal = false;
    if (req.body.hasAnimal != undefined) {
        hasAnimal = parseInt(req.body.hasAnimal) == 1;
    }

    var cropWidth = parseFloat(req.body.cropWidth);
    var cropHeight = parseFloat(req.body.cropHeight);

    console.log("rd_style:" + rd_style);
    console.log("style:" + style);
    console.log("lora:" + lora);
    console.log("lora_weights:" + lora_weights);
    console.log("pretext:" + pretext);
    console.log("2_model:" + model);
    console.log("cfg:" + cfg);
    console.log("prompt:" + originalPosPrompt);
    console.log("sampleSteps:" + sampleSteps);
    console.log("sampler:" + sampler);
    console.log("scheduler:" + scheduler);
    console.log("negtext:" + negtext);

    console.log("depthStrength:" + depthStrength);
    console.log("depthStart:" + depthStart);
    console.log("depthEnd:" + depthEnd);

    console.log("poseStrength:" + poseStrength);
    console.log("poseStart:" + poseStart);
    console.log("poseEnd:" + poseEnd);

    console.log("cropWidth:" + cropWidth);
    console.log("cropHeight:" + cropHeight);

    console.log("cannyStrength:" + cannyStrength);
    console.log("cannyStart:" + cannyStart);
    console.log("cannyEnd:" + cannyEnd);

    console.log("hasAnimal" + hasAnimal);
    console.log("hasBackDrop" + hasBackDrop);

    console.log("animalStrength:" + animalStrength);
    console.log("animalStart:" + animalStart);
    console.log("animalEnd:" + animalEnd);

    Tool.renderParams.lora_weights = {};
    Tool.renderParams.depthStart = depthStart;
    Tool.renderParams.depthEnd = depthEnd;
    Tool.renderParams.poseStart = poseStart;
    Tool.renderParams.poseEnd = poseEnd;
    Tool.renderParams.cannyStart = cannyStart;
    Tool.renderParams.cannyEnd = cannyEnd;

    Tool.renderParams.animalStrength = animalStrength;
    Tool.renderParams.animalStart = animalStart;
    Tool.renderParams.animalEnd = animalEnd;



    //lock character
    CharacterTool.lockChParams = {};
    CharacterTool.lockChParams.isLockCharacter = false;
    CharacterTool.characerLockPair = [];
    if (req.body.lockCharacter == 1 && req.body.fullCharacterFile != undefined) {
        CharacterTool.lockChParams.isLockCharacter = true;
        CharacterTool.lockChParams.fullCharacterPath = req.body.fullCharacterFile;
        console.log("req.body.characerLockPair"  + req.body.characerLockPair);
        CharacterTool.characerLockPair = JSON.parse(req.body.characerLockPair);
        if (CharacterTool.characerLockPair.length == 0) {
            CharacterTool.characerLockPair = [[0, 0]];
        }
    }

    //adapter
    var characterFile = null;
    var fullCharacterPath = CharacterTool.lockChParams.fullCharacterPath;
    var isLockCharacter = CharacterTool.lockChParams.isLockCharacter;

    //add pretext
    let posPrompt = pretext + originalPosPrompt;

    //loras
    var loras = [];
    if (lora != "" && lora != null) {
        loras = lora.split(",");
        lora_weight_items = lora_weights.split(",");

        for (let i = 0; i < loras.length; i++) {
            Tool.renderParams.lora_weights[loras[i]] = parseFloat(lora_weight_items[i]);
            //console.log("lora weights: " + loras[i] +":"+ lora_weight_items[i])
        }
    }

    let processRDStyle = Tool.getRenderStyle(rd_style, reqModel, loras, style, sampler, sampleSteps, scheduler, cfg, depthStrength, poseStrength);
    if (processRDStyle != null) {
        console.log("processRDStyle:" + processRDStyle);
    }
    let prompt = null;

    let applyCrop = true;

    let info = originalPosPrompt;

    //new pipe
    if (processRDStyle == "adv_loose_color") {
        if (!isLockCharacter) {
            // applyCrop = false;
            task.pipeline = "adv_loose_color";
            prompt = PipeAdvanceLooseColor.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, isLockCharacter, characterFile, fullCharacterPath, info);
        }
        else {
            processRDStyle == "illustration";
        }
    }
    else if (processRDStyle == "adv_photo_realism") {
        applyCrop = false;
        task.pipeline = "adv_photo_realism";
        prompt = PipeAdvancePhotoRealism.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, hasBackDrop, info);

    } else if (processRDStyle == "adv_bw_loose") {
        if (!isLockCharacter) {
            //applyCrop = false;
            task.pipeline = "adv_bw_loose";
            prompt = PipeAdvanceBWLooseColor.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, isLockCharacter, characterFile, fullCharacterPath, info);
        }
        else {
            processRDStyle == "illustration_tone";
        }
    } else if (processRDStyle == "adv_bw_grain") {
        if (!isLockCharacter) {
            //applyCrop = false;
            task.pipeline = "adv_bw_grain";
            prompt = PipeAdvanceBWGrain.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, isLockCharacter, characterFile, fullCharacterPath, info);
        }
        else {
            processRDStyle == "illustration_tone_grain";
        }
    } else if (processRDStyle == "adv_dslr") {
            applyCrop = false;
            task.pipeline = "adv_dslr";
            prompt = PipeAdvanceDSLR.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, hasBackDrop, isLockCharacter, characterFile, fullCharacterPath, info);
    } else if (processRDStyle == "adv_epic_real") {
        if (!isLockCharacter) {
            applyCrop = false;
            task.pipeline = "adv_epic_real";
            prompt = PipeAdvanceEpicReal.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, hasBackDrop, isLockCharacter, characterFile, fullCharacterPath, info, hasAnimal);
        }
        else {
            processRDStyle == "delibrerate_photo";
        }
    }

    //old pipe
    if (prompt == null) {
        // process 
        if (processRDStyle == "illustration") {//&& !isLockCharacter) {
            task.pipeline = "illustration";
            prompt = IllustrationRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath);
        }
        else if (processRDStyle == "illustration_comic") {//&& !isLockCharacter) {
            task.pipeline = "illustration_comic";
            prompt = IllustrationComicRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath);
        }
        else if (processRDStyle == "real_photo_sharpen") {// && !isLockCharacter) {
            task.pipeline = "real_photo_sharpen";
            prompt = RealismPhotographySharpenRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath);

        }
        else if (processRDStyle == "real_photo") {//&& !isLockCharacter) {
            task.pipeline = "real_photo";
            prompt = RealismPhotographyRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath);

        }
        else if (processRDStyle == "delibrerate_photo") {// && !isLockCharacter) {
            task.pipeline = "delibrerate_photo";
            prompt = DeliberatePhotographyRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath);
        }
        else if (processRDStyle == "illustration_tone_grain") {//&& !isLockCharacter) {
            task.pipeline = "illustration_tone_grain";
            prompt = IllustrationGrainRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath);
        }
        else if (processRDStyle == "illustration_tone") {//&& !isLockCharacter) {
            task.pipeline = "illustration_tone";
            prompt = IllustrationToneRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath);
        }
        else {
            prompt = NormalRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath);
        }
    }

    task.pipeline += "_" + isLockCharacter;



    if (prompt == null) {
        queue.completeTaskFailed();
        return;
    }

    if (applyCrop) {
        Tool.applyCropInfoForLatentImage(prompt);
    }

    Tool.applyCropInfo(prompt, cropWidth, cropHeight);

    Tool.applyRandomFileName(prompt);

    //var captureFile = "save.json";
    //fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, JSON.stringify(prompt), 'utf8');

    //Tool.ApplyPromptNote(prompt, originalPosPrompt);

    sendRequest(prompt, queue, task);
}

function sendRequest(prompt, queue, task) {
    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": prompt }));
    //console.log(data)
    console.log(data.length)
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
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
            console.log("200");
            queue.completeTask();

            reshttps.on('data', (d) => {
                datastring += d;
                // console.log("ondata");
            });

            reshttps.on('end', (d) => {
                console.log("onend_render: " + task.key);
                const jsonobj = JSON.parse(datastring);
                for (var i = 0; i < jsonobj.length; i++) {
                    var imgname = uuidv4() + ".png";
                    task.imageFileNames.push(imgname);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + imgname, jsonobj[i], {
                        encoding: "base64",
                    });
                }

                task.sendCompleteTaskSuccess();

            });

            reshttps.on("error", function (error) {
                //callback(error);
                console.error("ERR:"+error);
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


module.exports = TaskComfyRender;