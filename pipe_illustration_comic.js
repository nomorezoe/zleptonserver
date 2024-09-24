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

    prompt["1"]["inputs"]["image"] = imgData;

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

    prompt["13"]["inputs"]["seed"] = Tool.randomInt();
    prompt["13"]["inputs"]["steps"] = sampleSteps;
    prompt["13"]["inputs"]["cfg"] = cfg;
    prompt["13"]["inputs"]["sampler_name"] = sampler;
    prompt["13"]["inputs"]["scheduler"] = scheduler;

    prompt["35"]["inputs"]["strength"] = poseStrength;
    prompt["34"]["inputs"]["strength"] = depthStrength;

    //prompt["4"]["inputs"]["ckpt_name"] = modelFile;

    if (Tool.renderParams.poseInfluence != undefined) {
        prompt["35"]["inputs"]["strength"] = Tool.renderParams.poseInfluence;
    }
    /* if (Tool.renderParams.poseEffectFade != undefined) {
         prompt["181"]["inputs"]["end_percent"] = Tool.renderParams.poseEffectFade;
     }
    */
    if (Tool.renderParams.depthInfluence != undefined) {
        prompt["34"]["inputs"]["strength"] = Tool.renderParams.depthInfluence;
    }
    /*if (Tool.renderParams.depthEffectFade != undefined) {
        prompt["232"]["inputs"]["end_percent"] = Tool.renderParams.depthEffectFade;
    }*/
    if (Tool.renderParams.creativityLevel != undefined) {
        prompt["13"]["inputs"]["denoise"] = Tool.renderParams.creativityLevel;
    }

    //ch lock
    if (CharacterTool.lockChParams.isLockCharacter) {
        CharacterTool.AddAPerson(prompt, CharacterTool.characerLockPair, CharacterTool.lockChParams.fullCharacterPath, "1", "50", "13", "4", "48", "19", "20", "4");
    }

    return prompt;
}

IllustrationComicRender.quickProcess = function (positivePrompt, imgurl, imgData) {
    console.log("IllustrationComicRender.quickProcess");
    const promptFile = fs.readFileSync('./pipe/workflow_api_illustration_comic.json');//');
    let prompt = JSON.parse(promptFile);

    if (imgData != null) {
        prompt["1"]["inputs"]["image"] = imgData;
    }
    else {
        Tool.applyImage(prompt, "1", null, imgurl);
    }


    prompt["49"]["inputs"]["text_positive"] = "anime ninja illustration, " + positivePrompt;
    prompt["49"]["inputs"]["text_negative"] = "watermark,nsfw,nude";
    prompt["49"]["inputs"]["style"] = "comic-character";

    let steps = 25;
    let cfg = 4;
    let sampler = "dpmpp_2m";
    let scheduler = "ddim_uniform";
    let poseStrength = 0.8;
    let depthStrength = 0.5;
    prompt["13"]["inputs"]["seed"] = Tool.randomInt();
    prompt["13"]["inputs"]["steps"] = steps;
    prompt["13"]["inputs"]["cfg"] = cfg;
    prompt["13"]["inputs"]["sampler_name"] = sampler;
    prompt["13"]["inputs"]["scheduler"] = scheduler;

    prompt["35"]["inputs"]["strength"] = poseStrength;
    prompt["34"]["inputs"]["strength"] = depthStrength;

    return prompt;
}


module.exports = IllustrationComicRender;