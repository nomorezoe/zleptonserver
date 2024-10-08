"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');
const FluxPipeStageRender = require('./flux_pipe_stage_render');
const PipeAdvancePhotoRealism = require('./pipe_adv_photo_realism');
const PipeAdvanceLooseColor = require("./pipe_adv_loose_color");
const PipeAdvanceDSLR = require("./pipe_adv_dslr");
const PipeAdvanceEpicReal = require("./pipe_adv_epic_real");
const PipeAdvanceBWLooseColor = require("./pipe_adv_bw_loose_color");
const PipeAdvanceBWGrain = require('./pipe_adv_bw_grain');
const IllustrationComicRender = require("./pipe_illustration_comic");

let BATCH_COUNT = 4;
function TaskAdvanceStyleTransfer(task, req, queue) {

    console.log("TaskAdvanceStyleTransfer");

    var session = req.body.session;
    var type = req.body.type;

    if (req.body.style != undefined) {
        sketchToStyle(task, req, queue);
        return;
    }

    if (type == "sketch2photo") {
        sketchToPhoto(task, req, queue);
        return;
    }

    if (type == "sketch2loosecolor") {
        sketchToLooseColor(task, req, queue);
        return;
    }

    let promptFile = fs.readFileSync('./pipe/new_style_transfer_combine.json');
    let prompt = JSON.parse(promptFile);

    switch (type) {
        case "sketch2graphiccolor":
            console.log("sketch2graphiccolor");
            for (let i = 0; i < 5; i++) {
                Tool.addBW2ColorImageJson(prompt, i + 1, "29", "15");
            }

            prompt["4"]["inputs"]["ckpt_name"] = "dreamshaperXL_v21TurboDPMSDE.safetensors";

            //delete LineArtPreprocessor
            prompt["21"]["inputs"]["image"] = ["25", 0];
            delete prompt["26"];
            break;
        default:
            console.log("img2img" + req.body.is_links);
            if (req.files == undefined || req.files["imageByteArray_0"] == undefined) {
                for (let i = 0; i < 5; i++) {
                    if (req.body["img_ref_" + i] != undefined
                        && req.body["img_ref_" + i] != null
                        && req.body["img_ref_" + i] != "null"
                    ) {
                        console.log("addStyleTransferImageJson: " + req.body["img_ref_" + i]);
                        Tool.addStyleTransferImageJson(prompt, req.body["img_ref_" + i], false, i + 1, "29", "15");
                    }
                }
            }
            else {
                for (let i = 0; i < 5; i++) {
                    if (req.files["imageByteArray_" + i] != undefined) {
                        console.log("addStyleTransferImageJson: " + i);
                        var rawImage = req.files["imageByteArray_" + i].data;
                        var imageData = Buffer.from(rawImage).toString('base64');
                        Tool.addStyleTransferImageJson(prompt, imageData, true, i + 1, "29", "15");
                    }
                }
            }

            //delete ImageInvert
            delete prompt["25"];
            break;
    }

    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "10", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        var imgData = Buffer.from(rawImg).toString('base64');

        /*var captureFile = uuidv4() + "_scribble_capture.png";
        fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, imgData, {
            encoding: "base64",
        });*/

        prompt["10"]["inputs"]["image"] = imgData;
    }

    console.log("prompt: " + req.body.prompt);
    if (req.body.prompt != "undefined" && req.body.prompt != undefined && req.body.prompt != "") {
        prompt["6"]["inputs"]["text"] = req.body.prompt;
    }


    console.log("req.body.is_superstyle" + req.body.is_superstyle);
    if (prompt["28"] != undefined && req.body.is_superstyle != undefined) {
        if (parseInt(req.body.is_superstyle) == 1) {
            console.log("is_superstyle");
            prompt["28"]["inputs"]["weight_type"] = "strong style transfer";
        }
    }


    console.log("poseInfluence: ", req.body.poseInfluence);
    console.log("poseEffectFade: ", req.body.poseEffectFade);
    console.log("depthInfluence: ", req.body.depthInfluence);
    console.log("depthEffectFade: ", req.body.depthEffectFade);
    console.log("creativityLevel: ", req.body.creativityLevel);



    //req.body.shapePrecision
    console.log("shapePrecision: " + req.body.shapePrecision);
    if (req.body.shapePrecision != undefined) {

        let shapeV = parseFloat(req.body.shapePrecision);/// 100.0
        console.log("shapeV:" + shapeV);
        //default 
        if (shapeV >= 0.5) {
            prompt["21"]["inputs"]["strength"] = 0.6 + (shapeV - 0.5) * 0.6;
            prompt["21"]["inputs"]["end_percent"] = 0.6 + (shapeV - 0.5) * 0.6;
        }
        else {
            prompt["21"]["inputs"]["strength"] = 0.6 + (shapeV - 0.5) * 0.2;
            prompt["21"]["inputs"]["end_percent"] = 0.6 + (shapeV - 0.5) * 0.2;
        }

        console.log("shapeV: " + prompt["21"]["inputs"]["strength"]);
    }

    //req.body.styleStrength
    console.log("styleStrength: " + req.body.styleStrength);
    if (req.body.styleStrength != undefined && prompt["28"] != undefined) {

        let styleV = parseFloat(req.body.styleStrength);/// 100.0
        console.log("styleV:" + styleV);
        if (styleV >= 0.5) {
            prompt["28"]["inputs"]["weight"] = 0.9 + (styleV - 0.5) * 0.2;
        }
        else {
            prompt["28"]["inputs"]["weight"] = 0.9 + (styleV - 0.5) * 0.6;
        }

        console.log("styleV: " + prompt["28"]["inputs"]["weight"]);
    }

    //req.body.originalClarity
    console.log("originalClarity: " + req.body.originalClarity);
    if (req.body.originalClarity != undefined) {
        let clarityV = parseFloat(req.body.originalClarity);/// 100.0
        console.log("clarityV:" + clarityV);

        if (clarityV >= 0.5) {
            prompt["3"]["inputs"]["denoise"] = 0.9 + (clarityV - 0.5) * 0.2;
        }
        else {
            prompt["3"]["inputs"]["denoise"] = 0.9 + (clarityV - 0.5) * 1.0;
        }
        console.log("clarityV: " + prompt["3"]["inputs"]["denoise"]);
    }


    prompt["3"]["inputs"]["seed"] = Tool.randomInt();

    //var captureFile = "save.json";
    //fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, JSON.stringify(prompt), 'utf8');

    task.pipeline = "adv_style_transfer";
    sendRequest(prompt, queue, task);
}

