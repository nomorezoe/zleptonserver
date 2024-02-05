"strict mode"
const { v4: uuidv4 } = require('uuid');

const OUTPUT_FOLDER = "/imgs/";

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

Tool.applyRandomFileName = function (prompt) {
    for (var i in prompt) {
        if (prompt[i]["class_type"] == "SaveImage") {
            prompt[i]["inputs"]["filename_prefix"] = uuidv4();
            return;
        }
    }
}

Tool.applyCropInfo = function (prompt, cropwidth, cropHeight) {

    let cropJson = {
        "inputs": {
            "width": 512,
            "height": 512,
            "x": 0,
            "y": 0,
            "image": [
                "19",
                0
            ]
        },
        "class_type": "ImageCrop"
    };
    let width = 1024;
    let height = 576;
    for (var i in prompt) {
        if (prompt[i]["class_type"] == "EmptyLatentImage") {
            width = prompt[i]["inputs"]["width"];
            height = prompt[i]["inputs"]["height"];
            break;
        }
    }

    if (width == cropwidth && height == cropHeight) {
        console.log("skip");
        return;
    }
    console.log("crop");
    for (var i in prompt) {
        if (prompt[i]["class_type"] == "SaveImage") {
            let history = prompt[i]["inputs"]["images"][0];
            prompt[i]["inputs"]["images"][0] = "1000";

            cropJson["inputs"]["image"][0] = history;

            cropJson["inputs"]["width"] = cropwidth;
            cropJson["inputs"]["height"] = cropHeight;

            cropJson["inputs"]["x"] = Math.floor((width - cropwidth) / 2);
            cropJson["inputs"]["y"] = Math.floor((height - cropHeight) / 2);

            prompt["1000"] = cropJson;
            return;
        }
    }
}

Tool.applyImage = function (prompt, index, oldFilePath, fullFilePath) {
    if (fullFilePath != undefined && fullFilePath != "" && fullFilePath != null) {
        console.log("fullFilePath")
        let json = {
            "inputs": {
                "url": "",
                "keep_alpha_channel": false,
                "output_mode": false
            },
            "class_type": "LoadImageFromUrl"
        }
        json["inputs"]["url"] = fullFilePath;
        prompt[index] = json;
    }
    else {
        console.log("oldFilePath")
        try {
            var rawImg = fs.readFileSync(__dirname + OUTPUT_FOLDER + oldFilePath);
        }
        catch (err) {
            console.log("read file err");
            return false;
        }

        var imgBytes = rawImg.toString('base64');
        prompt[index]["inputs"]["image"] = imgBytes;
    }

    return true;

}


module.exports = Tool;
