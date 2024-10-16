"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');

function TaskComfyGetFaces(task, req, queue) {
    console.log("TaskComfyGetFaces");

    var session = req.body.session;

    const promptFile = fs.readFileSync('./pipe/get_face_masks.json');
    let prompt = JSON.parse(promptFile);

    let isUpscaleImage = false;

    console.log("req.body.img_url " + req.body.img_url );
    if(req.body.img_url != undefined && req.body.img_url != null){
        var maskUrl = req.body.img_url;
        Tool.applyImage(prompt, "5", null, maskUrl);
    }
    else{
        var rawImg = req.files.img_data.data;
        prompt["5"]["inputs"]["image"] = Buffer.from(rawImg).toString('base64');
    }
   
    isUpscaleImage = true;
    //prompt["1"]["inputs"]["crop_factor"] = 6;

   
    if (req.body.type == "body") {
        prompt["20"]["inputs"]["model_name"] = "segm/person_yolov8m-seg.pt";
    }

    task.pipeline = "get_mask";
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
                console.log("onendface: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var maskImageName = uuidv4() + "_faces.png";
                    console.log("face:" + maskImageName);
                    task.imageFileNames.push(maskImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + maskImageName, jsonobj[i], {
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

module.exports = TaskComfyGetFaces;