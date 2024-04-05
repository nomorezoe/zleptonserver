"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceLooseColor() {

}


PipeAdvanceLooseColor.process = function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, isLockCharacter, characterFile, fullCharacterPath, info){

    console.log("PipeAdvanceLooseColor");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_loose_color_2.json');//');
    let prompt = JSON.parse(promptFile);

    if(cannyStrength > 0){
        Tool.ApplyCanny("44", "41", "3", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd);
     }

    if(Tool.renderParams.lora_weights["colscottstyle"] != undefined){
        prompt["29"]["inputs"]["strength_model"] = Tool.renderParams.lora_weights["colscottstyle"];
    }

    let tailText = ",Warm color temperature, serene facial expression";
    
    positivePrompt += tailText;

    
    prompt["44"]["inputs"]["image"]=imgData;

    prompt["6"]["inputs"]["text"] = positivePrompt;
    prompt["6"]["_meta"]["info"] = info;
   
    console.log( positivePrompt );

    prompt["7"]["inputs"]["text"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["3"]["inputs"]["seed"] =  Tool.randomInt();
    prompt["3"]["inputs"]["steps"] = sampleSteps;
    prompt["3"]["inputs"]["cfg"] = cfg;
    prompt["3"]["inputs"]["sampler_name"] = sampler;
    prompt["3"]["inputs"]["scheduler"] = scheduler;

    prompt["41"]["inputs"]["strength"] = depthStrength;
    prompt["41"]["inputs"]["start_percent"] = Tool.renderParams.depthStart;
    prompt["41"]["inputs"]["end_percent"] = Tool.renderParams.depthEnd;
    return prompt;
}

module.exports = PipeAdvanceLooseColor;