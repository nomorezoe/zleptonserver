"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function FluxPipeImageToImage(task, req, queue) {
    console.log("FluxPipeImageToImage");

    var session = req.body.session;
    var text = req.body.prompt;

    var rawImg = req.files.imageByteArray.data;
    imgData = Buffer.from(rawImg).toString('base64');

    const promptFile = fs.readFileSync('./pipe/flux_img_2_img.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["229"]["inputs"]["clip_l"] = prompt["229"]["inputs"]["t5xxl"] = text;
    prompt["222"]["inputs"]["noise_seed"] = Tool.randomInt();
    //prompt["233"]["inputs"]["seed"] = Tool.randomInt();
    prompt["37"]["inputs"]["image"] = imgData;

    task.pipeline = "flux_image_2_image";
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
                console.log("onend_flux_img_2_img: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var styleImageName = uuidv4() + "_flux_img_2_img.png";
                    console.log("flux_img_2_img:" + styleImageName);
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

module.exports = FluxPipeImageToImage;