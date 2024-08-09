"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function TaskComfyFaceFusion(task, req, queue) {
    let promptFile = fs.readFileSync('./pipe/workflow_api_adv_face_fusion.json');
    let prompt = JSON.parse(promptFile);

    Tool.applyImage(prompt, "51", null, req.body.url);

    for (let i = 0; i < 4; i++) {
        if (req.files["imageByteArray_" + i] != undefined) {
            var rawImg = req.files["imageByteArray_" + i].data;
            imgData = Buffer.from(rawImg).toString('base64');
            prompt[(1003 + i).toString()]["inputs"]["image"] = imgData;
        }
        else {
            delete prompt[(1003 + i).toString()];
            delete prompt["5"]["inputs"]["image" + (i + 1)];
        }
    }

    task.pipeline = "adv_face_fusion";
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
                console.log("onend_ffusion: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var upscaleImageName = uuidv4() + "_ffusion.png";
                    console.log("ffusion_img_name:" + upscaleImageName);
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

module.exports = TaskComfyFaceFusion;