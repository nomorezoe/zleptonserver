"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeFluxUpscale() {

}

PipeFluxUpscale.process = function (fullFilaName, denoise, cfg, samplingsteps, sampler, scheduler, prompt, history_model, history_style, history_neg, isLockCharacter, fullCharacterPath) {

    console.log("PipeFluxUpscale.process");

    isLockCharacter = isLockCharacter && fullCharacterPath != null && fullCharacterPath != undefined && fullCharacterPath != "";
    //isLockCharacter ? './pipe/workflow_api_4x_upscale_ch_lock.json' : 
    const promptFile = fs.readFileSync('./pipe/flux_upscale.json');
    let promptjson = JSON.parse(promptFile);

    //lockcharacter
    /*if (isLockCharacter) {
        
    }*/

    promptjson["106"]["inputs"]["seed"] =  Tool.randomInt();
    Tool.applyImage(promptjson, "94", null, fullFilaName);
    // promptjson["2"]["inputs"]["image"] = imgBytes;

    if (prompt != null && prompt != '' && prompt != "") {
        promptjson["6"]["inputs"]["text_positive"] = prompt;
    }

    if (history_neg != null && history_neg != '' && history_neg != "") {
        promptjson["112"]["inputs"]["text_negative"] = history_neg;
    }



    return promptjson;
}

module.exports = PipeFluxUpscale;