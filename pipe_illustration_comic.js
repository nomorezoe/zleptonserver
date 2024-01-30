"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function IllustrationComicRender() {

}

IllustrationComicRender.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile) {
    console.log("IllustrationComicRender");
    const promptFile = fs.readFileSync(isLockCharacter?'./pipe/workflow_api_illustration_comic_ch_lock.json':'./pipe/workflow_api_illustration_comic.json');//');
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
        prompt["57"]["inputs"]["image"] = imgBytes;
    }
    
    prompt["49"]["inputs"]["text_positive"] = positivePrompt;
    prompt["49"]["inputs"]["text_negative"] = negtivePrompt;
    prompt["49"]["inputs"]["style"] = style;

    prompt["13"]["inputs"]["seed"] =  Tool.randomInt();
    /*prompt["13"]["inputs"]["steps"] = sampleSteps;
    prompt["13"]["inputs"]["cfg"] = cfg;
    prompt["13"]["inputs"]["sampler_name"] = sampler;
    prompt["13"]["inputs"]["scheduler"] = scheduler;
    */

    prompt["35"]["inputs"]["strength"] = poseStrength;
    prompt["34"]["inputs"]["strength"] = depthStrength;

    //prompt["4"]["inputs"]["ckpt_name"] = modelFile;
    
    return prompt;
}


module.exports = IllustrationComicRender;