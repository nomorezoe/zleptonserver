"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceEpicReal() {

}

PipeAdvanceEpicReal.process= function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength,  isLockCharacter, characterFile, fullCharacterPath, info){
    console.log("PipeAdvanceEpicReal.process");

 
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_epic_real.json');//');
    let prompt = JSON.parse(promptFile);

    /*if(cannyStrength > 0){
        Tool.ApplyCanny("44", "41", "3", prompt, cannyStrength);
     }
     */
    let tailText = " HDR, masterpiece, high quality, high resolution, 4K, HDR, ";
    
    positivePrompt += tailText;

    
    prompt["1"]["inputs"]["image"]=imgData;

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    //prompt["6"]["_meta"]["info"] = info;
   
    console.log( positivePrompt );

    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["45"]["inputs"]["seed"] =  Tool.randomInt();
    prompt["45"]["inputs"]["steps"] = sampleSteps;
    prompt["45"]["inputs"]["cfg"] = cfg;
    prompt["45"]["inputs"]["sampler_name"] = sampler;
    prompt["45"]["inputs"]["scheduler"] = scheduler;

    //prompt["41"]["inputs"]["strength"] = depthStrength;

    return prompt;
}

module.exports = PipeAdvanceEpicReal;