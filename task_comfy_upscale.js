"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');
//const sizeOf = require('buffer-image-size');

function TaskComfyUpscale(task, req, queue) {

    var imageFileName = req.body.file;
    var session = req.body.session;
    var denoiseValue = req.body.denoisevalue;
    var prompt = req.body.prompt;

    console.log("denoiseValue:" + denoiseValue);
    console.log("imageFileName" + imageFileName);
    console.log("prompt" + prompt);

    try {
        var rawImg = fs.readFileSync(__dirname + OUTPUT_FOLDER + imageFileName);
    }
    catch (err) {
        console.log("read file err:" + err);
        queue.completeTask();
        return;
    }
    var imgBytes = rawImg.toString('base64');

    var upscaleImageName = uuidv4() + "_upscale.png";

    // get old style
    const tags = ExifReader.load(rawImg);
    let style = null;
    let negtext = null;
    if (tags.prompt) {
        console.log("Tags:" + tags.prompt.value);

        var jsonString = tags.prompt.value;
        //console.log("EXif:" + jsonString);
        var jsonSettings = JSON.parse(jsonString);
        for (let i in jsonSettings) {
            if (jsonSettings[i]["class_type"] == "CLIPTextEncode") {
                let text = jsonSettings[i]["inputs"]["text"];
                style = Tool.getStyleFromNegPrompt(text);
                if (style != null) {
                    break;
                }
            }
        }
    }

    if (style) {
        let styleInfo = Tool.getStyledPrompt(style, prompt, negtext);
        prompt = styleInfo[0];
        negtext = styleInfo[1];

        console.log("styled prompt: " + prompt);
        console.log("styled negprompt: " + negtext);
    }

    let model = null;
    // get old model
    for (var i in jsonSettings) {
        if (jsonSettings[i]["class_type"] == "CheckpointLoaderSimple") {
            if (Tool.isQualifiedCkpt(jsonSettings[i]["inputs"]["ckpt_name"])) {
                model = jsonSettings[i]["inputs"]["ckpt_name"];
                console.log("find" + model);
                break;
            }
        }
    }

    const promptFile = fs.readFileSync('./pipe/workflow_api_upscale_face_denoise.json');
    let promptjson = JSON.parse(promptFile);

    promptjson["2"]["inputs"]["image"] = imgBytes;
    promptjson["13"]["inputs"]["text"] = prompt;
    if (negtext != null) {
        promptjson["14"]["inputs"]["text"] = negtext;
    }
    if (model != null) {
        promptjson["6"]["inputs"]["ckpt_name"] = model;
    }
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



        if (reshttps.statusCode == 200) {
            console.log("200");
            reshttps.on('data', (d) => {
                datastring += d;
                // console.log("ondata");
            });

            reshttps.on('end', (d) => {
                let jsonobj = JSON.parse(datastring);

                console.log("onend" + jsonobj.length);
                for (var i = 0; i < jsonobj.length; i++) {
                    task.imageFileNames.push(upscaleImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + upscaleImageName, jsonobj[i], {
                        encoding: "base64",
                    });
                }
                queue.completeTask();
            });
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