function sketchToLooseColor(task, req, queue) {
    console.log("sketchToLooseColor");

    let promptFile = fs.readFileSync('./pipe/workflow_api_adv_sketch_to_loose_color.json');
    let prompt = JSON.parse(promptFile);

    if (req.body.prompt != "undefined" && req.body.prompt != undefined && req.body.prompt != "") {
        prompt["6"]["inputs"]["text"] += ", " + req.body.prompt;
    }

    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "44", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        imgData = Buffer.from(rawImg).toString('base64');

        prompt["44"]["inputs"]["image"] = imgData;
    }

    console.log("sketchDetail: " + req.body.sketchDetail);
    console.log("edgeDetection: " + req.body.edgeDetection);

    //req.body.sketchDetail
    let sdetail = parseFloat(req.body.sketchDetail);/// 100.0
    //console.log("sketchDetail:" + sdetail);
    //default 
    if (sdetail >= 0.5) {
        prompt["52"]["inputs"]["strength"] = 0.8 + (sdetail - 0.5) * 0.4;
    }
    else {
        prompt["52"]["inputs"]["strength"] = 0.8 + (sdetail - 0.5) * 0.4;
    }
    console.log("sketchDetail:" + prompt["52"]["inputs"]["strength"]);

    //req.body.sketchDetail
    let edetect = parseFloat(req.body.edgeDetection);/// 100.0

    //default 
    if (edetect >= 0.5) {
        prompt["56"]["inputs"]["strength"] = 0.65 + (edetect - 0.5) * 0.1;
    }
    else {
        prompt["56"]["inputs"]["strength"] = 0.65 + (edetect - 0.5) * 0.1;
    }
    console.log("edgeDetection:" + prompt["56"]["inputs"]["strength"]);

    prompt["3"]["inputs"]["seed"] = Tool.randomInt();

    task.pipeline = "sketch_to_loose_color";
    sendRequest(prompt, queue, task);
}

