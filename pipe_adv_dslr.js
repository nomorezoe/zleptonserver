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
    //prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["45"]["inputs"]["seed"] =  Tool.randomInt();

    return prompt;
}

module.exports = PipeAdvanceDSLR;