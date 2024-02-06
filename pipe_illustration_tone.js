"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function IllustrationToneRender() {

}

IllustrationToneRender.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath) {
    console.log("IllustrationToneRender");
    const promptFile = fs.readFileSync(isLockCharacter?'./pipe/workflow_api_illustration_tone_ch_lock.json':'./pipe/workflow_api_illustration_tone.json');//');
    let prompt = JSON.parse(promptFile);
 
    prompt["1"]["inputs"]["image"]=imgData;

     //lockcharacter
     if (isLockCharacter) {
        console.log("isLockCharacter:");
        let value = Tool.applyImage(prompt, "58", characterFile, fullCharacterPath);
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


module.exports = IllustrationToneRender;