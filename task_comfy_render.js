"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');



function TaskComfyRender(task, req, queue) {
    console.log('TaskComfyRender');

    var rawImg = req.files.imageByteArray.data;
    imgData = Buffer.from(rawImg).toString('base64');

    var model = "dynavisionXL";
    if (req.body.model != undefined) {
        model = req.body.model
    }
    console.log("1_model:" + model);
    model = Tool.getModelFile(model);
    var cfg = parseInt(req.body.cfg);
    var posPrompt = req.body.prompt;
    var sampleSteps = parseInt(req.body.sampleSteps);
    var scheduler = req.body.scheduler;
    var sampler = req.body.sampler;
    var negtext = req.body.negtext;
    var pretext = req.body.pretext;
    var style = req.body.style;
    var lora = req.body.lora;



    console.log("style:" + style);
    console.log("lora:" + lora);
    console.log("pretext:" + pretext);
    console.log("2_model:" + model);
    console.log("cfg:" + cfg);
    console.log("prompt:" + posPrompt);
    console.log("sampleSteps:" + sampleSteps);
    console.log("sampler:" + sampler);
    console.log("scheduler:" + scheduler);
    console.log("negtext:" + negtext);

    var depthStrength = parseFloat(req.body.depthStrength);
    var poseStrength = parseFloat(req.body.poseStrength);

    console.log("depthStrength:" + depthStrength);
    console.log("poseStrength:" + poseStrength);

    var lockCharacter = (req.body.lockCharacter == 1) && (req.body.characterFile != undefined);
    var characterFile = "";
    if (lockCharacter) {
        console.log("lockcharacter");
        characterFile = req.body.characterFile;
    }

    //add pretext
    posPrompt = pretext + " , " + posPrompt;

    //update style
    if (style != "base") {
        let styleInfo = Tool.getStyledPrompt(style, posPrompt);
        posPrompt = styleInfo[0];
        negtext = styleInfo[1] + negtext;

        console.log("styled prompt: " + posPrompt);
        console.log("styled negprompt: " + negtext);
    }

    const promptFile = fs.readFileSync(lockCharacter ? './pipe/workflow_api_ipadapter.json' : './pipe/workflow_api.json');//');
    let prompt = JSON.parse(promptFile);

    //turn on lora
    if(lora != ""){
        let loras = lora.split(",");
        for (let i = 0; i < loras.length; i++) {
            if(Tool.GetLoraFile(loras[i])!= null){
                prompt["21"]["inputs"]["switch_" + (i + 1)] = "On";
                console.log("lora:" + loras[i] + ":" + Tool.GetLoraFile(loras[i]));
                prompt["21"]["inputs"]["lora_name_" + (i + 1)] = Tool.GetLoraFile(loras[i]);
            }
           
        }
    }
    

    //auto style pytorch_lora_weights
    if (style != "base") {
        console.log("link extra lora");
        prompt["100"]["inputs"]["text"] = style;
        prompt["13"]["inputs"]["clip"][0] = "101";
        prompt["14"]["inputs"]["clip"][0] = "101";

        if (!Tool.isXLModelByFile(model)) {
            console.log("is 1.5 for link extra lora");
            prompt["101"]["inputs"]["lora_name"] = "pytorch_lora_weights_1.5.safetensors";
        }
    }

    //lockcharacter
    if (lockCharacter) {
        try {
            var rawImg = fs.readFileSync(__dirname + OUTPUT_FOLDER + characterFile);
        }
        catch (err) {
            console.log("read file err");
            queue.completeTask();
            return;
        }

        var imgBytes = rawImg.toString('base64');
        prompt["22"]["inputs"]["image"] = imgBytes;

        if (!Tool.isXLModelByFile(model)) {
            console.log("lockCharacter SD 1.5 model");
            prompt["23"]["inputs"]["ipadapter_file"] = "ip-adapter_sd15.bin";
            prompt["25"]["inputs"]["clip_name"] = "model_15.safetensors";
        }
    }


    prompt["2"]["inputs"]["image"] = imgData;
    prompt["13"]["inputs"]["text"] = posPrompt;
    prompt["6"]["inputs"]["seed"] = Tool.randomInt(450993616797312);
    //checkpoint
    prompt["7"]["inputs"]["ckpt_name"] = model;
    console.log("ckpt_name:" + model);

    //others
    prompt["14"]["inputs"]["text"] = negtext;

    prompt["6"]["inputs"]["steps"] = sampleSteps;
    prompt["6"]["inputs"]["cfg"] = cfg;
    prompt["6"]["inputs"]["sampler_name"] = sampler;
    prompt["6"]["inputs"]["scheduler"] = scheduler;

    prompt["5"]["inputs"]["strength"] = depthStrength;
    prompt["18"]["inputs"]["strength"] = poseStrength;

    //control net
    if (!Tool.isXLModelByFile(model)) {
        console.log("SD 1.5 model");
        prompt["17"]["inputs"]["control_net_name"] = "control_v11p_sd15_openpose.pth";
        prompt["4"]["inputs"]["control_net_name"] = "control_v11f1p_sd15_depth.pth";
    }

    var data = JSON.stringify({ "prompt": prompt });
    //console.log(data)
    console.log(data.length)
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
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
            console.log("200");

            reshttps.on('data', (d) => {
                datastring += d;
                //console.log("ondata");
            });

            reshttps.on('end', (d) => {
                console.log("onend");
                const jsonobj = JSON.parse(datastring);
                for (var i = 0; i < jsonobj.length; i++) {
                    var imgname = uuidv4() + ".png";
                    task.imageFileNames.push(imgname);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + imgname, jsonobj[i], {
                        encoding: "base64",
                    });
                }
                queue.completeTask();
            });

        }
        else {
            queue.completeTask();
        }
    });

    reqhttps.on('error', (error) => {
        console.error(error);
        queue.completeTask();
    });

    reqhttps.write(data);
    reqhttps.end();

}


module.exports = TaskComfyRender;