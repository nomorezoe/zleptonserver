"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function IllustrationGrainRender() {

}

IllustrationGrainRender.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath) {
    console.log("IllustrationGrainRender");
    const promptFile = fs.readFileSync(isLockCharacter?'./pipe/workflow_api_illustration_grain_ch_lock.json':'./pipe/workflow_api_illustration_grain.json');//');
    let prompt = JSON.parse(promptFile);
 
    prompt["1"]["inputs"]["image"]=imgData;

    //lockcharacter
    if (isLockCharacter) {
        console.log("isLockCharacter:");
        let value = Tool.applyImage(prompt, "59", characterFile, fullCharacterPath);
        if(!value){
            return null;
        }
    }

    prompt["49"]["inputs"]["text_positive"] = positivePrompt;
    prompt["49"]["inputs"]["text_negative"] = negtivePrompt;

    prompt["13"]["inputs"]["seed"] =  Tool.randomInt();
    /*prompt["13"]["inputs"]["steps"] = sampleSteps;
    prompt["13"]["inputs"]["cfg"] = cfg;
    prompt["13"]["inputs"]["sampler_name"] = sampler;
    prompt["13"]["inputs"]["scheduler"] = scheduler;
    */

    prompt["35"]["inputs"]["strength"] = poseStrength;
    prompt["34"]["inputs"]["strength"] = depthStrength;

    return prompt;
}


module.exports = IllustrationGrainRender;