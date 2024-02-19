"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function Upscale4X() {

}

Upscale4X.process = function (oldfile, fullFilaName, denoiseValue, prompt, history_model, history_style, history_neg, isPhoto, isLockCharacter, fullCharacterPath) {

    console.log("Upscale4X.process");
    
    isLockCharacter = isLockCharacter && fullCharacterPath != null && fullCharacterPath != undefined && fullCharacterPath != "";

    const promptFile = fs.readFileSync(isLockCharacter ? './pipe/workflow_api_4x_upscale_ch_lock.json' : './pipe/workflow_api_4x_upscale.json');
    let promptjson = JSON.parse(promptFile);

    //lockcharacter
    if (isLockCharacter) {
        console.log("isLockCharacter:");
        let value = Tool.applyImage(promptjson, "36", null, fullCharacterPath);
        if (!value) {
            return null;
        }

        if (!Tool.isXLModelByFile(history_model)) {
            console.log("lockCharacter SD 1.5 model");
            promptjson["32"]["inputs"]["ipadapter_file"] = "ip-adapter_sd15.bin";
            promptjson["33"]["inputs"]["clip_name"] = "model_15.safetensors";
        }
    }

    Tool.applyImage(promptjson, "2", oldfile, fullFilaName);
    // promptjson["2"]["inputs"]["image"] = imgBytes;

    if (prompt != null && prompt != '' && prompt != "") {
        promptjson["31"]["inputs"]["text_positive"] = prompt;
    }

    if (history_neg != null && history_neg != '' && history_neg != "") {
        promptjson["31"]["inputs"]["text_negative"] = history_neg;
    }

    if (history_style != null && history_style != '' && history_style != "") {
        promptjson["31"]["inputs"]["style"] = history_style;
    }
    if (history_model != null && history_model != '' && history_model != "") {
        promptjson["6"]["inputs"]["ckpt_name"] = history_model;

        
    }
    promptjson["21"]["inputs"]["seed"] = Tool.randomInt();
    //promptjson["21"]["inputs"]["denoise"] = parseFloat(denoiseValue);

    if (isPhoto) {
        console.log("isPhoto");
        promptjson["28"]["inputs"]["model_name"] = "4x-UltraSharp.pth";
    }

    
    return promptjson;
}

module.exports = Upscale4X;