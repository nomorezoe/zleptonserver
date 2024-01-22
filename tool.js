"strict mode"

function Tool() {

}

Tool.randomInt = function (max) {
    return Math.floor(Math.random() * max);
}

Tool.RequestURL = "j9e5gs4n-comfyui00.bjz.edr.lepton.ai";


Tool.isXLModel = function (model) {
    if (model == "dynavisionXLAllInOneStylized_releaseV0610Bakedvae") {
        return true;
    }
    if (model == "realismEngineSDXL_v20VAE") {
        return true;
    }
    return false;
}

Tool.getModelMap = function (model) {
    switch (model) {
        case "dynavisionXL":
            return "dynavisionXLAllInOneStylized_releaseV0610Bakedvae";
            break;
        case "realism_engine_sdxl":
            return "realismEngineSDXL_v20VAE";
            break;
        case "realistic_vision_v6":
            return "realisticVisionV60B1_v60B1VAE";
            break;
        case "dreamshaper":
            return "dreamshaper_8";
            break;
        case "Deliberate_v5":
            return "Deliberate_v4";
            break;
        case "Deliberate_v4":
            return "Deliberate_v4";
    }
    return "realismEngineSDXL_v20VAE";
}

Tool.isQualifiedCkpt = function (model) {
    if (model == "dynavisionXLAllInOneStylized_releaseV0610Bakedvae.safetensors") {
        return true;
    }
    if (model == "realismEngineSDXL_v20VAE.safetensors") {
        return true;
    }
    if (model == "realisticVisionV60B1_v60B1VAE.safetensors") {
        return true;
    }
    if (model == "dreamshaper_8.safetensors") {
        return true;
    }
    if (model == "Deliberate_v4.safetensors") {
        return true;
    }
    return false;
}

Tool.styleJson = JSON.parse(require('fs').readFileSync("./pipe/styles.json"));

Tool.getStyledPrompt = function (style, posPrompt, negPrompt) {
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
