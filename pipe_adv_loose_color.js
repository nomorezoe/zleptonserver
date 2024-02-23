"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function PipeAdvanceLooseColor() {

}


PipeAdvanceLooseColor.process = function(imgData, positivePrompt, negtivePrompt, modelFile, loras, style, cfg, sampleSteps, sampler, scheduler, poseStrength, depthStrength, isLockCharacter, characterFile, fullCharacterPath){

    console.log("PipeAdvanceLooseColor");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_loose_color.json');//');
    let prompt = JSON.parse(promptFile);


    let tailText = "digital artwork, illustrative, painterly, matte painting, highly detailed";
    let tailTexts = tailText.split(",");
    for(let i in tailTexts){
        if(positivePrompt.indexOf(tailTexts[i]) == -1){
            positivePrompt += " "+ tailTexts[i] +",";
        }
    }

    
    prompt["1"]["inputs"]["image"]=imgData;

    prompt["55"]["inputs"]["text_positive"] = positivePrompt;
    //prompt["55"]["inputs"]["text_negative"] = negtivePrompt;
    //prompt["55"]["inputs"]["style"] = style;

    prompt["45"]["inputs"]["seed"] =  Tool.randomInt();

    return prompt;
}

module.exports = PipeAdvanceLooseColor;