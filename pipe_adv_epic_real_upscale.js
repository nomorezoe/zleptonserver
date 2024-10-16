"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceEpicRealUpscale() {

}

PipeAdvanceEpicRealUpscale.process = function (fullfilepath, faceParams, denoise,cfg, samplingsteps, sampler, scheduler, positivePrompt, model, style, humanloras, negtivePrompt, isLockCharacter, fullCharacterPath) {

    console.log("PipeAdvanceEpicRealUpscale.process");

    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_realism_photo_upscale.json');//');
    let promptjson = JSON.parse(promptFile);

    Tool.applyImage(promptjson, "224", null, fullfilepath);

    promptjson["55"]["inputs"]["text_positive"] = positivePrompt;
    promptjson["55"]["inputs"]["text_negative"] = negtivePrompt;

    promptjson["142"]["inputs"]["seed"] =  Tool.randomInt();
    promptjson["142"]["inputs"]["denoise"] = denoise;
    promptjson["142"]["inputs"]["cfg"] = cfg;
    promptjson["142"]["inputs"]["steps"] = samplingsteps;
    promptjson["142"]["inputs"]["sampler_name"] = sampler;
    promptjson["142"]["inputs"]["scheduler"] = scheduler;

    Tool.ApplyFaceParams(promptjson, faceParams);
    return promptjson;
}

module.exports = PipeAdvanceEpicRealUpscale;