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

function TaskComfyRender(task, req, queue) {
    console.log('TaskComfyRender');

    var rawImg = req.files.imageByteArray.data;
    imgData = Buffer.from(rawImg).toString('base64');

    var reqModel = req.body.model == undefined ?"dynavisionXL" :req.body.model;
    var model = Tool.getModelFile(reqModel);

    var cfg = parseInt(req.body.cfg);
    var posPrompt = req.body.prompt;
    var sampleSteps = parseInt(req.body.sampleSteps);
    var scheduler = req.body.scheduler;
    var sampler = req.body.sampler;
    var negtext = req.body.negtext;
    var pretext = req.body.pretext;
    var style = req.body.style;
    var lora = req.body.lora;
    var rd_style = req.body.rd_style;
    var depthStrength = parseFloat(req.body.depthStrength);
    var poseStrength = parseFloat(req.body.poseStrength);

    console.log("rd_style:" + rd_style);
    console.log("style:" + style);
    console.log("lora:" + lora);
    console.log("pretext:" + pretext);
    console.log("2_model:" + model);
    console.log("cfg:" + cfg);
    console.log("prompt:" + posPrompt);
    console.log("sampleSteps:" + sampleSteps);
    console.log("sampler:" + sampler);
    console.log("scheduler:" + scheduler);
    console.log("negtext:" + negtext);
    console.log("depthStrength:" + depthStrength);
    console.log("poseStrength:" + poseStrength);

    //lock character
    var isLockCharacter = (req.body.lockCharacter == 1) && (req.body.characterFile != undefined);
    var characterFile = "";
    if (isLockCharacter) {
        characterFile = req.body.characterFile;
        console.log("lockcharacter:" + characterFile);
    }

    //add pretext
    posPrompt = pretext + " , " + posPrompt;

    //loras
    var loras = [];
    if (lora != "" && lora != null) {
        loras = lora.split(",");
    }

    let processRDStyle = Tool.getRenderStyle(rd_style, reqModel, loras, style);
    if(processRDStyle != null){
        console.log("processRDStyle:" + processRDStyle);
    }
    let prompt = null;

    // process 
    if(processRDStyle == "illustration" && !isLockCharacter){
        prompt = IllustrationRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile);
    }
    else if(processRDStyle == "illustration_tone_grain" && !isLockCharacter){
        prompt = IllustrationGrainRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile);
    }
    else if(processRDStyle == "illustration_tone" && !isLockCharacter){
        prompt = IllustrationToneRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile);
    }
    else{
        prompt = NormalRender.process(imgData, posPrompt, negtext, model, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile);
    }

   
    if (prompt == null) {
        queue.completeTask();
        return;
    }

    sendRequest(prompt, queue, task);
}

function sendRequest(prompt, queue, task) {
    var data = JSON.stringify({ "prompt": prompt });
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

            reshttps.on('data', (d) => {
                datastring += d;
                //console.log("ondata");
            });

            reshttps.on('end', (d) => {
                console.log("onend");
                const jsonobj = JSON.parse(datastring);
                for (var i = 0; i < jsonobj.length; i++) {
                    var imgname = uuidv4() + ".png";
                    task.imageFileNames.push(imgname);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + imgname, jsonobj[i], {
                        encoding: "base64",
                    });
                }
                queue.completeTask();
            });

        }
        else {
            queue.completeTask();
        }
    });

    reqhttps.on('error', (error) => {
        console.error(error);
        queue.completeTask();
    });

    reqhttps.write(data);
    reqhttps.end();
}


module.exports = TaskComfyRender;