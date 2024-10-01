"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function FluxPipeStageRender(task, req, queue) {
    console.log("FluxPipeStageRender");

    var session = req.body.session;
    var text = req.body.prompt;

    var rawImg = req.files.imageByteArray.data;
    imgData = Buffer.from(rawImg).toString('base64');

    let type = "depth";
    if (req.body.fluxRenderType) {
        type = req.body.fluxRenderType;
    }

    console.log("type:" + type);
    console.log("flux_strength:" + req.body.flux_strength);
    console.log("flux_fade_effect:" + req.body.flux_fade_effect);

    let prompt = null;

    switch (type) {
        case "depth":
            prompt = FluxPipeStageRender.depthProcess(imgData, null, text, req, 0.5, 0.5);
            break;
        case "canny":
            prompt = FluxPipeStageRender.cannyProcess(imgData, null, text, req, 0.5, 0.5);
            break;
        case "hed":
            prompt = FluxPipeStageRender.hedProcess(imgData, null, text, req, 0.5, 0.5);
            break;
        default:
            prompt = FluxPipeStageRender.depthProcess(imgData, null, text, req, 0.5, 0.5);
    }


    task.pipeline = "flux_stage_render";
    sendRequest(prompt, queue, task);
}

FluxPipeStageRender.quickProcess = function (posprompt, imgurl, imgData) {
    console.log("FluxPipeStageRender.quickProcess");
    return FluxPipeStageRender.depthProcess(imgData, imgurl, posprompt);
}

FluxPipeStageRender.depthProcess = function (imgData, imgurl, text, req = null, value_0 = 0.5, value_1 = 0.5) {
    console.log("FluxPipeStageRender.depthProcess");

    const promptFile = fs.readFileSync('./pipe/advance/img2img_depth_v2.json');//');
    let prompt = JSON.parse(promptFile);

    if (imgData != null) {
        prompt["71"]["inputs"]["image"] = imgData;
    }
    else {
        Tool.applyImage(prompt, "71", null, imgurl);
    }

    prompt["25"]["inputs"]["noise_seed"] = Tool.randomInt();
    prompt["6"]["inputs"]["text"] = text;
     //parmas
     if (req != null) {
        let flux_strength = 0.4;
        let flux_fade_effect = 0.4;
        if (req.body.flux_strength != undefined) {
            flux_strength = req.body.flux_strength;
        }
        if (req.body.flux_fade_effect != undefined) {
            flux_fade_effect = req.body.flux_fade_effect;
        }
        console.log("flux_strength:" + flux_strength);
        console.log("flux_fade_effect:" + flux_fade_effect);

        prompt["38"]["inputs"]["strength"] = flux_strength;
        prompt["38"]["inputs"]["end"] = flux_fade_effect;
    }
    return prompt;
}

FluxPipeStageRender.old_depthProcess = function (imgData, imgurl, text, req = null, value_0 = 0.5, value_1 = 0.5) {
    console.log("FluxPipeStageRender.depthProcess");
    const promptFile = fs.readFileSync('./pipe/advance/flux_stage_depth.json');//');
    let prompt = JSON.parse(promptFile);

    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "37", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        let imgData = Buffer.from(rawImg).toString('base64');
        prompt["37"]["inputs"]["image"] = imgData;
    }

    prompt["229"]["inputs"]["clip_l"] = prompt["229"]["inputs"]["t5xxl"] = text;
    prompt["222"]["inputs"]["noise_seed"] = Tool.randomInt();

    //parmas
    if (req != null) {
        let flux_strength = 0.4;
        let flux_fade_effect = 0.4;
        if (req.body.flux_strength != undefined) {
            flux_strength = req.body.flux_strength;
        }
        if (req.body.flux_fade_effect != undefined) {
            flux_fade_effect = req.body.flux_fade_effect;
        }
        console.log("flux_strength:" + flux_strength);
        console.log("flux_fade_effect:" + flux_fade_effect);

        prompt["220"]["inputs"]["strength"] = flux_strength;
        prompt["220"]["inputs"]["end"] = flux_fade_effect;
    }

    return prompt;
}

FluxPipeStageRender.cannyProcess = function (imgData, imgurl, text, req = null, value_0 = 0.5, value_1 = 0.5) {
    console.log("FluxPipeStageRender.cannyProcess");
    const promptFile = fs.readFileSync('./pipe/advance/flux_stage_canny.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["229"]["inputs"]["clip_l"] = prompt["229"]["inputs"]["t5xxl"] = text;
    prompt["222"]["inputs"]["noise_seed"] = Tool.randomInt();
    //prompt["233"]["inputs"]["seed"] = Tool.randomInt();
    if (imgData != null) {
        prompt["37"]["inputs"]["image"] = imgData;
    }
    else {
        Tool.applyImage(prompt, "37", null, imgurl);
    }

    //parmas
    if (req != null) {
        let flux_strength = 0.4;
        let flux_fade_effect = 0.4;
        if (req.body.flux_strength != undefined) {
            flux_strength = req.body.flux_strength;
        }
        if (req.body.flux_fade_effect != undefined) {
            flux_fade_effect = req.body.flux_fade_effect;
        }
        console.log("flux_strength:" + flux_strength);
        console.log("flux_fade_effect:" + flux_fade_effect);

        prompt["220"]["inputs"]["strength"] = flux_strength;
        prompt["220"]["inputs"]["end"] = flux_fade_effect;
    }
    return prompt;
}

FluxPipeStageRender.hedProcess = function (imgData, imgurl, text, req = null, value_0 = 0.5, value_1 = 0.5) {
    console.log("FluxPipeStageRender.hedProcess");
    const promptFile = fs.readFileSync('./pipe/advance/flux_stage_hed.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["229"]["inputs"]["clip_l"] = prompt["229"]["inputs"]["t5xxl"] = text;
    prompt["222"]["inputs"]["noise_seed"] = Tool.randomInt();
    //prompt["233"]["inputs"]["seed"] = Tool.randomInt();
    if (imgData != null) {
        prompt["37"]["inputs"]["image"] = imgData;
    }
    else {
        Tool.applyImage(prompt, "37", null, imgurl);
    }

    //parmas
    if (req != null) {
        let flux_strength = 0.4;
        let flux_fade_effect = 0.4;
        if (req.body.flux_strength != undefined) {
            flux_strength = req.body.flux_strength;
        }
        if (req.body.flux_fade_effect != undefined) {
            flux_fade_effect = req.body.flux_fade_effect;
        }
        console.log("flux_strength:" + flux_strength);
        console.log("flux_fade_effect:" + flux_fade_effect);

        prompt["220"]["inputs"]["strength"] = flux_strength;
        prompt["220"]["inputs"]["end"] = flux_fade_effect;
    }
    return prompt;
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
                console.log("ondata");
            });

            reshttps.on('end', (d) => {
                let jsonobj = JSON.parse(datastring);
                console.log("onend_flux_stage_render: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var styleImageName = uuidv4() + "_flux_stage_render.png";
                    console.log("flux_stage_render:" + styleImageName);
                    task.imageFileNames.push(styleImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + styleImageName, jsonobj[i], {
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

module.exports = FluxPipeStageRender;