function sketchToPhoto(task, req, queue) {
    console.log("sketchToPhoto");

    let promptFile = fs.readFileSync('./pipe/workflow_api_adv_sketch_to_photo.json');
    let prompt = JSON.parse(promptFile);

    if (req.body.prompt != "undefined" && req.body.prompt != undefined && req.body.prompt != "") {
        prompt["6"]["inputs"]["text"] += ", " + req.body.prompt;
    }

    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "10", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        imgData = Buffer.from(rawImg).toString('base64');

        prompt["10"]["inputs"]["image"] = imgData;
    }

    console.log("sketchDetail: " + req.body.sketchDetail);
    console.log("edgeDetection: " + req.body.edgeDetection);

    //req.body.sketchDetail
    let sdetail = parseFloat(req.body.sketchDetail);/// 100.0
    //console.log("sketchDetail:" + sdetail);
    //default 
    if (sdetail >= 0.5) {
        prompt["11"]["inputs"]["strength"] = 0.8 + (sdetail - 0.5) * 0.4;
    }
    else {
        prompt["11"]["inputs"]["strength"] = 0.8 + (sdetail - 0.5) * 0.4;
    }
    console.log("sketchDetail:" + prompt["11"]["inputs"]["strength"]);

    //req.body.sketchDetail
    let edetect = parseFloat(req.body.edgeDetection);/// 100.0

    //default 
    if (edetect >= 0.5) {
        prompt["17"]["inputs"]["strength"] = 0.65 + (edetect - 0.5) * 0.1;
    }
    else {
        prompt["17"]["inputs"]["strength"] = 0.65 + (edetect - 0.5) * 0.1;
    }
    console.log("edgeDetection:" + prompt["17"]["inputs"]["strength"]);

    //prompt["3"]["inputs"]["seed"] = Tool.randomInt();

    task.pipeline = "sketch_to_photo";

    //non batch

    prompt["3"]["inputs"]["seed"] = Tool.randomInt();
    sendRequest(prompt, queue, task);
    return;


    //batch
    prompt["5"]["inputs"]["batch_size"] = 1;
    for (let i = 0; i < BATCH_COUNT; i++) {
        prompt["3"]["inputs"]["seed"] = Tool.randomInt();
        sendRequest(prompt, queue, task, true);
    }
}

function sketchToStyle(task, req, queue) {
    let imgurl;
    let imgData;
    if (req.body.url != undefined) {
        imgurl = req.body.url;
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        imgData = Buffer.from(rawImg).toString('base64');
    }

    let posPrompt = req.body.prompt;
    let promptjson;
    let style = Tool.getQuickRenderStyle(req.body.style);
    switch (style) {
        case ("flux"):
            promptjson = FluxPipeStageRender.quickProcess(posPrompt, imgurl, imgData, req);
            break;
        case ("adv_photo_realism"):
            promptjson = PipeAdvancePhotoRealism.quickProcess(posPrompt, imgurl, imgData, req);
            break;
        case ("adv_loose_color"):
            promptjson = PipeAdvanceLooseColor.quickProcess(posPrompt, imgurl, imgData, req);
            break;
        case ("adv_bw_grain"):
            promptjson = PipeAdvanceBWGrain.quickProcess(posPrompt, imgurl, imgData, req);
            break;
        case ("adv_dslr"):
            promptjson = PipeAdvanceDSLR.quickProcess(posPrompt, imgurl, imgData, req);
            break;
        case ("adv_epic_real"):
            promptjson = PipeAdvanceEpicReal.quickProcess(posPrompt, imgurl, imgData, req);
            break;
        case ("adv_bw_loose"):
            promptjson = PipeAdvanceBWLooseColor.quickProcess(posPrompt, imgurl, imgData, req);
            break;
        case ("illustration_comic"):
            promptjson = IllustrationComicRender.quickProcess(posPrompt, imgurl, imgData, req);
            break;
        default:
            promptjson = PipeAdvancePhotoRealism.quickProcess(posPrompt, imgurl, imgData, req);
    }

    sendRequest(promptjson, queue, task);
}

function sendRequest(promptjson, queue, task, isBatched = false) {

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

            if (isBatched) {
                task.requestCompletedCount++;
                if (task.requestCompletedCount == BATCH_COUNT) {
                    queue.completeTask();
                }
            }
            else {
                queue.completeTask();
            }

            console.log("200");
            reshttps.on('data', (d) => {
                datastring += d;
                console.log("ondata");
            });

            reshttps.on('end', (d) => {
                let jsonobj = JSON.parse(datastring);
                console.log("onend_style_transfer: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var styleImageName = uuidv4() + "_adv_style.png";
                    console.log("styleImageName:" + styleImageName);
                    task.imageFileNames.push(styleImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + styleImageName, jsonobj[i], {
                        encoding: "base64",
                    });
                }
                if (isBatched) {
                    task.dataCompletedCount++;
                    if (task.dataCompletedCount == BATCH_COUNT) {
                        task.sendCompleteTaskSuccess();
                    }
                }
                else {
                    task.sendCompleteTaskSuccess();
                }

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

module.exports = TaskAdvanceStyleTransfer;