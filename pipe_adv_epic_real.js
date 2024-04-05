"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceEpicReal() {

}

PipeAdvanceEpicReal.process= function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength,  hasBackDrop,  isLockCharacter, characterFile, fullCharacterPath, info, hasAnimal){
    console.log("PipeAdvanceEpicReal.process");

 
    let promptFile = null;
    let prompt = null;
    if(hasAnimal){
        console.log("has animal");
        promptFile = fs.readFileSync('./pipe/workflow_api_adv_epic_real_animal.json');
        prompt = JSON.parse(promptFile);

        if(cannyStrength > 0){
            Tool.ApplyCanny("1", "232", "246", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd, 0.01, 0.25, "control_v11p_sd15_canny.pth");
        }

        prompt["246"]["inputs"]["strength"] = Tool.renderParams.animalStrength;
        prompt["246"]["inputs"]["start_percent"] = Tool.renderParams.animalStart;
        prompt["246"]["inputs"]["end_percent"] = Tool.renderParams.animalEnd;
    
    }
    else{
        promptFile = fs.readFileSync('./pipe/workflow_api_adv_epic_real.json');//');
        prompt = JSON.parse(promptFile);

        if(cannyStrength > 0){
            Tool.ApplyCanny("1", "232", "45", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd, 0.01, 0.25, "control_v11p_sd15_canny.pth");
        }

        if(hasBackDrop){
            //prompt["232"]["inputs"]["end_percent"] = 0.75;
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
    prompt["232"]["inputs"]["start_percent"] = Tool.renderParams.depthStart;
    prompt["232"]["inputs"]["end_percent"] = Tool.renderParams.depthEnd;
    
    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["181"]["inputs"]["start_percent"] = Tool.renderParams.poseStart;
    prompt["181"]["inputs"]["end_percent"] = Tool.renderParams.poseEnd;

    if(hasAnimal){
       
    }

    console.log("loras" + loras);

    if (Tool.renderParams.lora_weights["BetterPhotography"] != undefined) {
        prompt["54"]["inputs"]["switch_2"] = "On";
        prompt["54"]["inputs"]["model_weight_2"] = Tool.renderParams.lora_weights["BetterPhotography"];
        console.log("lora BetterPhotography On");
        
    }

    return prompt;
}

module.exports = PipeAdvanceEpicReal;