"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');

function TaskComfyStyleTransfer(task, req, queue) {
    console.log("TaskComfyStyleTransfer");

    var session = req.body.session;

    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_style_transfer.json');
    let prompt = JSON.parse(promptFile);

    for (let i = 0; i < 5; i++) {
        if (req.files["imageByteArray_" + i] != undefined) {
            console.log("addStyleTransferImageJson: "+ i);
            var rawImage = req.files["imageByteArray_" + i].data;
            var imageData = Buffer.from(rawImage).toString('base64');
            Tool.addStyleTransferImageJson(prompt, imageData, true, i + 1, "238", "225");
        }
    }

    let posPrompt = req.body.prompt;
    let file = req.body.img_url;

    prompt["55"]["inputs"]["text_positive"] = posPrompt;

    prompt["45"]["inputs"]["seed"] =  Tool.randomInt();

    Tool.applyImage(prompt, "1", null, file);
   
    Tool.applyRandomFileName(prompt);
    
    task.pipeline = "style_transfer";

    
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
                console.log("onend_style_transfer: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var styleImageName = uuidv4() + "_style.png";
                    console.log("styleImageName:" + styleImageName);
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

module.exports = TaskComfyStyleTransfer;