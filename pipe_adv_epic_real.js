"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceEpicReal() {

}

PipeAdvanceEpicReal.process= function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength,  isLockCharacter, characterFile, fullCharacterPath, info, hasAnimal){
    console.log("PipeAdvanceEpicReal.process");

 
    let promptFile = null;
    let prompt = null;
    if(hasAnimal){
        console.log("has animal");
        promptFile = fs.readFileSync('./pipe/workflow_api_adv_epic_real_animal.json');
        prompt = JSON.parse(promptFile);

        if(cannyStrength > 0){
            Tool.ApplyCanny("1", "232", "246", prompt, cannyStrength, 0.0, 0.75, 0.01, 0.25, "control_v11p_sd15_canny.pth");
        }
    }
    else{
        promptFile = fs.readFileSync('./pipe/workflow_api_adv_epic_real.json');//');
        prompt = JSON.parse(promptFile);

        if(cannyStrength > 0){
            Tool.ApplyCanny("1", "232", "45", prompt, cannyStrength, 0.0, 0.75, 0.01, 0.25, "control_v11p_sd15_canny.pth");
        }
    }
    
   

    
    
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

    prompt["232"]["inputs"]["strength"] = depthStrength;
    prompt["181"]["inputs"]["strength"] = poseStrength;

    if(hasAnimal){
       
    }

    console.log("loras" + loras);
    if(loras.indexOf("BetterPhotography") != -1){
        prompt["54"]["inputs"]["switch_2"] = "On";
        console.log("lora BetterPhotography On");
    }
    return prompt;
}

module.exports = PipeAdvanceEpicReal;