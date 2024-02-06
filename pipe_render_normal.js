"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function NormalRender() {

}

NormalRender.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath) {

    const promptFile = fs.readFileSync(isLockCharacter ? './pipe/workflow_api_ipadapter.json' : './pipe/workflow_api.json');//');
    let prompt = JSON.parse(promptFile);

    //style
    prompt["104"]["inputs"]["text_positive"] = positivePrompt;
    prompt["104"]["inputs"]["text_negative"] = negtivePrompt;
    prompt["104"]["inputs"]["style"] = style;

    //turn on lora
    for (let i = 0; i < Math.min(3,loras.length); i++) {
        if (Tool.GetLoraFile(loras[i]) != null) {
            prompt["21"]["inputs"]["switch_" + (i + 1)] = "On";
            console.log("lora:" + loras[i] + ":" + Tool.GetLoraFile(loras[i]));
            prompt["21"]["inputs"]["lora_name_" + (i + 1)] = Tool.GetLoraFile(loras[i]);
        }
    }


    //auto style pytorch_lora_weights
    if (style != "base") {
        console.log("link extra lora");
        prompt["13"]["inputs"]["clip"][0] = "101";
        prompt["14"]["inputs"]["clip"][0] = "101";

        if (!Tool.isXLModelByFile(modelFile)) {
            console.log("is 1.5 for link extra lora");
            prompt["101"]["inputs"]["lora_name"] = "LCM_LoRA_Weights_SD15.safetensors";
        }
    }

    //lockcharacter
    if (isLockCharacter) {
        console.log("isLockCharacter:");
        let value = Tool.applyImage(prompt, "22", characterFile, fullCharacterPath);
        if(!value){
            return null;
        }
        if (!Tool.isXLModelByFile(modelFile)) {
            console.log("lockCharacter SD 1.5 model");
            prompt["23"]["inputs"]["ipadapter_file"] = "ip-adapter_sd15.bin";
            prompt["25"]["inputs"]["clip_name"] = "model_15.safetensors";
        }
    }


    prompt["2"]["inputs"]["image"] = imgData;
    prompt["13"]["inputs"]["text"] = positivePrompt;
    prompt["6"]["inputs"]["seed"] = Tool.randomInt();
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