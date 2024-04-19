"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');

function TaskComfySuperUpscale(task, req, queue) {
    console.log("TaskComfySuperUpscale");

    var session = req.body.session;

    var fullfilepath = req.body.fullfilepath;

    console.log("fullfilepath" + fullfilepath);

    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_super_scale.json');
    let prompt = JSON.parse(promptFile);

    prompt["236"]["inputs"]["url"]=fullfilepath;

    task.pipeline = "super_upscale";
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
                console.log("onend_super_upscale: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var upscaleImageName = uuidv4() + "_s_upscale.png";
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

module.exports = TaskComfySuperUpscale;