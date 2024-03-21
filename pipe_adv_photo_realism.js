"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvancePhotoRealism() {

}

PipeAdvancePhotoRealism.process = function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, isLockCharacter, characterFile, fullCharacterPath, info){

    console.log("PipeAdvancePhotoRealism");
    let promptFile;
    promptFile = fs.readFileSync('./pipe/workflow_api_adv_realism_photo.json');//');

    
   
    let prompt = JSON.parse(promptFile);

    if(cannyStrength > 0){
        Tool.ApplyCanny("1", "182", "192",prompt, cannyStrength);
     }


    prompt["1"]["inputs"]["image"]=imgData;

    let tailText = "cinematic lighting, masterpiece, high quality, high resolution, 4K, HDR";
    let tailTexts = tailText.split(",");
    for(let i in tailTexts){
        if(positivePrompt.indexOf(tailTexts[i]) == -1){
            positivePrompt += " "+ tailTexts[i] +",";
        }
    }

    console.log("positivePrompt:" + positivePrompt);
   
    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    prompt["55"]["_meta"]["info"] = info;
    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    
    //prompt["55"]["inputs"]["style"] = style;

    prompt["192"]["inputs"]["noise_seed"] =  Tool.randomInt();
    prompt["193"]["inputs"]["noise_seed"] =  Tool.randomInt();


    prompt["192"]["inputs"]["steps"] = sampleSteps;
    prompt["192"]["inputs"]["cfg"] = cfg;
    prompt["192"]["inputs"]["sampler_name"] = sampler;
    prompt["192"]["inputs"]["scheduler"] = scheduler;

    prompt["193"]["inputs"]["steps"] = sampleSteps;
    prompt["193"]["inputs"]["cfg"] = cfg;
    prompt["193"]["inputs"]["sampler_name"] = sampler;
    prompt["193"]["inputs"]["scheduler"] = scheduler;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["182"]["inputs"]["strength"] = depthStrength;
   
    

    //lora
   
    console.log("loras" + loras);
    if(loras.indexOf("real-humans-PublicPrompts") != -1){
        prompt["52"]["inputs"]["switch_1"] = "On";
        console.log("lora real-humans-PublicPrompts On");
    }
    return prompt;
}

module.exports = PipeAdvancePhotoRealism;