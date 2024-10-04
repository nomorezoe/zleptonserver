"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";
const CharacterTool = require("./character_tool");

function PipeAdvancePhotoRealism() {

}

PipeAdvancePhotoRealism.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, hasBackDrop, info) {

    console.log("PipeAdvancePhotoRealism");
    let promptFile;
    promptFile = fs.readFileSync('./pipe/workflow_api_adv_realism_photo.json');//');



    let prompt = JSON.parse(promptFile);

    if (cannyStrength > 0) {
        Tool.ApplyCanny("1", "182", "192", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd, 0.01, 0.25, "diffuserscontrolnet-canny-sdxl-1.0.safetensors");

        if (hasBackDrop) {
            // prompt["182"]["inputs"]["end_percent"] = 0.75;
            prompt["33"]["inputs"]["resolution"] = 1024;
        }
    }


    prompt["1"]["inputs"]["image"] = imgData;

    let tailText = "cinematic lighting, masterpiece, high quality, high resolution, 4K, HDR";
    let tailTexts = tailText.split(",");
    for (let i in tailTexts) {
        if (positivePrompt.indexOf(tailTexts[i]) == -1) {
            positivePrompt += " " + tailTexts[i] + ",";
        }
    }

    console.log("positivePrompt:" + positivePrompt);

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    prompt["55"]["_meta"]["info"] = info;
    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;

    //prompt["55"]["inputs"]["style"] = style;

    prompt["192"]["inputs"]["noise_seed"] = Tool.randomInt();
    prompt["193"]["inputs"]["noise_seed"] = Tool.randomInt();


    prompt["192"]["inputs"]["steps"] = sampleSteps;
    prompt["192"]["inputs"]["cfg"] = cfg;
    prompt["192"]["inputs"]["sampler_name"] = sampler;
    prompt["192"]["inputs"]["scheduler"] = scheduler;

    prompt["193"]["inputs"]["steps"] = sampleSteps;
    prompt["193"]["inputs"]["cfg"] = cfg;
    prompt["193"]["inputs"]["sampler_name"] = sampler;
    prompt["193"]["inputs"]["scheduler"] = scheduler;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["181"]["inputs"]["start_percent"] = Tool.renderParams.poseStart;
    prompt["181"]["inputs"]["end_percent"] = Tool.renderParams.poseEnd;

    prompt["182"]["inputs"]["strength"] = depthStrength;
    prompt["182"]["inputs"]["start_percent"] = Tool.renderParams.depthStart;
    prompt["182"]["inputs"]["end_percent"] = Tool.renderParams.depthEnd;



    //lora

    console.log("loras" + loras);
    if (Tool.renderParams.lora_weights["real-humans-PublicPrompts"] != undefined) {
        prompt["52"]["inputs"]["switch_1"] = "On";
        prompt["52"]["inputs"]["model_weight_1"] = Tool.renderParams.lora_weights["real-humans-PublicPrompts"];
        console.log("lora real-humans-PublicPrompts On");
    }

    if (Tool.renderParams.lora_weights["Cinematic_Hollywood_Film"] != undefined) {
        prompt["54"]["inputs"]["model_weight_1"] = Tool.renderParams.lora_weights["Cinematic_Hollywood_Film"];
        console.log("lora Cinematic_Hollywood_Film On");
    }
    else {
        prompt["54"]["inputs"]["switch_1"] = "Off";
    }

    if (Tool.renderParams.lora_weights["BetterPhotography"] != undefined) {
        prompt["54"]["inputs"]["model_weight_2"] = Tool.renderParams.lora_weights["BetterPhotography"];
        console.log("lora BetterPhotography On");
    }
    else {
        prompt["54"]["inputs"]["switch_2"] = "Off";
    }

    //ch lock
    if (CharacterTool.lockChParams.isLockCharacter) {
        prompt["192"]["inputs"]["end_at_step"] = 23;
        prompt["193"]["inputs"]["start_at_step"] = 23;
        prompt["54"]["inputs"]["model_weight_1"] = 0.20;
        prompt["54"]["inputs"]["model_weight_2"] = 0.20;
        prompt["52"]["inputs"]["model_weight_1"] = 0.20;
        CharacterTool.AddAPerson(prompt, CharacterTool.characerLockPair, CharacterTool.lockChParams.fullCharacterPath, "1", "53", "192", "69", "134", "194", "223", "4");
    }
    return prompt;
}

