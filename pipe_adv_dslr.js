"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";
const CharacterTool = require("./character_tool");

function PipeAdvanceDSLR() {

}


PipeAdvanceDSLR.process = function (imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, cannyStrength, hasBackDrop, isLockCharacter, characterFile, fullCharacterPath, info) {

    console.log("PipeAdvanceDSLR");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_dslr.json');//');
    let prompt = JSON.parse(promptFile);

    if (cannyStrength > 0) {
        Tool.ApplyCanny("1", "182", "45", prompt, cannyStrength, Tool.renderParams.cannyStart, Tool.renderParams.cannyEnd, 0.01, 0.25, "diffuserscontrolnet-canny-sdxl-1.0.safetensors");
        if (hasBackDrop) {
            //prompt["182"]["inputs"]["end_percent"] = 0.75;
            prompt["33"]["inputs"]["resolution"] = 1024;
        }
    }

    prompt["1"]["inputs"]["image"] = imgData;

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    prompt["55"]["_meta"]["info"] = info;
    console.log(positivePrompt);
    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["45"]["inputs"]["seed"] = Tool.randomInt();

    prompt["45"]["inputs"]["steps"] = sampleSteps;
    prompt["45"]["inputs"]["cfg"] = cfg;
    prompt["45"]["inputs"]["sampler_name"] = sampler;
    prompt["45"]["inputs"]["scheduler"] = scheduler;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["181"]["inputs"]["start_percent"] = Tool.renderParams.poseStart;
    prompt["181"]["inputs"]["end_percent"] = Tool.renderParams.poseEnd;

    prompt["182"]["inputs"]["strength"] = depthStrength;
    prompt["182"]["inputs"]["start_percent"] = Tool.renderParams.depthStart;
    prompt["182"]["inputs"]["end_percent"] = Tool.renderParams.depthEnd;
    //depth
    //prompt["182"]["inputs"]["start_percent"] = 0;
    //prompt["182"]["inputs"]["end_percent"] = 0.65;

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
        prompt["52"]["inputs"]["model_weight_1"] = 0.20;
        prompt["54"]["inputs"]["model_weight_1"] = 0.20;
        prompt["54"]["inputs"]["model_weight_2"] = 0.20;
        CharacterTool.AddAPerson(prompt, CharacterTool.characerLockPair, CharacterTool.lockChParams.fullCharacterPath, "1", "53", "45", "69", "134", "49", "224", "4");

        for (let b = 0; b < CharacterTool.BATCH; b++) {
            for (let i = 0; i < CharacterTool.characerLockPair.length; i++) {
                //"100524": 
                let DetailerForEach_Face_Id = (100524 + b * 10000 + i * 1000).toString();
                prompt[DetailerForEach_Face_Id]["inputs"]["steps"] = 5;
                prompt[DetailerForEach_Face_Id]["inputs"]["cfg"] = 2.0;
            }
        }


    }

    return prompt;
}

PipeAdvanceDSLR.quickProcess = function (positivePrompt, imgurl, imgData) {
    console.log("PipeAdvanceDSLR.quickProcess");

    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_dslr.json');//');
    let prompt = JSON.parse(promptFile);

    if (imgData != null) {
        prompt["1"]["inputs"]["image"] = imgData;
    }
    else {
        Tool.applyImage(prompt, "1", null, imgurl);
    }

    let steps = 5;
    let cfg = 2;
    let sampler = "dpmpp_sde";
    let scheduler = "karras";
    let poseStrength = 0.0;
    let poseStart = 0;
    let poseEnd = 0.65;
    let depthStrength = 0.5;
    let depthStart = 0;
    let depthEnd = 0.65;
    let cannyStrength = 0.52;
    let cannyStart = 0;
    let cannyEnd = 0.75;

    let negtivePrompt = "Asymmetrical Eyes, expsoed stomach, navel,  Mismatched Eyes, Distorted Eyes, Unaligned Eyes, Blurry Eyes, Overexaggerated Eyes, Inconsistent Lighting on Eyes, Unnatural Eye Color, Floating Eyes, Missing Eyelids, ugly, deformed, noisy, blurry, low contrast, realistic, ugly breasts, tripod, camera, anime, animation, cartoon, 3D, drawing, painting, (censorship, censored, worst quality, low quality, normal quality, lowres, low details, bad photo, bad photography, bad art:1.4), (watermark, signature, text font, username, error, logo, words, letters, digits, autograph, trademark, name:1.2), (blur, blurry), morbid, ugly, asymmetrical, mutated malformed, mutilated, poorly lit, bad shadow, draft, cropped, out of frame, cut off, censored, jpeg artifacts, out of focus, glitch, duplicate, (bad hands, bad anatomy, bad body, bad face, bad teeth, bad arms, bad legs, deformities:1.3) (ugly hands, ugly anatomy, ugly body, ugly face, ugly teeth, ugly arms, ugly legs, deformities:1.3) ugly fingers, bad fingers, (((ugly nipples, bad nipples, deformed nipples))), (((Bad teeth, ugly teeth)))";

    let pretext = "Cinematic Hollywood Film, photo in phst artstyle, ";
    positivePrompt = pretext + positivePrompt;

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    prompt["55"]["inputs"]["text_negative"] = negtivePrompt;

    Tool.ApplyCanny("1", "182", "45", prompt, cannyStrength, cannyStart, cannyEnd, 0.01, 0.25, "diffuserscontrolnet-canny-sdxl-1.0.safetensors");
    prompt["33"]["inputs"]["resolution"] = 1024;

    prompt["45"]["inputs"]["seed"] = Tool.randomInt();

    prompt["45"]["inputs"]["steps"] = steps;
    prompt["45"]["inputs"]["cfg"] = cfg;
    prompt["45"]["inputs"]["sampler_name"] = sampler;
    prompt["45"]["inputs"]["scheduler"] = scheduler;

    prompt["181"]["inputs"]["strength"] = poseStrength;
    prompt["181"]["inputs"]["start_percent"] = poseStart;
    prompt["181"]["inputs"]["end_percent"] = poseEnd;

    prompt["182"]["inputs"]["strength"] = depthStrength;
    prompt["182"]["inputs"]["start_percent"] = depthStart;
    prompt["182"]["inputs"]["end_percent"] = depthEnd;

    return prompt;

}
module.exports = PipeAdvanceDSLR;