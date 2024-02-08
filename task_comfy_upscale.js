"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');
const Upscale4X = require('./pipe_upsale_4x');

function TaskComfyUpscale(task, req, queue) {

    var imageFileName = req.body.file;
    var session = req.body.session;
    var denoiseValue = req.body.denoisevalue;
    //var prompt = req.body.prompt;
    var fullfilepath = req.body.fullfilepath;

    console.log("denoiseValue:" + denoiseValue);
    console.log("imageFileName" + imageFileName);
    console.log("fullfilepath" + fullfilepath);

    //lock character
    var isLockCharacter = (req.body.lockCharacter == 1) && (req.body.fullCharacterFile != undefined);
    var fullCharacterPath = "";
    if (isLockCharacter) {

        if (req.body.fullCharacterFile != undefined) {
            fullCharacterPath = req.body.fullCharacterFile;
            console.log("fullCharacterPath:" + fullCharacterPath);
        }
    }

    let style = null;
    let negtext = null;
    let model = null;
    let prompt = null;
    if (req.body.tags != undefined) {
        var tagString = req.body.tags
        var tags = JSON.parse(tagString);
        if (tags.prompt) {
            var jsonString = tags.prompt.value;
            //console.log("EXif:" + jsonString);
            var jsonSettings = JSON.parse(jsonString);
            for (let i in jsonSettings) {
                if (jsonSettings[i]["class_type"] == "SDXLPromptStyler") {
                    style = jsonSettings[i]["inputs"]["style"];
                    negtext = jsonSettings[i]["inputs"]["text_negative"];
                    prompt = jsonSettings[i]["inputs"]["text_positive"];
                    console.log("find style:" + style);
                    console.log("find negtext:" + negtext);
                    console.log("find prompt:" + prompt);
                    break;
                }
            }
            // get old model
            for (var i in jsonSettings) {
                if (jsonSettings[i]["class_type"] == "CheckpointLoaderSimple") {
                    if (Tool.isQualifiedCkpt(jsonSettings[i]["inputs"]["ckpt_name"])) {
                        model = jsonSettings[i]["inputs"]["ckpt_name"];
                        console.log("find model:" + model);
                        break;
                    }
                }
            }

        }
    }

    let isPhoto = Tool.getIsPhotoStyle(model, style);
    let promptjson = Upscale4X.process(imageFileName, fullfilepath, denoiseValue, prompt, model, style, negtext, isPhoto, isLockCharacter, fullCharacterPath);

    //
    Tool.applyRandomFileName(promptjson);
    sendRequest(promptjson, queue, task);
}

function sendRequest(promptjson, queue, task) {
    var startTime = new Date().getTime();

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": promptjson }));

    //send request
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
        reshttps.setTimeout(6000000);
        if (reshttps.statusCode == 200) {
            var completeTime = new Date().getTime() - startTime;

            queue.completeTask();
            console.log("200" + " , time: " + completeTime);
            reshttps.on('data', (d) => {
                datastring += d;
                // console.log("ondata");
            });

            reshttps.on('end', (d) => {
                let jsonobj = JSON.parse(datastring);
                var endTime = new Date().getTime() - startTime;
                console.log("onend_upscale: " + task.key + " , time: " + endTime);
                for (var i = 0; i < jsonobj.length; i++) {

                    var upscaleImageName = uuidv4() + "_upscale.png";
                    task.imageFileNames.push(upscaleImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + upscaleImageName, jsonobj[i], {
                        encoding: "base64",
                    });
                }
                task.sendCompleteTaskSuccess();
            });
        }
        else {
            queue.completeTask();
        }
    });

    reqhttps.setTimeout(6000000);
    reqhttps.on('error', (error) => {
        console.error(error);
        queue.completeTask();
    });

    reqhttps.write(data);
    reqhttps.end();
}

module.exports = TaskComfyUpscale;