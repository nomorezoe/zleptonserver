"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function IllustrationGrainRender() {

}

IllustrationGrainRender.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile) {
    console.log("IllustrationGrainRender");
    const promptFile = fs.readFileSync(isLockCharacter?'./pipe/workflow_api_illustration_grain_ch_lock.json':'./pipe/workflow_api_illustration_grain.json');//');
    let prompt = JSON.parse(promptFile);
 
    prompt["1"]["inputs"]["image"]=imgData;

    //lockcharacter
    if (isLockCharacter) {
        console.log("isLockCharacter:" + characterFile);
        try {
            var rawImg = fs.readFileSync(__dirname + OUTPUT_FOLDER + characterFile);
        }
        catch (err) {
            console.log("read file err");
            //queue.completeTask();
            return null;
        }
        
        var imgBytes = rawImg.toString('base64');
        prompt["59"]["inputs"]["image"] = imgBytes;
    }

    prompt["49"]["inputs"]["text_positive"] = positivePrompt;
    prompt["49"]["inputs"]["text_negative"] = negtivePrompt;

    prompt["13"]["inputs"]["seed"] =  Tool.randomInt(450993616797312);
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