"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceLooseColor() {

}


PipeAdvanceLooseColor.process = function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath){

    console.log("PipeAdvanceLooseColor");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_loose_color_2.json');//');
    let prompt = JSON.parse(promptFile);


    let tailText = ",Warm color temperature, serene facial expression";
    
    positivePrompt += tailText;

    
    prompt["44"]["inputs"]["image"]=imgData;

    prompt["6"]["inputs"]["text"] = positivePrompt;
    console.log( prompt["6"]["inputs"]["text"] );

    //prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["3"]["inputs"]["seed"] =  Tool.randomInt();

    return prompt;
}

module.exports = PipeAdvanceLooseColor;