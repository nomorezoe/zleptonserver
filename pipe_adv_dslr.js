"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";
const CharacterTool = require("./character_tool");

function PipeAdvanceDSLR() {

}


PipeAdvanceDSLR.process = function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength,   hasBackDrop, isLockCharacter, characterFile, fullCharacterPath, info){

    console.log("PipeAdvanceDSLR");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_dslr.json');//');
    let prompt = JSON.parse(promptFile);

    if(cannyStrength > 0){
        Tool.ApplyCanny("1", "182", "45", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd, 0.01, 0.25, "diffuserscontrolnet-canny-sdxl-1.0.safetensors");
        if(hasBackDrop){
            //prompt["182"]["inputs"]["end_percent"] = 0.75;
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
    prompt["181"]["inputs"]["start_percent"] = Tool.renderParams.poseStart;
    prompt["181"]["inputs"]["end_percent"] = Tool.renderParams.poseEnd;

    prompt["182"]["inputs"]["strength"] = depthStrength;
    prompt["182"]["inputs"]["start_percent"] = Tool.renderParams.depthStart;
    prompt["182"]["inputs"]["end_percent"] = Tool.renderParams.depthEnd;
    //depth
    //prompt["182"]["inputs"]["start_percent"] = 0;
    //prompt["182"]["inputs"]["end_percent"] = 0.65;

    console.log("loras" + loras);


    if (Tool.renderParams.lora_weights["real-humans-PublicPrompts"] != undefined) {
        prompt["52"]["inputs"]["switch_1"] = "On";
        prompt["52"]["inputs"]["model_weight_1"] = Tool.renderParams.lora_weights["real-humans-PublicPrompts"];
        console.log("lora real-humans-PublicPrompts On");
    }

    if (Tool.renderParams.lora_weights["Cinematic_Hollywood_Film"] != undefined) {
        prompt["54"]["inputs"]["model_weight_1"] = Tool.renderParams.lora_weights["Cinematic_Hollywood_Film"];
        console.log("lora Cinematic_Hollywood_Film On");
    }
    else{
        prompt["54"]["inputs"]["switch_1"] = "Off";
    }

    if (Tool.renderParams.lora_weights["BetterPhotography"] != undefined) {
        prompt["54"]["inputs"]["model_weight_2"] = Tool.renderParams.lora_weights["BetterPhotography"];
        console.log("lora BetterPhotography On");
    }
    else{
        prompt["54"]["inputs"]["switch_2"] = "Off";
    }

    //ch lock
    if (CharacterTool.lockChParams.isLockCharacter) {
        prompt["52"]["inputs"]["model_weight_1"] = 0.20;
        prompt["54"]["inputs"]["model_weight_1"] = 0.20;
        prompt["54"]["inputs"]["model_weight_2"] = 0.20;
        CharacterTool.AddAPerson(prompt, CharacterTool.characerLockPair, CharacterTool.lockChParams.fullCharacterPath, "1", "53", "45", "69", "134", "49", "224", "4");

        for (let b = 0; b < CharacterTool.BATCH; b++){
            for (let i = 0; i < pair; i++) {
                //"100524": 
                let DetailerForEach_Face_Id = (100524 + b * 10000 + i * 1000).toString();
                prompt[DetailerForEach_Face_Id]["steps"]= 5;
                prompt[DetailerForEach_Face_Id]["cfg"]= 2.0;
            }
        }
       
    }

    return prompt;
}

module.exports = PipeAdvanceDSLR;