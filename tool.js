"strict mode"
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
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
Tool.isSameLoraArray = function (arr1, arr2) {
    /*if (arr1.length < arr2.length) {
        return false;
    }*/

    for (let i = 0; i < arr1.length; i++) {
        if (arr2.indexOf(arr1[i]) == -1) {
            return false;
        }
    }

    /*
    for (let i = 0; i < arr2.length; i++) {
        if (arr1.indexOf(arr2[i]) == -1) {
            return false;
        }
    }
    */

    return true;
}

Tool.getRenderStyle = function (rdStyle, model, loras, style, sampler, sampleSteps, scheduler, cfg, depthStrength, poseStrength) {
    for (let i = 0; i < Tool.rdStyleJson.length; i++) {
        if (Tool.rdStyleJson[i].id == rdStyle) {
            if (Tool.rdStyleJson[i].model == model && Tool.rdStyleJson[i].style == style) {
                let refLoras = [];
                if (Tool.rdStyleJson[i].loras != null && Tool.rdStyleJson[i].loras != "") {
                    refLoras = Tool.rdStyleJson[i].loras.split(",");
                }

                if (Tool.isSameLoraArray(refLoras, loras)) {
                    return Tool.rdStyleJson[i].pipe;
                }
            }
            break;
        }
    }

    return null;
}

Tool.getRDStyleByDescription = function (des) {
    switch (des) {
        case "Cinematic":
            return "cinematic";
            break;
        case "Loose Color":
            return "loose_color";
            break;
        case "B/W Loose (Film Grain)":
            return "bw_loose_film_grain";
            break;
        case "Photorealism":
            return "photorealism";
            break;
        case "DSLR":
            return "dslr";
            break;
        case "B/W Loose":
            return "bw_loose";
            break;
        case "Classic Animation":
            return "classic_animation";
            break;

    }
    return des;
}

Tool.getIsPhotoStyle = function (model, style) {
    for (let i = 0; i < Tool.rdStyleJson.length; i++) {
        if (Tool.getModelFile(Tool.rdStyleJson[i].model) == model && Tool.rdStyleJson[i].style == style) {
            return Tool.isPhotoPipe(Tool.rdStyleJson[i].pipe);
        }
    }

    return false;
}

Tool.isPhotoPipe = function (pipe) {
    console.log("isPhotoPipe" + pipe);
    if (pipe == "delibrerate_photo" || pipe == "real_photo_sharpen" || pipe == "real_photo") {
        return true;
    }

}

Tool.applyRandomFileName = function (prompt) {
    for (var i in prompt) {
        if (prompt[i]["class_type"] == "SaveImage" || prompt[i]["class_type"] == "SaveImage_plus") {
            prompt[i]["inputs"]["filename_prefix"] = uuidv4();
            //return;
        }
    }
}

Tool.FIX_WIDTH = 1152;
Tool.FIX_HEIGHT = 896;

