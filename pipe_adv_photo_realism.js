"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvancePhotoRealism() {

}

PipeAdvancePhotoRealism.process = function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath){

    console.log("PipeAdvancePhotoRealism");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_realism_photo.json');//');
    let prompt = JSON.parse(promptFile);

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
    //prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["192"]["inputs"]["noise_seed"] =  Tool.randomInt();
    prompt["193"]["inputs"]["noise_seed"] =  Tool.randomInt();

    return prompt;
}

module.exports = PipeAdvancePhotoRealism;