"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function NormalRender() {

}

NormalRender.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile) {

    //update style
    if (style != "base") {
        let styleInfo = Tool.getStyledPrompt(style, positivePrompt);
        positivePrompt = styleInfo[0];
        negtivePrompt = styleInfo[1] + negtivePrompt;

        console.log("styled prompt: " + positivePrompt);
        console.log("styled negprompt: " + negtivePrompt);
    }

    const promptFile = fs.readFileSync(isLockCharacter ? './pipe/workflow_api_ipadapter.json' : './pipe/workflow_api.json');//');
    let prompt = JSON.parse(promptFile);

    //turn on lora
    for (let i = 0; i < loras.length; i++) {
        if (Tool.GetLoraFile(loras[i]) != null) {
            prompt["21"]["inputs"]["switch_" + (i + 1)] = "On";
            console.log("lora:" + loras[i] + ":" + Tool.GetLoraFile(loras[i]));
            prompt["21"]["inputs"]["lora_name_" + (i + 1)] = Tool.GetLoraFile(loras[i]);
        }
    }


    //auto style pytorch_lora_weights
    if (style != "base") {
        console.log("link extra lora");
        prompt["100"]["inputs"]["text"] = style;
        prompt["13"]["inputs"]["clip"][0] = "101";
        prompt["14"]["inputs"]["clip"][0] = "101";

        if (!Tool.isXLModelByFile(modelFile)) {
            console.log("is 1.5 for link extra lora");
            prompt["101"]["inputs"]["lora_name"] = "LCM_LoRA_Weights_SD15.safetensors";
        }
    }

    //lockcharacter
    if (isLockCharacter) {
        try {
            var rawImg = fs.readFileSync(__dirname + OUTPUT_FOLDER + characterFile);
        }
        catch (err) {
            console.log("read file err");
            //queue.completeTask();
            return null;
        }

        var imgBytes = rawImg.toString('base64');
        prompt["22"]["inputs"]["image"] = imgBytes;

        if (!Tool.isXLModelByFile(modelFile)) {
            console.log("lockCharacter SD 1.5 model");
            prompt["23"]["inputs"]["ipadapter_file"] = "ip-adapter_sd15.bin";
            prompt["25"]["inputs"]["clip_name"] = "model_15.safetensors";
        }
    }


    prompt["2"]["inputs"]["image"] = imgData;
    prompt["13"]["inputs"]["text"] = positivePrompt;
    prompt["6"]["inputs"]["seed"] = Tool.randomInt(450993616797312);
    //checkpoint
    prompt["7"]["inputs"]["ckpt_name"] = modelFile;
    console.log("ckpt_name:" + modelFile);

    //others
    prompt["14"]["inputs"]["text"] = negtivePrompt;

    prompt["6"]["inputs"]["steps"] = sampleSteps;
    prompt["6"]["inputs"]["cfg"] = cfg;
    prompt["6"]["inputs"]["sampler_name"] = sampler;
    prompt["6"]["inputs"]["scheduler"] = scheduler;

    prompt["5"]["inputs"]["strength"] = depthStrength;
    prompt["18"]["inputs"]["strength"] = poseStrength;

    //control net
    if (!Tool.isXLModelByFile(modelFile)) {
        console.log("SD 1.5 model");
        prompt["17"]["inputs"]["control_net_name"] = "control_v11p_sd15_openpose.pth";
        prompt["4"]["inputs"]["control_net_name"] = "control_v11f1p_sd15_depth.pth";
    }

    return prompt;
}

module.exports = NormalRender;