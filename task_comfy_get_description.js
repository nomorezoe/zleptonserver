"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');
const CharacterTool = require("./character_tool");

function TaskComfyGetDescription(task, req, queue) {
    console.log("TaskComfyGetDescription");

    var session = req.body.session;

    let filename = "./pipe/workflow_api_img_txt.json";

    const promptFile = fs.readFileSync(filename);//');
    let prompt = JSON.parse(promptFile);

    // prompt["55"]["inputs"]["text_positive"] = "A man is walking with a cat.";
    //Tool.applyImage(prompt, "2", "0e936581-ca95-4ea3-b935-ffe2dbe77604_adv_style.png", null);
    Tool.applyImage(prompt, "11", "dot.png", null, "/save/");

    if(req.body.type != undefined){
        console.log("type:" + req.body.type);
    }

    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "2", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        imgData = Buffer.from(rawImg).toString('base64');

        prompt["2"]["inputs"]["image"] = imgData;
    }

    prompt["13"]["inputs"]["seed"] = Tool.randomInt();
    
    task.pipeline = "get_desc";
    sendRequest(prompt, queue, task, req.body.type);
}

function sendRequest(promptjson, queue, task, type) {

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
                console.log("onend_get_desc: " + task.key + " , time: ");

                for (var i = 0; i < jsonobj.length; i++) {
                    var tags = ExifReader.load(Buffer.from(jsonobj[i], "base64"));
                    let desc = tags.parameters.value.split("Negative prompt")[0];
                    desc = desc.split("\n")[0];
                   
                    if(type == "sketch2photo"){
                        desc = "Cinematic photo of " + desc;
                    }

                    console.log("desc:" + desc);
                    task.imageFileNames.push(desc);
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

module.exports = TaskComfyGetDescription;