"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function FluxPipeTextToLooseColor(task, req, queue) {
    console.log("FluxPipeTextToLooseColor");
    var session = req.body.session;
    var text = req.body.prompt;

    const promptFile = fs.readFileSync('./pipe/flux_text_2_loose_color_model.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["6"]["inputs"]["text"] = "(colorart), " + text;
    prompt["25"]["inputs"]["noise_seed"] = Tool.randomInt();

    let size = Tool.getImageSizeByFrameSize(req.body.framesize);
    prompt["27"]["inputs"]["width"] = size.width;
    prompt["27"]["inputs"]["height"] = size.height;

    task.pipeline = "flux_text_to_loosecolor";
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
                console.log("onend_flux_txt_to_lc: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var styleImageName = uuidv4() + "_flux_txt_to_lc.png";
                    console.log("flux_txt_to_lc:" + styleImageName);
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

module.exports = FluxPipeTextToLooseColor;