"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceDSLRUpscale() {

}

PipeAdvanceDSLRUpscale.process = function (fullfilepath, positivePrompt, model, style, negtivePrompt, isLockCharacter, fullCharacterPath) {

    console.log("PipeAdvanceDSLRUpscale.process");

    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_dslr_upscale.json');//');
    let promptjson = JSON.parse(promptFile);

    Tool.applyImage(promptjson, "1", null, fullfilepath);

    promptjson["55"]["inputs"]["text_positive"] = positivePrompt;
    promptjson["55"]["inputs"]["text_negative"] = negtivePrompt;

    promptjson["142"]["inputs"]["seed"] =  Tool.randomInt();
    return promptjson;
}

module.exports = PipeAdvanceDSLRUpscale;