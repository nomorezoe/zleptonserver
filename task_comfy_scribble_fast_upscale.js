"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function TaskComfyScribbleFastUpscale(task, req, queue) {
    console.log("TaskComfyScribbleFastUpscale");

    var session = req.body.session;

    const promptFile = fs.readFileSync('./pipe/workflow_api_scribble_fast_upscale_face_detailer.json');
    let prompt = JSON.parse(promptFile);

   
    prompt["1"]["inputs"]["image"] = req.body.imageData;

    task.pipeline = "scribble_fast_upscale";
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

module.exports = TaskComfyScribbleFastUpscale;