"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');

function TaskComfySuperUpscale(task, req, queue) {
    console.log("TaskComfySuperUpscale");

    var session = req.body.session;

    let jsonSettings = null;
    if (req.body.tags != undefined) {
        var tagString = req.body.tags
        var tags = JSON.parse(tagString);
        if (tags.prompt) {
            var jsonString = tags.prompt.value;
            console.log("EXif:" + jsonString);
            jsonSettings = JSON.parse(jsonString);
        }
    }

    let prompt = null;
    if (jsonSettings != null && (Tool.checkIsSamePipeLine(jsonSettings, "/advance/flux_stage_canny.json")
        || Tool.checkIsSamePipeLine(jsonSettings, "/advance/flux_stage_depth.json") ||
        Tool.checkIsSamePipeLine(jsonSettings, "/advance/flux_stage_hed.json"))) {
        prompt = processFluxSuperScale(task, req);
    }
    else {
        prompt = processCommonSuperScale(task, req);
    }

    sendRequest(prompt, queue, task);
}

function processCommonSuperScale(task, req) {
    console.log("processCommonSuperScale");

    var fullfilepath = req.body.fullfilepath;

    console.log("fullfilepath" + fullfilepath);

    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_super_scale.json');
    let prompt = JSON.parse(promptFile);
    prompt["168"]["inputs"]["seed"] = Tool.randomInt();
    prompt["236"]["inputs"]["url"] = fullfilepath;

    task.pipeline = "super_upscale";
    //
    Tool.applyRandomFileName(prompt);
    return prompt;
}

function processFluxSuperScale(task, req) {
    console.log("processFluxSuperScale");


    task.pipeline = "flux_super_upscale";

    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_flux_super_scale.json');
    let prompt = JSON.parse(promptFile);
    var fullfilepath = req.body.fullfilepath;
    //lockcharacter
    /*if (isLockCharacter) {
        
    }*/

    prompt["106"]["inputs"]["seed"] = Tool.randomInt();
    Tool.applyImage(prompt, "94", null, fullfilepath);
    // promptjson["2"]["inputs"]["image"] = imgBytes;

    //if (prompt != null && prompt != '' && prompt != "") {
    // promptjson["6"]["inputs"]["text_positive"] = prompt;
    //}

    //if (history_neg != null && history_neg != '' && history_neg != "") {
    // promptjson["112"]["inputs"]["text_negative"] = history_neg;
    //}

    return prompt; ß

}

function sendRequest(promptjson, queue, task) {

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": promptjson }));

    //send request
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
        timeout: 2000,
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
                console.log("onend_super_upscale: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var upscaleImageName = uuidv4() + "_s_upscale.png";
                    console.log("upscaleImageName:" + upscaleImageName);
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

module.exports = TaskComfySuperUpscale;