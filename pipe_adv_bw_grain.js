"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";
const CharacterTool = require("./character_tool");

function PipeAdvanceBWGrain() {

}


PipeAdvanceBWGrain.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, isLockCharacter, characterFile, fullCharacterPath, info) {

    console.log("PipeAdvanceBWGrain");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_bw_grain.json');//');
    let prompt = JSON.parse(promptFile);

    if (cannyStrength > 0) {
        Tool.ApplyCanny("44", "41", "3", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd);
    }

    let tailText = ",Warm color temperature, serene facial expression";

    positivePrompt += tailText;

    if (Tool.renderParams.lora_weights["bwstyle"] != undefined) {
        prompt["29"]["inputs"]["strength_model"] = Tool.renderParams.lora_weights["bwstyle"];
    }

    prompt["44"]["inputs"]["image"] = imgData;

    prompt["6"]["inputs"]["text"] = positivePrompt;
    prompt["6"]["_meta"]["info"] = info;
    console.log(positivePrompt);

    prompt["7"]["inputs"]["text"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["3"]["inputs"]["seed"] = Tool.randomInt();

    prompt["3"]["inputs"]["steps"] = sampleSteps;
    prompt["3"]["inputs"]["cfg"] = cfg;
    prompt["3"]["inputs"]["sampler_name"] = sampler;
    prompt["3"]["inputs"]["scheduler"] = scheduler;

    prompt["41"]["inputs"]["strength"] = depthStrength;
    prompt["41"]["inputs"]["start_percent"] = Tool.renderParams.depthStart;
    prompt["41"]["inputs"]["end_percent"] = Tool.renderParams.depthEnd;

    if (Tool.renderParams.loosecolor_styleintensity != undefined) {
        prompt["29"]["inputs"]["strength_model"] = Tool.renderParams.loosecolor_styleintensity;
    }
    if (Tool.renderParams.loosecolor_3deffectstrength != undefined) {
        prompt["41"]["inputs"]["strength"] = Tool.renderParams.loosecolor_3deffectstrength;
    }
    if (Tool.renderParams.loosecolor_3deffectfade != undefined) {

        prompt["41"]["inputs"]["end_percent"] = Tool.renderParams.loosecolor_3deffectfade;
    }
    if (Tool.renderParams.loosecolor_imageclarity != undefined) {
        prompt["3"]["inputs"]["denoise"] = Tool.renderParams.loosecolor_imageclarity;
    }
    
    //ch lock
    if (CharacterTool.lockChParams.isLockCharacter) {
        prompt["29"]["inputs"]["strength_model"] = 0.20;
        CharacterTool.AddAPerson(prompt, CharacterTool.characerLockPair, CharacterTool.lockChParams.fullCharacterPath, "44", "29", "3", "4", "7", "8", "9", "4");
    }
    return prompt;
}

PipeAdvanceBWGrain.quickProcess = function (positivePrompt, imgurl, imgData, req) {
    console.log("PipeAdvanceBWGrain.quickProcess");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_bw_grain.json');//');
    let prompt = JSON.parse(promptFile);

    let preText = "bwstyle pencil drawing of, <lora:bwstyle:2>, ";
    positivePrompt = preText + positivePrompt;
    let tailText = ",Warm color temperature, serene facial expression";
    let negtivePrompt = "text, watermark, low quality , deformed, bad anatomy, worst quality,  bad hands, text, error, missing fingers, extra fingers, mutated hands, poorly drawn hands, bad proportions, extra limbs, disfigured";
    positivePrompt += tailText;

    if (imgData != null) {
        prompt["44"]["inputs"]["image"] = imgData;
    }
    else {
        Tool.applyImage(prompt, "44", null, imgurl);
    }

    let sampleSteps = 20;
    let cfg = 3.5;
    let sampler = "euler";
    let scheduler = "normal";
    let depthStrength = 0.8;
    let depthStart = 0;
    let depthEnd = 0.75;

    prompt["29"]["inputs"]["strength_model"] = 0.6;

    prompt["6"]["inputs"]["text"] = positivePrompt;

    prompt["7"]["inputs"]["text"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["3"]["inputs"]["seed"] = Tool.randomInt();

    prompt["3"]["inputs"]["steps"] = sampleSteps;
    prompt["3"]["inputs"]["cfg"] = cfg;
    prompt["3"]["inputs"]["sampler_name"] = sampler;
    prompt["3"]["inputs"]["scheduler"] = scheduler;

    prompt["41"]["inputs"]["strength"] = depthStrength;
    prompt["41"]["inputs"]["start_percent"] = depthStart;
    prompt["41"]["inputs"]["end_percent"] = depthEnd;

    let depthInfluence = 0.8;
    let depthEffectFade = 0.4;
    let creativityLevel = 1.0;
   
    if (req.body.depthInfluence != undefined) {
        depthInfluence = req.body.depthInfluence;
    }
    if (req.body.depthEffectFade != undefined) {
        depthEffectFade = req.body.depthEffectFade;
    }
    if (req.body.creativityLevel != undefined) {
        creativityLevel = req.body.creativityLevel;
    }

    prompt["41"]["inputs"]["strength"] = depthInfluence;
    prompt["41"]["inputs"]["end_percent"] = depthEffectFade;
    
    prompt["3"]["inputs"]["denoise"] = creativityLevel;


    return prompt;
}

module.exports = PipeAdvanceBWGrain;