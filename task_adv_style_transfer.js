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
    var type = req.body.type;

    let promptFile = fs.readFileSync(type == "sketch2photo" ? './pipe/new_style_transfer_combine_no_ipadapter.json' : './pipe/new_style_transfer_combine.json');
    let prompt = JSON.parse(promptFile);

    switch (type) {
        case "bw2color":
            for (let i = 0; i < 5; i++) {
                Tool.addBW2ColorImageJson(prompt, i + 1, "29", "15");
            }

            prompt["4"]["inputs"]["ckpt_name"] = "dreamshaperXL_v21TurboDPMSDE.safetensors";

            //delete LineArtPreprocessor
            prompt["21"]["inputs"]["image"] = ["25", 0];
            delete prompt["26"];
            break;
        case "sketch2photo":

            //delete ImageInvert
            delete prompt["25"];
            break;
        default:
            for (let i = 0; i < 5; i++) {
                if (req.body["img_ref_" + i] != undefined
                    && req.body["img_ref_" + i] != null
                    && req.body["img_ref_" + i] != "null"
                ) {
                    Tool.addStyleTransferImageJson(prompt, req.body["img_ref_" + i], false, i + 1, "29", "15");
                }
            }

            //delete ImageInvert
            delete prompt["25"];
            break;
    }

    if (req.body.url != undefined) {
        Tool.applyImage(prompt, "10", null, req.body.url);
    }
    else {
        var rawImg = req.files.imageByteArray.data;
        imgData = Buffer.from(rawImg).toString('base64');

        /*var captureFile = uuidv4() + "_scribble_capture.png";
        fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, imgData, {
            encoding: "base64",
        });*/

        prompt["10"]["inputs"]["image"] = imgData;
    }

    console.log("req.body.is_superstyle" + req.body.is_superstyle);
    if (prompt["28"] != undefined) {
        if (parseInt(req.body.is_superstyle) == 1) {
            console.log("is_superstyle");
            prompt["28"]["inputs"]["weight_type"] = "strong style transfer";
        }
    }


    console.log("styleStrength: " + req.body.styleStrength);
    console.log("shapePrecision: " + req.body.shapePrecision);
    console.log("originalClarity: " + req.body.originalClarity);

    //req.body.shapePrecision
    let shapeV = parseFloat(req.body.shapePrecision);/// 100.0
    console.log("shapeV:" + shapeV);
    //default 
    if (shapeV >= 0.5) {
        prompt["21"]["inputs"]["strength"] = 0.6 + (shapeV - 0.5) * 0.8;
        prompt["21"]["inputs"]["end_percent"] = 0.6 + (shapeV - 0.5) * 0.8;
    }
    else {
        prompt["21"]["inputs"]["strength"] = 0.6 + (shapeV - 0.5) * 1.2;
        prompt["21"]["inputs"]["end_percent"] = 0.6 + (shapeV - 0.5) * 1.2;
    }

    console.log("shapeV: " + prompt["21"]["inputs"]["strength"]);

    //req.body.styleStrength
    if (prompt["28"] != undefined) {
        let styleV = parseFloat(req.body.styleStrength);/// 100.0
        console.log("styleV:" + styleV);
        if (styleV >= 0.5) {
            prompt["28"]["inputs"]["weight"] = 0.9 + (styleV - 0.5) * 0.2;
        }
        else {
            prompt["28"]["inputs"]["weight"] = 0.9 + (styleV - 0.5) * 1.8;
        }

        console.log("styleV: " + prompt["28"]["inputs"]["weight"]);
    }



    //req.body.originalClarity
    let clarityV = parseFloat(req.body.originalClarity);/// 100.0
    console.log("clarityV:" + clarityV);

    if (clarityV >= 0.5) {
        prompt["3"]["inputs"]["denoise"] = 0.8 + (clarityV - 0.5) * 0.4;
    }
    else {
        prompt["3"]["inputs"]["denoise"] = 0.8 + (clarityV - 0.5) * 1.6;
    }

    console.log("clarityV: " + prompt["3"]["inputs"]["denoise"]);


    //var captureFile = "save.json";
    //fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, JSON.stringify(prompt), 'utf8');

    task.pipeline = "adv_style_transfer";
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