PipeAdvancePhotoRealism.quickProcess = function (positivePrompt, imgurl, imgData, req) {
    console.log("PipeAdvancePhotoRealism.quickProcess");
    let promptFile;
    promptFile = fs.readFileSync('./pipe/workflow_api_adv_realism_photo.json');//');
    let prompt = JSON.parse(promptFile);
    if (imgData != null) {
        prompt["1"]["inputs"]["image"] = imgData;
    }
    else {
        Tool.applyImage(prompt, "1", null, imgurl);
    }

    let pretext = "Cinematic Hollywood Film, photo in phst artstyle, ";
    positivePrompt = pretext + positivePrompt;

    let steps = 21;
    let cfg = 5;
    let sampler = "dpmpp_2m";
    let scheduler = "karras";
    let poseStrength = 0.0;
    let poseStart = 0;
    let poseEnd = 0.65;
    let depthStrength = 0.26;
    let depthStart = 0;
    let depthEnd = 0.75;
    let cannyStrength = 0.3;
    let cannyStart = 0;
    let cannyEnd = 0.75;
    let negtivePrompt = "bare chest, asian, low res, (worst quality, greyscale), watermark, face paint, username, signature, text, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, jpeg artifacts, bad feet, extra fingers, mutated hands, poorly drawn hands, bad proportions, extra limbs, disfigured, bad anatomy, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, mutated hands, , blur, distortion, fused fingers, too many fingers, too many legs, long neck, cut off hands, large ass, large chest, bare chest. (three legs),((((ugly)))),(((duplicate))),((morbid)),((mutilated)),[out of frame], (three hands),((poorly drawn hands))";

    prompt["192"]["inputs"]["steps"] = steps;
    prompt["192"]["inputs"]["cfg"] = cfg;
    prompt["192"]["inputs"]["sampler_name"] = sampler;
    prompt["192"]["inputs"]["scheduler"] = scheduler;

    prompt["193"]["inputs"]["steps"] = steps;
    prompt["193"]["inputs"]["cfg"] = cfg;
    prompt["193"]["inputs"]["sampler_name"] = sampler;
    prompt["193"]["inputs"]["scheduler"] = scheduler;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["181"]["inputs"]["start_percent"] = poseStart;
    prompt["181"]["inputs"]["end_percent"] = poseEnd;

    prompt["182"]["inputs"]["strength"] = depthStrength;
    prompt["182"]["inputs"]["start_percent"] = depthStart;
    prompt["182"]["inputs"]["end_percent"] = depthEnd;

    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;

    if (cannyStrength > 0) {
        Tool.ApplyCanny("1", "182", "192", prompt, cannyStrength, cannyStart, cannyEnd, 0.01, 0.25, "diffuserscontrolnet-canny-sdxl-1.0.safetensors");
        prompt["33"]["inputs"]["resolution"] = 1024;
    }

    let tailText = "cinematic lighting, masterpiece, high quality, high resolution, 4K, HDR";
    let tailTexts = tailText.split(",");
    for (let i in tailTexts) {
        if (positivePrompt.indexOf(tailTexts[i]) == -1) {
            positivePrompt += " " + tailTexts[i] + ",";
        }
    }

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    prompt["192"]["inputs"]["noise_seed"] = Tool.randomInt();
    prompt["193"]["inputs"]["noise_seed"] = Tool.randomInt();

    let poseInfluence = 0.5;
    let poseEffectFade = 0.65;
    let depthInfluence = 0.8;
    let depthEffectFade = 0.4;
    let creativityLevel = 1.0;
    if (req.body.poseInfluence != undefined) {
        poseInfluence = req.body.poseInfluence;
    }
    if (req.body.poseEffectFade != undefined) {
        poseEffectFade = req.body.poseEffectFade;
    }
    if (req.body.depthInfluence != undefined) {
        depthInfluence = req.body.depthInfluence;
    }
    if (req.body.depthEffectFade != undefined) {
        depthEffectFade = req.body.depthEffectFade;
    }
    if (req.body.creativityLevel != undefined) {
        creativityLevel = req.body.creativityLevel;
    }

    prompt["182"]["inputs"]["strength"] = depthInfluence;
    prompt["182"]["inputs"]["end_percent"] = depthEffectFade;

    prompt["181"]["inputs"]["strength"] = poseInfluence;
    prompt["181"]["inputs"]["end_percent"] = poseEffectFade;

   // prompt["45"]["inputs"]["denoise"] = creativityLevel;


    return prompt;
}

module.exports = PipeAdvancePhotoRealism;