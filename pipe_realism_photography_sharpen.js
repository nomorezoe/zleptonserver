"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function RealismPhotographySharpenRender() {

}

RealismPhotographySharpenRender.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile) {

    console.log("RealismPhotographySharpenRender");
    const promptFile = fs.readFileSync('./pipe/workflow_realism_engine_photography_sharpen.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["1"]["inputs"]["image"]=imgData;

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    prompt["55"]["inputs"]["style"] = style;

    prompt["45"]["inputs"]["seed"] =  Tool.randomInt(450993616797312);
    prompt["45"]["inputs"]["steps"] = sampleSteps;
    prompt["45"]["inputs"]["cfg"] = cfg;
    prompt["45"]["inputs"]["sampler_name"] = sampler;
    prompt["45"]["inputs"]["scheduler"] = scheduler;

    prompt["35"]["inputs"]["strength"] = poseStrength;
    prompt["34"]["inputs"]["strength"] = depthStrength;

    return prompt;

}

module.exports = RealismPhotographySharpenRender;
