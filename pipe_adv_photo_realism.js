"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";
const CharacterTool = require("./character_tool");

function PipeAdvancePhotoRealism() {

}

PipeAdvancePhotoRealism.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, hasBackDrop, info) {

    console.log("PipeAdvancePhotoRealism");
    let promptFile;
    promptFile = fs.readFileSync('./pipe/workflow_api_adv_realism_photo.json');//');



    let prompt = JSON.parse(promptFile);

    if (cannyStrength > 0) {
        Tool.ApplyCanny("1", "182", "192", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd, 0.01, 0.25, "diffuserscontrolnet-canny-sdxl-1.0.safetensors");

        if (hasBackDrop) {
            // prompt["182"]["inputs"]["end_percent"] = 0.75;
            prompt["33"]["inputs"]["resolution"] = 1024;
        }
    }


    prompt["1"]["inputs"]["image"] = imgData;

    let tailText = "cinematic lighting, masterpiece, high quality, high resolution, 4K, HDR";
    let tailTexts = tailText.split(",");
    for (let i in tailTexts) {
        if (positivePrompt.indexOf(tailTexts[i]) == -1) {
            positivePrompt += " " + tailTexts[i] + ",";
        }
    }

    console.log("positivePrompt:" + positivePrompt);

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    prompt["55"]["_meta"]["info"] = info;
    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;

    //prompt["55"]["inputs"]["style"] = style;

    prompt["192"]["inputs"]["noise_seed"] = Tool.randomInt();
    prompt["193"]["inputs"]["noise_seed"] = Tool.randomInt();


    prompt["192"]["inputs"]["steps"] = sampleSteps;
    prompt["192"]["inputs"]["cfg"] = cfg;
    prompt["192"]["inputs"]["sampler_name"] = sampler;
    prompt["192"]["inputs"]["scheduler"] = scheduler;

    prompt["193"]["inputs"]["steps"] = sampleSteps;
    prompt["193"]["inputs"]["cfg"] = cfg;
    prompt["193"]["inputs"]["sampler_name"] = sampler;
    prompt["193"]["inputs"]["scheduler"] = scheduler;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["181"]["inputs"]["start_percent"] = Tool.renderParams.poseStart;
    prompt["181"]["inputs"]["end_percent"] = Tool.renderParams.poseEnd;

    prompt["182"]["inputs"]["strength"] = depthStrength;
    prompt["182"]["inputs"]["start_percent"] = Tool.renderParams.depthStart;
    prompt["182"]["inputs"]["end_percent"] = Tool.renderParams.depthEnd;



    //lora

    console.log("loras" + loras);
    if (Tool.renderParams.lora_weights["real-humans-PublicPrompts"] != undefined) {
        prompt["52"]["inputs"]["switch_1"] = "On";
        prompt["52"]["inputs"]["model_weight_1"] = Tool.renderParams.lora_weights["real-humans-PublicPrompts"];
        console.log("lora real-humans-PublicPrompts On");
    }

    if (Tool.renderParams.lora_weights["Cinematic_Hollywood_Film"] != undefined) {
        prompt["54"]["inputs"]["model_weight_1"] = Tool.renderParams.lora_weights["Cinematic_Hollywood_Film"];
        console.log("lora Cinematic_Hollywood_Film On");
    }
    else {
        prompt["54"]["inputs"]["switch_1"] = "Off";
    }

    if (Tool.renderParams.lora_weights["BetterPhotography"] != undefined) {
        prompt["54"]["inputs"]["model_weight_2"] = Tool.renderParams.lora_weights["BetterPhotography"];
        console.log("lora BetterPhotography On");
    }
    else {
        prompt["54"]["inputs"]["switch_2"] = "Off";
    }

    //ch lock
    if (CharacterTool.lockChParams.isLockCharacter) {
        CharacterTool.AddAPerson(prompt, CharacterTool.characerLockPair, CharacterTool.lockChParams.fullCharacterPath, "1", "53", "192", "69", "68", "194", "223", "4");
    }
    return prompt;
}

module.exports = PipeAdvancePhotoRealism;