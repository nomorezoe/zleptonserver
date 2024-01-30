"strict mode"
const { v4: uuidv4 } = require('uuid');

function Tool() {

}

Tool.randomInt = function () {
    return Math.floor(Math.random() * 9007199254740991);
}

Tool.RequestURL = "j9e5gs4n-comfyui00.bjz.edr.lepton.ai";

Tool.modelJson = JSON.parse(require('fs').readFileSync("./settings/models.json"));

Tool.isXLModelByFile = function (model) {
    for (let i = 0; i < Tool.modelJson.length; i++) {
        if (Tool.modelJson[i].file == model) {
            return Tool.modelJson[i].isxl;
        }
    }
    return false;
}

Tool.getModelFile = function (model) {
    for (let i = 0; i < Tool.modelJson.length; i++) {
        if (Tool.modelJson[i].name == model) {
            return Tool.modelJson[i].file;
        }
    }
    return Tool.modelJson[0].file;
}

Tool.isQualifiedCkpt = function (model) {
    for (let i = 0; i < Tool.modelJson.length; i++) {
        if (Tool.modelJson[i].file == model) {
            return true;
        }
    }
    return false;
}


Tool.loraJson = JSON.parse(require('fs').readFileSync("./settings/loras.json"));
Tool.GetLoraFile = function (model) {
    for (let i = 0; i < Tool.loraJson.length; i++) {
        if (Tool.loraJson[i].name == model) {
            return Tool.loraJson[i].file;
        }
    }
    return null;
}

Tool.styleJson = JSON.parse(require('fs').readFileSync("./settings/styles.json"));
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

Tool.rdStyleJson = JSON.parse(require('fs').readFileSync("./settings/rendermind_styles.json"));
Tool.isSameArray = function (arr1, arr2) {
    if (arr1.length != arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr2.indexOf(arr1[i]) == -1) {
            return false;
        }
    }

    for (let i = 0; i < arr2.length; i++) {
        if (arr1.indexOf(arr2[i]) == -1) {
            return false;
        }
    }

    return true;
}

Tool.getRenderStyle = function (rdStyle, model, loras, style) {
    for (let i = 0; i < Tool.rdStyleJson.length; i++) {
        if (Tool.rdStyleJson[i].id == rdStyle) {
            if (Tool.rdStyleJson[i].model == model && Tool.rdStyleJson[i].style == style) {
                let refLoras = [];
                if (Tool.rdStyleJson[i].loras != null && Tool.rdStyleJson[i].loras != "") {
                    refLoras = Tool.rdStyleJson[i].loras.split(",");
                }

                if (Tool.isSameArray(refLoras, loras)) {
                    return Tool.rdStyleJson[i].pipe;
                }
            }
            break;
        }
    }

    return null;
}

Tool.applyRandomFileName = function(prompt){
    for(var i in prompt){
        if(prompt[i]["class_type"] == "SaveImage"){
            prompt[i]["inputs"]["filename_prefix"] = uuidv4();
            return;
        }
    }

}

module.exports = Tool;
