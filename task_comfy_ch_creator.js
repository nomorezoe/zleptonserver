"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');

function TaskComfyChCreator(task, req, queue) {
    console.log("TaskComfyChCreator");

    var session = req.body.session;

    let imgData_face_mask, imgData_body_mask, imgData_pants_mask;
    var rawImg_face_mask = req.files.imageByteArray_face_mask.data;
    imgData_face_mask = Buffer.from(rawImg_face_mask).toString('base64');
    var rawImg_body_mask = req.files.imageByteArray_body_mask.data;
    imgData_body_mask = Buffer.from(rawImg_body_mask).toString('base64');
    var rawImg_pants_mask = req.files.imageByteArray_pants_mask.data;
    imgData_pants_mask = Buffer.from(rawImg_pants_mask).toString('base64');

    /*fs.writeFileSync(__dirname + OUTPUT_FOLDER + uuidv4() + "mask_0.png", imgData_face_mask,{
        encoding: "base64",
    });
    fs.writeFileSync(__dirname + OUTPUT_FOLDER + uuidv4() + "mask_1.png", imgData_body_mask,{
        encoding: "base64",
    });
    fs.writeFileSync(__dirname + OUTPUT_FOLDER + uuidv4() + "mask_2.png", imgData_pants_mask,{
        encoding: "base64",
    });
    */
    

    

    let imgData_face, imgData_body, imgData_pants;
    var rawImg_face = req.files.imageByteArray_face.data;
    imgData_face = Buffer.from(rawImg_face).toString('base64');
    var rawImg_body = req.files.imageByteArray_body.data;
    imgData_body = Buffer.from(rawImg_body).toString('base64');
    var rawImg_pants = req.files.imageByteArray_pants.data;
    imgData_pants = Buffer.from(rawImg_pants).toString('base64');
    



    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_ch_inpaint.json');
    let prompt = JSON.parse(promptFile);

    let file = req.body.fullFilePath;
    var reqModel = req.body.checkpoints;


    prompt["629"]["inputs"]["image"] = imgData_face_mask;
    prompt["632"]["inputs"]["image"] = imgData_body_mask;
    prompt["635"]["inputs"]["image"] = imgData_pants_mask;

    prompt["1"]["inputs"]["image"] = imgData_face;
    prompt["533"]["inputs"]["image"] = imgData_body;
    prompt["534"]["inputs"]["image"] = imgData_pants;

    Tool.applyImage(prompt, "336", null, file);

    Tool.applyRandomFileName(prompt);
    prompt["589"]["inputs"]["seed"] = Tool.randomInt();
    prompt["609"]["inputs"]["seed"] = Tool.randomInt();

    task.pipeline = "chinpaint";

    //var captureFile = "save.json";
    //fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, JSON.stringify(prompt), 'utf8');

    console.log("reqModel: " + reqModel);
    var model = Tool.getModelFile(reqModel);
    if (reqModel == "juggernautXL_v7") {
        model = "juggernautXL_v7Rundiffusion.safetensors";
    }
    console.log("model: " + model);
    //console.log("tags: " + req.body.tags);
    prompt["637"]["inputs"]["ckpt_name"] = model;

    let original_model = null;
    let style = null;
    var jsonSettings = null;
    if (req.body.tags != undefined) {
        console.log("tags: " + req.body.tags.prompt);
        var tagString = req.body.tags
        var tags = JSON.parse(tagString);
        if (tags.prompt) {
            var jsonString = tags.prompt.value;
            //console.log("EXif:" + jsonString);
            jsonSettings = JSON.parse(jsonString);
            for (let i in jsonSettings) {
                if (jsonSettings[i]["class_type"] == "SDXLPromptStyler") {
                    style = jsonSettings[i]["inputs"]["style"];
                    console.log("find style:" + style);
                    break;
                }
            }
            // get old model
            for (var i in jsonSettings) {
                if (jsonSettings[i]["class_type"] == "CheckpointLoaderSimple") {
                    original_model = jsonSettings[i]["inputs"]["ckpt_name"];
                    console.log("find model:" + original_model);
                    break;
                }
            }
        }
    }

    if (original_model == model) {
        console.log("same model" + model + ":" + style);
        prompt["639"]["inputs"]["style"] = style;

    }

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
                console.log("onend_ch_inpaint: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var upscaleImageName = uuidv4() + "_ch_inpaint.png";
                    console.log("chinpaint_img_name:" + upscaleImageName);
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

module.exports = TaskComfyChCreator;