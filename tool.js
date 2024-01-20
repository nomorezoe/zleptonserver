"strict mode"

function Tool() {

}

Tool.randomInt = function (max) {
    return Math.floor(Math.random() * max);
}

Tool.RequestURL = "j9e5gs4n-comfyui00.bjz.edr.lepton.ai";


Tool.isXLModel = function (model) {
    if (model == "dynavisionXLAllInOneStylized_release0557Bakedvae") {
        return true;
    }
    if (model == "realismEngineSDXL_v20VAE") {
        return true;
    }
    return false;
}

Tool.getModelMap = function (model) {
    // ["realismEngineSDXL_v20VAE", "realisticVisionV60B1_v60B1VAE", "Deliberate_v5", "dreamshaper_8", "dynavisionXLAllInOneStylized_release0557Bakedvae"]
    switch (model) {
        case "dynavisionXL":
            return "dynavisionXLAllInOneStylized_release0557Bakedvae";
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
            return "Deliberate_v4 (SFW)";
            break;
        case "Deliberate_v4":
            return "Deliberate_v4 (SFW)";
    }
    return "realismEngineSDXL_v20VAE";
}

Tool.isQualifiedCkpt = function (model) {
    if (model == "dynavisionXLAllInOneStylized_release0557Bakedvae.safetensors") {
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
    if (model == "Deliberate_v5.safetensors") {
        return true;
    }
    return false;
}

module.exports = Tool;
