"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
//const sizeOf = require('buffer-image-size');

function TaskComfyUpscale(task, req, queue) {

    var imageFileName = req.body.file;
    var session = req.body.session;
    var denoiseValue = req.body.denoisevalue;
    //var prompt = req.body.prompt;

    console.log("denoiseValue:" + denoiseValue);
    console.log("imageFileName" + imageFileName);
    //console.log("prompt" + prompt);

    var rawImg = fs.readFileSync(__dirname + OUTPUT_FOLDER + imageFileName);
    var imgBytes = rawImg.toString('base64');

    var upscaleImageName =  uuidv4() + "_upscale.png";

    const promptFile = fs.readFileSync('./pipe/workflow_api_upscale_face_denoise.json');
    let promptjson = JSON.parse(promptFile);
    
    promptjson["2"]["inputs"]["image"] = imgBytes;
    //promptjson["13"]["inputs"]["text"] = prompt;
    promptjson["7"]["inputs"]["seed"] = Tool.randomInt(450993616797312);
    promptjson["7"]["inputs"]["denoise"] = parseFloat(denoiseValue);

    var data = JSON.stringify({ "prompt": promptjson });
    //console.log(data)
    console.log(data.length)
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
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

        reshttps.on('data', (d) => {
            datastring += d;
            console.log("ondata");
        });

        reshttps.on('end', (d) => {
            let jsonobj = JSON.parse(datastring);

            console.log("onend" + jsonobj.length);
            for (var i = 0; i < jsonobj.length; i++) {
                task.imageFileNames.push(upscaleImageName);
                fs.writeFileSync(__dirname + OUTPUT_FOLDER + upscaleImageName, jsonobj[i],{
                    encoding: "base64",
                });
            }
            queue.completeTask();
        });

        if (reshttps.statusCode == 200) {
            console.log("200");
        }
        else {
            queue.completeTask();
        }
    });

    reqhttps.on('error', (error) => {
        console.error(error);
        queue.completeTask();
    });

    reqhttps.write(data);
    reqhttps.end();
}

module.exports = TaskComfyUpscale;