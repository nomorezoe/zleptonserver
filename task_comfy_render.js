"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function getModelMap(model) {
    // ["realismEngineSDXL_v20VAE", "realisticVisionV60B1_v60B1VAE", "Deliberate_v5", "dreamshaper_8", "dynavisionXLAllInOneStylized_release0557Bakedvae"]
    switch (model) {
        case "dynavisionXL":
            return "dynavisionXLAllInOneStylized_release0557Bakedvae";
            break;
        case "realism_engine_sdxl":
            return "realismEngineSDXL_v20VAE";
            break;
        case "realistic_vision_v6":
            return "realisticVisionV60B1_v60B1VAE";
            break;
        case "dreamshaper":
            return "dreamshaper_8";
            break;
        case "Deliberate_v5":
            return "Deliberate_v5";
            break;
    }
}

function isXLModel(model) {
    if (model == "dynavisionXLAllInOneStylized_release0557Bakedvae") {
        return true;
    }
    if (model == "realismEngineSDXL_v20VAE") {
        return true;
    }
    return false;
}

function TaskComfyRender(task, req, queue) {
    console.log('TaskComfyRender');

    var rawImg = req.files.imageByteArray.data;
    imgData = Buffer.from(rawImg).toString('base64');

    var model = "dreamshaper";
    if (req.body.model != undefined) {
        model = req.body.model
    }
    model = getModelMap(model);
    var cfg = parseInt(req.body.cfg);
    var posPrompt = req.body.prompt;
    var sampleSteps =  parseInt(req.body.sampleSteps);
    //var scheduler = req.body.scheduler;
    //var sampler = req.body.sampler;
    var negtext = req.body.negtext;


    console.log("model:" + model);
    console.log("cfg:" + cfg);
    console.log("prompt:" + posPrompt);
    console.log("sampleSteps:" + sampleSteps);
   // console.log("sampler:" + sampler);
   // console.log("scheduler:" + scheduler);
    console.log("negtext:" + negtext);
    

    var depthStrength =  parseFloat(req.body.depthStrength);
    var poseStrength = parseFloat(req.body.poseStrength);

    console.log("depthStrength:" + depthStrength);
    console.log("poseStrength:" + poseStrength);


    const promptFile = fs.readFileSync('./pipe/workflow_api.json');
    let prompt = JSON.parse(promptFile);

    prompt["2"]["inputs"]["image"] = imgData;
    prompt["13"]["inputs"]["text"] = posPrompt;
    prompt["6"]["inputs"]["seed"] = Tool.randomInt(450993616797312);
    //checkpoint
    prompt["7"]["inputs"]["ckpt_name"] = model + ".safetensors";
    //others

    if(negtext.trim().length != 0){
        console.log("update neg");
        prompt["14"]["inputs"]["text"] = negtext;
    }
    else{
        console.log("skip neg");
    }
    
    prompt["6"]["inputs"]["steps"] = sampleSteps;
    prompt["6"]["inputs"]["cfg"] = cfg;
   // prompt["6"]["inputs"]["sampler_name"] = sampler;
   // prompt["6"]["inputs"]["scheduler"] = scheduler;

    prompt["5"]["inputs"]["strength"] = depthStrength;
    prompt["18"]["inputs"]["strength"] = poseStrength;

    //control net

    if(!isXLModel(model)){
        console.log("SD 1.5 model");
        prompt["17"]["inputs"]["control_net_name"]="control_openpose-fp16.safetensors";
        prompt["4"]["inputs"]["control_net_name"]="control_depth-fp16.safetensors";
    }

    var data = JSON.stringify({ "prompt": prompt });
    //console.log(data)
    console.log(data.length)
    const options = {
        hostname: 'j9e5gs4n-comfyui.bjz.edr.lepton.ai',
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

        reshttps.on('data', (d) => {
            datastring += d;
            console.log("ondata");
        });

        reshttps.on('end', (d) => {
            console.log("onend");
            const jsonobj = JSON.parse(datastring);
            for (var i = 0; i < jsonobj.length; i++) {
                var imgname = uuidv4() + ".png";
                task.imageFileNames.push(imgname);
                fs.writeFileSync(__dirname + OUTPUT_FOLDER + imgname, jsonobj[i],{
                    encoding: "base64",
                });
            }
            queue.completeTask();
        });

        if (reshttps.statusCode == 200) {
            console.log("200");
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