Tool.applyCropInfoForLatentImage = function (prompt) {
    for (var i in prompt) {
        if (prompt[i]["class_type"] == "EmptyLatentImage") {
            prompt[i]["inputs"]["width"] = Tool.FIX_WIDTH;
            prompt[i]["inputs"]["height"] = Tool.FIX_HEIGHT;
            break;
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

    if (Tool.FIX_WIDTH == cropwidth && Tool.FIX_HEIGHT == cropHeight) {
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

            cropJson["inputs"]["x"] = Math.floor((Tool.FIX_WIDTH - cropwidth) / 2);
            cropJson["inputs"]["y"] = Math.floor((Tool.FIX_HEIGHT - cropHeight) / 2);

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

Tool.checkIsSamePipeLine = function (prompt, refFile) {
    console.log("checkIsSamePipeLine:" + refFile);
    if (prompt == null) {
        return false;
    }
    try {
        const promptFile = fs.readFileSync('./pipe/' + refFile);//');
        let refPrompt = JSON.parse(promptFile);

        for (let i in refPrompt) {
            console.log(i + ":" + refPrompt[i] + ":" + prompt[i]);
            if (refPrompt[i].class_type != prompt[i].class_type) {
                console.log("BREAK " + i + ":" + refPrompt[i].class_type + ":" + prompt[i].class_type)
                return false;

            }
            else {
                if (refPrompt[i].class_type == "CheckpointLoaderSimple") {
                    if (refPrompt[i]["inputs"]["ckpt_name"] != prompt[i]["inputs"]["ckpt_name"]) {
                        console.log("BREAK " + i + ":" + refPrompt[i].class_type + ":" + refPrompt[i]["inputs"]["ckpt_name"]
                            + ":" + prompt[i]["inputs"]["ckpt_name"])
                        return false;
                    }
                }
                if (refPrompt[i].class_type == "LoraLoader") {
                    if (refPrompt[i]["inputs"]["lora_name"] != prompt[i]["inputs"]["lora_name"]) {
                        console.log("BREAK " + i + ":" + refPrompt[i].class_type + ":" + refPrompt[i]["inputs"]["lora_name"]
                            + ":" + prompt[i]["inputs"]["lora_name"])
                        return false;
                    }
                }


            }
        }
        return true;
    }
    catch (error) {
        console.log("BREAK error:" + error);
        return false;
    }
}

Tool.ApplyFaceParams = function (promptjson, faceParams) {
    if (faceParams) {
        promptjson["220"]["inputs"]["seed"] = Tool.randomInt();
        promptjson["220"]["inputs"]["denoise"] = faceParams.face_denoise;
        promptjson["220"]["inputs"]["cfg"] = faceParams.face_cfg;
        promptjson["220"]["inputs"]["steps"] = faceParams.face_samplingsteps;
        promptjson["220"]["inputs"]["sampler_name"] = faceParams.face_sampler;
        promptjson["220"]["inputs"]["scheduler"] = faceParams.face_scheduler;
    }
}

Tool.ApplyPromptNote = function (promptjson, prompt) {
    let noteJson = {
        "text": "",
        "class_type": "Note"
    };

    noteJson["text"] = prompt;
    promptjson["10000"] = noteJson;
}

Tool.ApplyOpenPoseAnimal = function (inputImageId, inputID, kSampler, prompt) {
    //400
    let openPoseLoader = {
        "inputs": {
            "control_net_name": "control_sd15_animal_openpose.pth"
        },
        "class_type": "ControlNetLoader",
        "_meta": {
            "title": "Load ControlNet Model"
        }
    }
    //401
    let openPoseApply = {
        "inputs": {
            "strength": 0.5,
            "start_percent": 0,
            "end_percent": 0.65,
            "positive": [
                "133",
                0
            ],
            "negative": [
                "134",
                0
            ],
            "control_net": [
                "400",
                0
            ],
            "image": [
                "402",
                0
            ]
        },
        "class_type": "ControlNetApplyAdvanced",
        "_meta": {
            "title": "Apply ControlNet (Advanced)"
        }
    }

    //402
    let openPosePreprocessor = {
        "inputs": {
            "detect_hand": "enable",
            "detect_body": "enable",
            "detect_face": "enable",
            "resolution": 512,
            "bbox_detector": "yolox_l.onnx",
            "pose_estimator": "dw-ll_ucoco_384.onnx",
            "image": [
                "1",
                0
            ]
        },
        "class_type": "DWPreprocessor",
        "_meta": {
            "title": "DWPose Estimator"
        }
    }

    openPosePreprocessor["inputs"]["image"][0] = inputImageId;

    openPoseApply["inputs"]["positive"][0] = inputID;
    openPoseApply["inputs"]["negative"][0] = inputID;

    prompt[kSampler]["inputs"]["positive"][0] = "401";
    prompt[kSampler]["inputs"]["negative"][0] = "401";


    prompt["400"] = openPoseLoader;
    prompt["401"] = openPoseApply;
    prompt["402"] = openPosePreprocessor;
}

Tool.ApplyCanny = function (inputImageId, inputID, kSampler, prompt, cannyStrength, startPercent = 0.2, endPercent = 0.35, lowThreshold = 0.4, highThreshold = 0.8, control_net_name = "diffusers_xl_canny_full.safetensors") {
    console.log("ApplyCanny");
    let cannyControlNetLoader = {
        "inputs": {
            "control_net_name": "diffusers_xl_canny_full.safetensors"
        },
        "class_type": "ControlNetLoader",
        "_meta": {
            "title": "Load ControlNet Model"
        }
    };

    let cannyApply = {
        "inputs": {
            "strength": 0.8,
            "start_percent": 0.2,
            "end_percent": 0.35,
            "positive": [
                "182",
                0
            ],
            "negative": [
                "182",
                1
            ],
            "control_net": [
                "300",
                0
            ],
            "image": [
                "302",
                0
            ]
        },
        "class_type": "ControlNetApplyAdvanced",
        "_meta": {
            "title": "Apply ControlNet (Advanced)"
        }
    };
    let cannyPreproceesor = {
        "inputs": {
            "low_threshold": 0.4,
            "high_threshold": 0.8,
            "image": [
                "1",
                0
            ]
        },
        "class_type": "Canny",
        "_meta": {
            "title": "Canny"
        }
    }

    cannyControlNetLoader["inputs"]["control_net_name"] = control_net_name;

    cannyPreproceesor["inputs"]["image"][0] = inputImageId;
    cannyPreproceesor["inputs"]["low_threshold"] = lowThreshold;
    cannyPreproceesor["inputs"]["high_threshold"] = highThreshold;

    cannyApply["inputs"]["positive"][0] = inputID;
    cannyApply["inputs"]["negative"][0] = inputID;
    cannyApply["inputs"]["start_percent"] = startPercent;
    cannyApply["inputs"]["end_percent"] = endPercent;


    prompt[kSampler]["inputs"]["positive"][0] = "301";
    prompt[kSampler]["inputs"]["negative"][0] = "301";
    cannyApply["inputs"]["strength"] = cannyStrength;

    prompt["300"] = cannyControlNetLoader;
    prompt["301"] = cannyApply;
    prompt["302"] = cannyPreproceesor;
}

Tool.renderParams = {};

/* index start from 1*/
Tool.addStyleTransferImageJson = function (prompt, img_ref, isImageData, index, ipAdapterCombineEmbedsIndex, ipadapterIndex) {

    let jsonIndex = (index + 100000 + (index - 1) * 100).toString();
    if (!isImageData) {
        //load image
        let json = {
            "inputs": {
                "url": "",
                "keep_alpha_channel": false,
                "output_mode": false
            },
            "class_type": "LoadImageFromUrl"
        }
        json["inputs"]["url"] = img_ref;

        prompt[jsonIndex] = json;
    }
    else {
        let json = {
            "inputs": {
                "image": "thumb_illustration refference (1).jpg",
                "upload": "image"
            },
            "class_type": "LoadImage",
            "_meta": {
                "title": "Load Image"
            }
        }

        json["inputs"]["image"] = img_ref;
        prompt[jsonIndex] = json;
    }


    let json2 = {
        "inputs": {
            "interpolation": "LANCZOS",
            "crop_position": "center",
            "sharpening": 0,
            "image": [
                jsonIndex,
                0
            ]
        },
        "class_type": "PrepImageForClipVision",
        "_meta": {
            "title": "Prep Image For ClipVision"
        }
    }

    let jsonIndex2 = (index + 100001 + (index - 1) * 100).toString();
    prompt[jsonIndex2] = json2;

    let json3 = {
        "inputs": {
            "weight": 1,
            "ipadapter": [
                ipadapterIndex,
                1
            ],
            "image": [
                jsonIndex2,
                0
            ]
        },
        "class_type": "IPAdapterEncoder",
        "_meta": {
            "title": "IPAdapter Encoder"
        }
    }

    let jsonIndex3 = (index + 100002 + (index - 1) * 100).toString();
    prompt[jsonIndex3] = json3;

    prompt[ipAdapterCombineEmbedsIndex]["inputs"]["embed" + index.toString()] = [jsonIndex3, 0];
}


module.exports = Tool;
