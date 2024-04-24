"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";
const CharacterTool = require("./character_tool");

function IllustrationComicRender() {

}

IllustrationComicRender.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength) {
    console.log("IllustrationComicRender");
    const promptFile = fs.readFileSync('./pipe/workflow_api_illustration_comic.json');//');
    let prompt = JSON.parse(promptFile);
 
    prompt["1"]["inputs"]["image"]=imgData;

    //lockcharacter
    /*if (isLockCharacter) {
        console.log("isLockCharacter:");
        let value = Tool.applyImage(prompt, "57", characterFile, fullCharacterPath);
        if(!value){
            return null;
        }
    }*/
    
    prompt["49"]["inputs"]["text_positive"] = positivePrompt;
    prompt["49"]["inputs"]["text_negative"] = negtivePrompt;
    prompt["49"]["inputs"]["style"] = style;

    prompt["13"]["inputs"]["seed"] =  Tool.randomInt();
    prompt["13"]["inputs"]["steps"] = sampleSteps;
    prompt["13"]["inputs"]["cfg"] = cfg;
    prompt["13"]["inputs"]["sampler_name"] = sampler;
    prompt["13"]["inputs"]["scheduler"] = scheduler;

    prompt["35"]["inputs"]["strength"] = poseStrength;
    prompt["34"]["inputs"]["strength"] = depthStrength;

    //prompt["4"]["inputs"]["ckpt_name"] = modelFile;
    
    //ch lock
    if (CharacterTool.lockChParams.isLockCharacter) {
        CharacterTool.AddAPerson(prompt, CharacterTool.characerLockPair, CharacterTool.lockChParams.fullCharacterPath, "1", "50", "13", "4", "48", "19", "20", "4");
    }

    return prompt;
}


module.exports = IllustrationComicRender;