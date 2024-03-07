"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceDSLR() {

}


PipeAdvanceDSLR.process = function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath){

    console.log("PipeAdvanceDSLR");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_dslr.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["1"]["inputs"]["image"]=imgData;

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    console.log( positivePrompt );
    //prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["45"]["inputs"]["seed"] =  Tool.randomInt();

    prompt["45"]["inputs"]["steps"] = sampleSteps;
    prompt["45"]["inputs"]["cfg"] = cfg;
    prompt["45"]["inputs"]["sampler_name"] = sampler;
    prompt["45"]["inputs"]["scheduler"] = scheduler;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["182"]["inputs"]["strength"] = depthStrength;

    return prompt;
}

module.exports = PipeAdvanceDSLR;