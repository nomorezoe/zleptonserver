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

    var model = "dreamshaper";
    if (req.body.model != undefined) {
        model = req.body.model
    }
    model = Tool.getModelMap(model);
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
    console.log("model:" + model);
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

    if (style == "base") {
        posPrompt = pretext + " , " + posPrompt;
    }
    // styles
    else{
        for(let i = 0; i <TaskComfyRender.styleJson.length; i ++){
            if(TaskComfyRender.styleJson[i].name == style){
                console.log("find style: " + style);
                posPrompt =  TaskComfyRender.styleJson[i].prompt.replace("{prompt}", posPrompt);
                negtext = TaskComfyRender.styleJson[i].negative_prompt;
                console.log("posprompt:" + posPrompt);
                console.log("negtext:" + negtext);
                break;
            }
        }
    }

    const promptFile = fs.readFileSync(lockCharacter ? './pipe/workflow_api_ipadapter.json' : './pipe/workflow_api.json');//');
    let prompt = JSON.parse(promptFile);

    //turn on auto lora
    if (style == "base" && model == "realismEngineSDXL_v20VAE") {
        prompt["21"]["inputs"]["switch_1"] = "On";
        prompt["21"]["inputs"]["switch_2"] = "On";
    }

    if(lora != "none"){
        for(let i = 1; i < 4; i++){
            if(prompt["21"]["inputs"]["switch_" + i] == "Off"){
                prompt["21"]["inputs"]["switch_" + i] = "On";
                prompt["21"]["inputs"]["lora_name_" + i] = lora + ".safetensors";
                break;
            }
        }
        
    }

    //lockcharacter
    if (lockCharacter) {
        try{
            var rawImg = fs.readFileSync(__dirname + OUTPUT_FOLDER + characterFile);
        }
        catch(err){
            console.log("read file err");
            queue.completeTask();
            return;
        }

        var imgBytes = rawImg.toString('base64');
        prompt["22"]["inputs"]["image"] = imgBytes;

        if (!Tool.isXLModel(model)) {
            console.log("lockCharacter SD 1.5 model");
            prompt["23"]["inputs"]["ipadapter_file"] = "ip-adapter_sd15.bin";
            prompt["25"]["inputs"]["clip_name"] = "model_15.safetensors";
        }
    }


    prompt["2"]["inputs"]["image"] = imgData;
    prompt["13"]["inputs"]["text"] = posPrompt;
    prompt["6"]["inputs"]["seed"] = Tool.randomInt(450993616797312);
    //checkpoint
    prompt["7"]["inputs"]["ckpt_name"] = model + ".safetensors";
    //others

    if (negtext.trim().length != 0) {
       
        prompt["14"]["inputs"]["text"] = negtext;// +  ", watermark, nude, nsfw, signature";
        console.log("update neg: " +  prompt["14"]["inputs"]["text"]);
    }
    else {
        console.log("skip neg");
    }

    prompt["6"]["inputs"]["steps"] = sampleSteps;
    prompt["6"]["inputs"]["cfg"] = cfg;
    prompt["6"]["inputs"]["sampler_name"] = sampler;
    prompt["6"]["inputs"]["scheduler"] = scheduler;

    prompt["5"]["inputs"]["strength"] = depthStrength;
    prompt["18"]["inputs"]["strength"] = poseStrength;

    //control net

    if (!Tool.isXLModel(model)) {
        console.log("SD 1.5 model");
        prompt["17"]["inputs"]["control_net_name"] = "control_openpose-fp16.safetensors";
        prompt["4"]["inputs"]["control_net_name"] = "control_depth-fp16.safetensors";
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
                fs.writeFileSync(__dirname + OUTPUT_FOLDER + imgname, jsonobj[i], {
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

let stylefile = fs.readFileSync("./pipe/styles.json");
TaskComfyRender.styleJson = JSON.parse(stylefile)

module.exports = TaskComfyRender;