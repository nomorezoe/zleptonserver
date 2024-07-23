"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function TaskComfyScribbleEnhance(task, req, queue) {
    console.log("TaskComfyScribbleEnhance");

    var session = req.body.session;

    const promptFile = fs.readFileSync('./pipe/workflow_api_scribble_upscale_2x.json');
    let prompt = JSON.parse(promptFile);
   
    if(req.body.imageUrl != undefined){
        console.log("enhance image url:"  +  req.body.imageUrl);
        Tool.applyImage(prompt, "2", null, req.body.imageUrl);
    }
    else{
        prompt["2"]["inputs"]["image"] = req.body.imageData;
    }

    var value = parseInt(req.body.enhanceValue.substr(0,1));
    console.log("enhance value:"  + value);
    
    prompt["25"]["inputs"]["upscale_by"] = value;
    
    prompt["7"]["inputs"]["seed"] = Tool.randomInt();
    prompt["25"]["inputs"]["seed"] = Tool.randomInt();
    prompt["40"]["inputs"]["seed"] = Tool.randomInt();

    task.pipeline = "scribble_enhance";
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

                    var imgName =  uuidv4() + "_enhance.png";
                    console.log("enhance_ImageName:" + imgName);
                    task.imageFileNames.push(imgName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + imgName, jsonobj[i],{
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

module.exports = TaskComfyScribbleEnhance;