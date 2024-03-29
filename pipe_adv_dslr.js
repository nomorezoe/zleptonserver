"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceDSLR() {

}


PipeAdvanceDSLR.process = function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength,   hasBackDrop, isLockCharacter, characterFile, fullCharacterPath, info){

    console.log("PipeAdvanceDSLR");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_dslr.json');//');
    let prompt = JSON.parse(promptFile);

    if(cannyStrength > 0){
        Tool.ApplyCanny("1", "182", "45", prompt, cannyStrength, 0.0, 0.75, 0.01, 0.25, "diffuserscontrolnet-canny-sdxl-1.0.safetensors");
        if(hasBackDrop){
            prompt["182"]["inputs"]["end_percent"] = 0.75;
            prompt["33"]["inputs"][ "resolution"] = 1024;
        }
    }

    prompt["1"]["inputs"]["image"]=imgData;

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    prompt["55"]["_meta"]["info"] = info;
    console.log( positivePrompt );
    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["45"]["inputs"]["seed"] =  Tool.randomInt();

    prompt["45"]["inputs"]["steps"] = sampleSteps;
    prompt["45"]["inputs"]["cfg"] = cfg;
    prompt["45"]["inputs"]["sampler_name"] = sampler;
    prompt["45"]["inputs"]["scheduler"] = scheduler;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["182"]["inputs"]["strength"] = depthStrength;

    //depth
    //prompt["182"]["inputs"]["start_percent"] = 0;
    //prompt["182"]["inputs"]["end_percent"] = 0.65;

    console.log("loras" + loras);
    if(loras.indexOf("real-humans-PublicPrompts") != -1){
        prompt["52"]["inputs"]["switch_1"] = "On";
        console.log("lora real-humans-PublicPrompts On");
    }
    return prompt;
}

module.exports = PipeAdvanceDSLR;