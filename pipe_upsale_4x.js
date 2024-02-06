"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function Upscale4X() {

}

Upscale4X.process = function (oldfile, fullFilaName, denoiseValue, prompt, history_model, history_style, history_neg){
    
    const promptFile = fs.readFileSync('./pipe/workflow_api_4x_upscale.json');
    let promptjson = JSON.parse(promptFile);

    Tool.applyImage(promptjson, "2", oldfile, fullFilaName);
   // promptjson["2"]["inputs"]["image"] = imgBytes;
    promptjson["30"]["inputs"]["text_positive"] = prompt;

    if (history_style != null && history_style != ''&& history_style != "") {
        promptjson["30"]["inputs"]["text_negative"] = history_neg;
        promptjson["30"]["inputs"]["style"] = history_style;
    }
    if (history_model != null && history_model != ''&& history_model != "") {
        promptjson["6"]["inputs"]["ckpt_name"] = history_model;
    }
    promptjson["21"]["inputs"]["seed"] = Tool.randomInt();
    promptjson["21"]["inputs"]["denoise"] = parseFloat(denoiseValue);

    return promptjson;
}

module.exports = Upscale4X;