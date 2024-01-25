"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function DeliberatePhotographyRender() {

}

DeliberatePhotographyRender.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile) {

    console.log("DeliberatePhotographyRender");
    const promptFile = fs.readFileSync('./pipe/workflow_deliberate_photography.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["1"]["inputs"]["image"]=imgData;
    prompt["4"]["inputs"]["ckpt_name"] = modelFile;

    prompt["49"]["inputs"]["text_positive"] = positivePrompt;
    prompt["49"]["inputs"]["text_negative"] = negtivePrompt;
    prompt["49"]["inputs"]["style"] = style;

    /*prompt["45"]["inputs"]["seed"] =  Tool.randomInt(450993616797312);
    prompt["45"]["inputs"]["steps"] = sampleSteps;
    prompt["45"]["inputs"]["cfg"] = cfg;
    prompt["45"]["inputs"]["sampler_name"] = sampler;
    prompt["45"]["inputs"]["scheduler"] = scheduler;
    */

    prompt["65"]["inputs"]["strength"] = poseStrength;
    prompt["67"]["inputs"]["strength"] = depthStrength;

    return prompt;

}

module.exports = DeliberatePhotographyRender;
