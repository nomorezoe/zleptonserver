"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceBWLooseColor() {

}


PipeAdvanceBWLooseColor.process = function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath){

    console.log("PipeAdvanceBWLooseColor");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_bw_loose_color_2.json');//');
    let prompt = JSON.parse(promptFile);

    prompt["44"]["inputs"]["image"]=imgData;

    prompt["6"]["inputs"]["text"] = positivePrompt;
    //prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["3"]["inputs"]["seed"] =  Tool.randomInt();

    return prompt;
}

module.exports = PipeAdvanceBWLooseColor;