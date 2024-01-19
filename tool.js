"strict mode"

function Tool() {

}

Tool.randomInt = function(max){
    return Math.floor(Math.random() * max);
}

Tool.RequestURL = "j9e5gs4n-comfyui00.bjz.edr.lepton.ai";

Tool.isQualifiedCkpt = function(model){
    if(model == "dynavisionXLAllInOneStylized_release0557Bakedvae.safetensors"){
        return true;
    }
    if(model == "realismEngineSDXL_v20VAE.safetensors"){
        return true;
    }
    if(model == "realisticVisionV60B1_v60B1VAE.safetensors"){
        return true;
    }
    if(model == "dreamshaper_8.safetensors"){
        return true;
    }
    if(model == "Deliberate_v5.safetensors"){
        return true;
    }
    return false;
}

module.exports = Tool;
