"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');

function TaskComfyMask(task, req, queue) {
    console.log("TaskComfyMask");

    var session = req.body.session;

    const promptFile = fs.readFileSync('./pipe/get_character_mask_update.json');
    console.log("get_character_mask_update");
    let prompt = JSON.parse(promptFile);

    let isUpscaleImage = false;

    if (req.body.img_url == undefined) {
        var rawMaskImg = req.files.imageByteArray.data;
        var buffer = Buffer.from(rawMaskImg);
        var imgBytes = buffer.toString('base64');
        prompt["5"]["inputs"]["image"] = imgBytes;
    }
    else {
        var maskUrl = req.body.img_url;
        Tool.applyImage(prompt, "5", null, maskUrl);
        isUpscaleImage = true;
        //prompt["1"]["inputs"]["crop_factor"] = 6;
    }

    let type = "body";
    if (req.body.type != undefined) {
        type = req.body.type;
    }

    if (type == "face") {
        prompt["20"]["inputs"]["model_name"] = "bbox/face_yolov8n_v2.pt";
    }


    task.pipeline = "get_mask";
    //
    Tool.applyRandomFileName(prompt);
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
                console.log("onendmask: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var maskImageName = uuidv4() + "_mask.png";
                    console.log("maskName:" + maskImageName);
                    task.imageFileNames.push(maskImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + maskImageName, jsonobj[i], {
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

module.exports = TaskComfyMask;