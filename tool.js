"strict mode"

function Tool() {

}

Tool.randomInt = function (max) {
    return Math.floor(Math.random() * max);
}

Tool.RequestURL = "j9e5gs4n-comfyui00.bjz.edr.lepton.ai";

Tool.modelJson = JSON.parse(require('fs').readFileSync("./pipe/models.json"));

Tool.isXLModelByFile = function (model) {
    for(let i = 0; i < Tool.modelJson .length; i++){
        if(Tool.modelJson[i].file == model){
            return Tool.modelJson[i].isxl;
        }
    }
    return false;
}

Tool.getModelFile = function (model) {
    for(let i = 0; i < Tool.modelJson .length; i++){
        if(Tool.modelJson[i].name == model){
            return Tool.modelJson[i].file;
        }
    }
    return Tool.modelJson[0].file;
}

Tool.isQualifiedCkpt = function (model) {
    for(let i = 0; i < Tool.modelJson .length; i++){
        if(Tool.modelJson[i].file == model){
            return true;
        }
    }
    return false;
}


Tool.loraJson = JSON.parse(require('fs').readFileSync("./pipe/loras.json"));
Tool.GetLoraFile = function (model) {
    for(let i = 0; i < Tool.loraJson.length; i++){
        if(Tool.loraJson[i].model == model){
            return Tool.loraJson[i].file;
        }
    }
    return null;
}

Tool.styleJson = JSON.parse(require('fs').readFileSync("./pipe/styles.json"));
Tool.getStyledPrompt = function (style, posPrompt) {
    for (let i = 0; i < Tool.styleJson.length; i++) {
        if (Tool.styleJson[i].name == style) {
            console.log("find style: " + style);
            posPrompt = Tool.styleJson[i].prompt.replace("{prompt}", posPrompt);
            negPrompt = Tool.styleJson[i].negative_prompt;
            return [posPrompt, negPrompt];
        }
    }
    return [posPrompt, negPrompt];
}

Tool.getStyleFromNegPrompt = function (neg) {
    for (let i = 0; i < Tool.styleJson.length; i++) {
        if (neg.indexOf(Tool.styleJson[i].negative_prompt) != -1) {
            return Tool.styleJson[i].name;
        }
    }
    return null;
}

module.exports = Tool;
