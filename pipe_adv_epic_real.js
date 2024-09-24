"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";
const CharacterTool = require("./character_tool");

function PipeAdvanceEpicReal() {

}

PipeAdvanceEpicReal.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, hasBackDrop, isLockCharacter, characterFile, fullCharacterPath, info, hasAnimal) {
    console.log("PipeAdvanceEpicReal.process");


    let promptFile = null;
    let prompt = null;
    if (hasAnimal) {
        console.log("has animal");
        promptFile = fs.readFileSync('./pipe/workflow_api_adv_epic_real_animal.json');
        prompt = JSON.parse(promptFile);

        if (cannyStrength > 0) {
            Tool.ApplyCanny("1", "232", "246", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd, 0.01, 0.25, "control_v11p_sd15_canny.pth");
        }

        prompt["246"]["inputs"]["strength"] = Tool.renderParams.animalStrength;
        prompt["246"]["inputs"]["start_percent"] = Tool.renderParams.animalStart;
        prompt["246"]["inputs"]["end_percent"] = Tool.renderParams.animalEnd;

    }
    else {
        promptFile = fs.readFileSync('./pipe/workflow_api_adv_epic_real.json');//');
        prompt = JSON.parse(promptFile);

        if (cannyStrength > 0) {
            Tool.ApplyCanny("1", "232", "45", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd, 0.01, 0.25, "control_v11p_sd15_canny.pth");
        }

        if (hasBackDrop) {
            //prompt["232"]["inputs"]["end_percent"] = 0.75;
        }
    }





    let tailText = " HDR, masterpiece, high quality, high resolution, 4K, HDR, ";

    positivePrompt += tailText;


    prompt["1"]["inputs"]["image"] = imgData;

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    //prompt["6"]["_meta"]["info"] = info;

    console.log(positivePrompt);

    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["45"]["inputs"]["seed"] = Tool.randomInt();
    prompt["45"]["inputs"]["steps"] = sampleSteps;
    prompt["45"]["inputs"]["cfg"] = cfg;
    prompt["45"]["inputs"]["sampler_name"] = sampler;
    prompt["45"]["inputs"]["scheduler"] = scheduler;

    prompt["232"]["inputs"]["strength"] = depthStrength;
    prompt["232"]["inputs"]["start_percent"] = Tool.renderParams.depthStart;
    prompt["232"]["inputs"]["end_percent"] = Tool.renderParams.depthEnd;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["181"]["inputs"]["start_percent"] = Tool.renderParams.poseStart;
    prompt["181"]["inputs"]["end_percent"] = Tool.renderParams.poseEnd;

    if (hasAnimal) {

    }

    console.log("loras" + loras);

    if (Tool.renderParams.lora_weights["BetterPhotography"] != undefined) {
        prompt["54"]["inputs"]["switch_2"] = "On";
        prompt["54"]["inputs"]["model_weight_2"] = Tool.renderParams.lora_weights["BetterPhotography"];
        console.log("lora BetterPhotography On");

    }

    if (Tool.renderParams.poseInfluence != undefined) {
        prompt["181"]["inputs"]["strength"] = Tool.renderParams.poseInfluence;
    }
    if (Tool.renderParams.poseEffectFade != undefined) {
        prompt["181"]["inputs"]["end_percent"] = Tool.renderParams.poseEffectFade;
    }
    if (Tool.renderParams.depthInfluence != undefined) {
        prompt["232"]["inputs"]["strength"] = Tool.renderParams.depthInfluence;
    }
    if (Tool.renderParams.depthEffectFade != undefined) {
        prompt["232"]["inputs"]["end_percent"] = Tool.renderParams.depthEffectFade;
    }
    if (Tool.renderParams.creativityLevel != undefined) {
        prompt["45"]["inputs"]["denoise"] = Tool.renderParams.creativityLevel;
    }

    //ch lock
    if (CharacterTool.lockChParams.isLockCharacter) {
        prompt["54"]["inputs"]["model_weight_2"] = 0.20;
        CharacterTool.AddAPerson(prompt, CharacterTool.characerLockPair, CharacterTool.lockChParams.fullCharacterPath, "1", "53", "45", "245", "230", "49", "224", "4");
    }

    return prompt;
}

PipeAdvanceEpicReal.quickProcess = function (positivePrompt, imgurl, imgData) {
    console.log("PipeAdvanceEpicReal.quickProcess");

    let promptFile = fs.readFileSync('./pipe/workflow_api_adv_epic_real.json');//');
    let prompt = JSON.parse(promptFile);


    let preText = " photo in phst artstyle, ";
    let tailText = " HDR, masterpiece, high quality, high resolution, 4K, HDR, ";
    positivePrompt = preText + positivePrompt;
    positivePrompt += tailText;

    if (imgData != null) {
        prompt["1"]["inputs"]["image"] = imgData;
    }
    else {
        Tool.applyImage(prompt, "1", null, imgurl);
    }


    let steps = 20;
    let cfg = 5;
    let sampler = "dpmpp_sde";
    let scheduler = "karras";
    let poseStrength = 0.5;
    let poseStart = 0;
    let poseEnd = 0.65;
    let depthStrength = 0.5;
    let depthStart = 0;
    let depthEnd = 0.75;
    let cannyStrength = 0.3;
    let cannyStart = 0;
    let cannyEnd = 0.75;
    let animalStrength = 0.4;
    let animalStart = 0;
    let animalEnd = 0.42;

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;

    prompt["45"]["inputs"]["seed"] = Tool.randomInt();
    prompt["45"]["inputs"]["steps"] = steps;
    prompt["45"]["inputs"]["cfg"] = cfg;
    prompt["45"]["inputs"]["sampler_name"] = sampler;
    prompt["45"]["inputs"]["scheduler"] = scheduler;

    prompt["232"]["inputs"]["strength"] = depthStrength;
    prompt["232"]["inputs"]["start_percent"] = depthStart;
    prompt["232"]["inputs"]["end_percent"] = depthEnd;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["181"]["inputs"]["start_percent"] = poseStart;
    prompt["181"]["inputs"]["end_percent"] = poseEnd;

    Tool.ApplyCanny("1", "232", "45", prompt, cannyStrength, cannyStart, cannyEnd, 0.01, 0.25, "control_v11p_sd15_canny.pth");
    


    return prompt;
}

module.exports = PipeAdvanceEpicReal;