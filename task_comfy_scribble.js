"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function TaskComfyScribble(task, req, queue) {
    console.log("TaskComfyScribble");

    var session = req.body.session;

    var isSuperFast = true;

    if(req.body.superfast != undefined){
        isSuperFast = parseInt(req.body.superfast) == 1;
    }

    console.log("isSuperFast"+isSuperFast);

   

    var strength = 1;
    if (req.body.strength && req.body.strength != undefined && req.body.strength != "undefined") {
        console.log("req.body.strength: " + req.body.strength);
        strength = parseFloat(req.body.strength) / 100.0;
        strength = Math.max(strength, 0.01);
        console.log("req.body.strength: " + strength);
    }
    var rawImg = req.files.imageByteArray.data;
    imgData = Buffer.from(rawImg).toString('base64');
   // console.log("imgData: " + imgData);

    //capture
    /*var captureFile = uuidv4() + "_scribble_capture.png";
    fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, imgData, {
        encoding: "base64",
    });
    */

    let prompt = null;
    if(isSuperFast == 1){
        let promptFile = fs.readFileSync('./pipe/workflow_api_scribble.json');
        prompt = JSON.parse(promptFile);
    }
    else{
        let promptFile = fs.readFileSync('./pipe/workflow_api_scribble_openpose.json');
        prompt = JSON.parse(promptFile);
    }

    prompt["54"]["inputs"]["image"] = imgData;
    prompt["42"]["inputs"]["denoise"] = strength;

    if (req.body.prompt) {
        // prompt["48"]["inputs"]["text"]= req.body.prompt;
        prompt["65"]["inputs"]["text_positive"] = req.body.prompt;
        console.log("prompt" + req.body.prompt);
    }

    if (req.body.style) {
        prompt["65"]["inputs"]["style"] = getStyle(req.body.style);
    }

    task.pipeline = "scribble";
    //
    Tool.applyRandomFileName(prompt);
    sendRequest(prompt, queue, task);

}

function getStyle(value) {
    let style = "base";
    switch (value) {
        case "photo":
            break;
        case "illustrated":
        case "dslr":
            style = "vector-graphic";
            break;
        case "anime":
        case "cinematic":
            style = "sai-anime";
            break;
        case "cgi":
        case "bw_loose":
            style = "sai-digital art";
            break;
        case "hd":
        case "animation":
            style = "artstyle-hyperrealism";
            break;
    }

    return style;
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
                //console.log("onendscribble: " + datastring);
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

module.exports = TaskComfyScribble;