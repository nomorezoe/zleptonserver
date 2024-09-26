"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function FluxPipeImageEnhance(task, req, queue) {
    console.log("FluxPipeImageehance");

    var session = req.body.session;
    var text = req.body.prompt;

    console.log("enhance scale:" + req.body.scale);

    const promptFile = fs.readFileSync('./pipe/advance/flux_enhance.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["40"]["inputs"]["text"] = "Create a cinematic image of " + text;
    prompt["39"]["inputs"]["seed"] = Tool.randomInt();
    prompt["46"]["inputs"]["seed"] = Tool.randomInt();

    if (req.body.imageUrl != undefined) {
        Tool.applyImage(prompt, "43", null, req.body.imageUrl);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        let imgData = Buffer.from(rawImg).toString('base64');
        prompt["43"]["inputs"]["image"] = imgData;
    }


    task.pipeline = "flux_image_enhance";
    sendRequest(prompt, queue, task);
}


function sendRequest(promptjson, queue, task) {

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": promptjson }));

    //send request
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
        timeout: 0,
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
                console.log("onende_flux_img_enhance: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var styleImageName = uuidv4() + "_flux_img_enhancer.png";
                    console.log("flux_img_enhance:" + styleImageName);
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

module.exports = FluxPipeImageEnhance;