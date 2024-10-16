"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function FluxPipeImageToImage(task, req, queue) {
    console.log("FluxPipeImageToImage");

    var session = req.body.session;

    let type = "depth";

    if (req.body.type != undefined) {
        type = req.body.type;
    }

    console.log("type: " + type);

    if (type == "hed") {
        processHed(task, req, queue)
        return;
    }
    else if (type == "depth") {
        processDepth(task, req, queue)
        return;
    }
    else if (type == "canny") {
        processCanny(task, req, queue);
        return;
    }

    //var rawImg = req.files.imageByteArray.data;
    //imgData = Buffer.from(rawImg).toString('base64');

    const promptFile = fs.readFileSync('./pipe/flux_img_2_img_no_upscale.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["6"]["inputs"]["text"] = "Create a cinematic image of " + text;
    // prompt["53"]["inputs"]["seed"] = Tool.randomInt();
    prompt["25"]["inputs"]["noise_seed"] = Tool.randomInt();
    //prompt["233"]["inputs"]["seed"] = Tool.randomInt();
    //prompt["41"]["inputs"]["image"] = imgData;

    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "41", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        let imgData = Buffer.from(rawImg).toString('base64');
        prompt["41"]["inputs"]["image"] = imgData;
    }


    task.pipeline = "flux_img_2_img";
    sendRequest(prompt, queue, task);
}

function processCanny(task, req, queue) {
    console.log("processCanny");
    //var rawImg = req.files.imageByteArray.data;
    //imgData = Buffer.from(rawImg).toString('base64');


    var text = req.body.prompt;

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
    console.log("req.body.url:" + req.body.url);

    const promptFile = fs.readFileSync('./pipe/advance/img2img_canny_v2.json');//');
    let prompt = JSON.parse(promptFile);

    //prompt["16"]["inputs"]["image"] = imgData;
    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "16", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        let imgData = Buffer.from(rawImg).toString('base64');
        prompt["16"]["inputs"]["image"] = imgData;
    }

    prompt["3"]["inputs"]["noise_seed"] = Tool.randomInt();
    prompt["5"]["inputs"]["clip_l"] = prompt["5"]["inputs"]["t5xxl"] = "Create a cinematic image of " + text;
    // prompt["19"]["inputs"]["guidance"] = prompt["5"]["inputs"]["guidance"] = (guidance > 0.5) ? (4 + (guidance - 0.5) * 2) : (4 + (guidance - 0.5) * 2);
    prompt["14"]["inputs"]["strength"] = flux_strength;
    prompt["14"]["inputs"]["end"] = flux_fade_effect;
    task.pipeline = "flux_img_2_img";
    sendRequest(prompt, queue, task);
}


function processDepth(task, req, queue) {
    console.log("processDepth");
    //var rawImg = req.files.imageByteArray.data;
    //imgData = Buffer.from(rawImg).toString('base64');

    var text = req.body.prompt;
    const promptFile = fs.readFileSync('./pipe/advance/img2img_depth_v2.json');//');
    let prompt = JSON.parse(promptFile);

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

    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "71", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        let imgData = Buffer.from(rawImg).toString('base64');
        prompt["71"]["inputs"]["image"] = imgData;
    }

    prompt["25"]["inputs"]["noise_seed"] = Tool.randomInt();
    prompt["6"]["inputs"]["text"] = text;
    prompt["38"]["inputs"]["strength"] = flux_strength;
    prompt["38"]["inputs"]["end_percent"] = flux_fade_effect;

    //prompt["5"]["inputs"]["clip_l"] = prompt["5"]["inputs"]["t5xxl"] = "Create a cinematic image of " + text;
    //prompt["19"]["inputs"]["guidance"] = prompt["5"]["inputs"]["guidance"] = (guidance > 0.5) ? (4 + (guidance - 0.5) * 2) : (4 + (guidance - 0.5) * 2);
    //prompt["14"]["inputs"]["strength"] = (edge > 0.5) ? (0.8 + (edge - 0.5) * 0.4) : (0.8 + (edge - 0.5) * 1);
    task.pipeline = "flux_img_2_img_depth";
    sendRequest(prompt, queue, task);
}



function processHed(task, req, queue) {
    console.log("processHed");
    //var rawImg = req.files.imageByteArray.data;
    //imgData = Buffer.from(rawImg).toString('base64');

    var text = req.body.prompt;
    const promptFile = fs.readFileSync('./pipe/advance/img2img_hed_v2.json');//');
    let prompt = JSON.parse(promptFile);

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

    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "16", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        let imgData = Buffer.from(rawImg).toString('base64');
        prompt["16"]["inputs"]["image"] = imgData;
    }

    prompt["3"]["inputs"]["noise_seed"] = Tool.randomInt();

    prompt["5"]["inputs"]["clip_l"] = prompt["5"]["inputs"]["t5xxl"] = "Create a cinematic image of " + text;
    // prompt["19"]["inputs"]["guidance"] = prompt["5"]["inputs"]["guidance"] = (guidance > 0.5) ? (4 + (guidance - 0.5) * 2) : (4 + (guidance - 0.5) * 2);
    prompt["14"]["inputs"]["strength"] = flux_strength;
    prompt["14"]["inputs"]["end"] = flux_fade_effect;
    task.pipeline = "flux_img_2_img_hed";
    sendRequest(prompt, queue, task);
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
                console.log("onend_flux_img_2_img: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var styleImageName = uuidv4() + "_flux_img_2_img.png";
                    console.log("flux_img_2_img:" + styleImageName);
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

module.exports = FluxPipeImageToImage;