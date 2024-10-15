"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function FaceFlexPipe(task, req, queue) {
    console.log("FaceFlexPipe");

    var session = req.body.session;
    var text = req.body.prompt;

    const promptFile = fs.readFileSync('./pipe/workflow_api_face_flex.json');//');
    let prompt = JSON.parse(promptFile);

    if (req.body.img_url != undefined  && req.body.img_url != null) {
        var maskUrl = req.body.img_url;
        Tool.applyImage(prompt, "5", null, maskUrl);
    }
    else {

        var rawImg = req.files.img_data.data;
        prompt["5"]["inputs"]["image"] = Buffer.from(rawImg).toString('base64');
    }



    var params = [];
    var isDefault = true;
    for (let i = 0; i < 12; i++) {
        params[i] = req.body["p" + i] - 0.5;
        if (params[i] != 0) {
            isDefault = false;
        }
    }

    let type = "body";
    if (req.body.type != undefined) {
        type = req.body.type;
    }
    if (req.body.type == "face") {
        prompt["20"]["inputs"]["model_name"] = "bbox/face_yolov8n_v2.pt";
    }

    let index = 0;
    if (req.body.index != undefined) {
        index = parseInt(req.body.index);
        prompt["2"]["inputs"]["take_start"] = index;

        console.log("index: " + index);
    }



    console.log("type:" + req.body.type);
    console.log("index:" + req.body.index);

    if (isDefault) {
        console.log("is default");
        delete prompt["65"];
        prompt["69"]["inputs"]["images"] = ["67", 1];
    }
    else {
        prompt["65"]["inputs"]["rotate_pitch"] = (params[0] > 0) ? (20 * params[0]) : (20 * params[0]);
        prompt["65"]["inputs"]["rotate_yaw"] = (params[1] > 0) ? (20 * params[1]) : (20 * params[1]);
        prompt["65"]["inputs"]["rotate_roll"] = (params[2] > 0) ? (20 * params[2]) : (20 * params[2]);

        prompt["65"]["inputs"]["blink"] = (params[3] > 0) ? (5 * params[3]) : (20 * params[3]);
        prompt["65"]["inputs"]["eyebrow"] = (params[4] > 0) ? (15 * params[4]) : (10 * params[4]);
        prompt["65"]["inputs"]["wink"] = (params[5] > 0) ? (25 * params[5]) : (0 * params[5]);
        prompt["65"]["inputs"]["pupil_x"] = (params[6] > 0) ? (15 * params[6]) : (15 * params[6]);
        prompt["65"]["inputs"]["pupil_y"] = (params[7] > 0) ? (15 * params[7]) : (15 * params[7]);
        prompt["65"]["inputs"]["aaa"] = (params[8] > 0) ? (120 * params[8]) : (30 * params[8]);
        prompt["65"]["inputs"]["eee"] = (params[9] > 0) ? (15 * params[9]) : (20 * params[9]);
        prompt["65"]["inputs"]["woo"] = (params[10] > 0) ? (15 * params[10]) : (20 * params[10]);
        prompt["65"]["inputs"]["smile"] = (params[11] > 0) ? (1.3 * params[11]) : (0.3 * params[11]);
    }

    prompt["1"]["inputs"]["seed"] = Tool.randomInt();

    task.pipeline = "face_flex";
    sendRequest(prompt, queue, task);
}


function sendRequest(promptjson, queue, task) {

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": promptjson }));

    //send request
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
        timeout: 0,
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
                console.log("onende_face_flex: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {
                    task.imageFileNames.push(jsonobj[i]);
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

module.exports = FaceFlexPipe;