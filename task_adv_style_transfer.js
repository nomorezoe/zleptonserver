"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function TaskAdvanceStyleTransfer(task, req, queue) {
    
    console.log("TaskAdvanceStyleTransfer");

    var session = req.body.session;


    let promptFile = fs.readFileSync('./pipe/new_style_transfer_combine.json');
    let prompt = JSON.parse(promptFile);

    for (let i = 0; i < 5; i++) {
        if (req.body["img_ref_" + i] != undefined) {
            addImageJson(prompt, req.body["img_ref_" + i], i + 1);
        }
    }

    if (req.body.type == "bw2color") {
        prompt["21"]["inputs"]["image"] = ["25", 0];
        delete prompt["26"];
    }
    else{
        delete prompt["25"];
    }

    Tool.applyImage(prompt, "10", null, req.body.url);
    console.log("req.body.is_superstyle"+req.body.is_superstyle);
    if(parseInt(req.body.is_superstyle) == 1){
        console.log("is_superstyle");
        prompt["28"]["inputs"]["weight_type"] = "strong style transfer";
    }


    console.log("styleStrength: " + req.body.styleStrength);
    console.log("shapePrecision: " + req.body.shapePrecision);
    console.log("originalClarity: " + req.body.originalClarity);

    //var captureFile = "save.json";
    //fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, JSON.stringify(prompt), 'utf8');

    task.pipeline = "adv_style_transfer";
    sendRequest(prompt, queue, task);
}

function addImageJson(prompt, img_ref, index) {
    //load image
    let json = {
        "inputs": {
            "url": "",
            "keep_alpha_channel": false,
            "output_mode": false
        },
        "class_type": "LoadImageFromUrl"
    }
    json["inputs"]["url"] = img_ref;
    let jsonIndex = (index + 10000).toString();
    prompt[jsonIndex] = json;

    let json2 = {
        "inputs": {
            "interpolation": "LANCZOS",
            "crop_position": "center",
            "sharpening": 0,
            "image": [
                jsonIndex,
                0
            ]
        },
        "class_type": "PrepImageForClipVision",
        "_meta": {
            "title": "Prep Image For ClipVision"
        }
    }

    let jsonIndex2 = (index + 10001).toString();
    prompt[jsonIndex2] = json2;

    let json3 = {
        "inputs": {
            "weight": 1,
            "ipadapter": [
                "15",
                1
            ],
            "image": [
                jsonIndex2,
                0
            ]
        },
        "class_type": "IPAdapterEncoder",
        "_meta": {
            "title": "IPAdapter Encoder"
        }
    }

    let jsonIndex3 = (index + 10002).toString();
    prompt[jsonIndex3] = json3;

    prompt["29"]["inputs"]["embed" + index.toString()] = [jsonIndex3, 0];
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

                    var styleImageName = uuidv4() + "_adv_style.png";
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

module.exports = TaskAdvanceStyleTransfer;