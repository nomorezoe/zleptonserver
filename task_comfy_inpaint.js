"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const sizeOf = require('buffer-image-size');
const ExifReader = require('exifreader');
const { v4: uuidv4 } = require('uuid');

function TaskComfyInPaint(task, req, queue) {

    var prompt = req.body.prompt;

    var inpaintStyle = req.body.inpaintStyle;
    var ipimageURL = req.body.ipimageURL;
    var denoise = parseFloat(req.body.denoise);
    var cfg = parseFloat(req.body.cfg);
    var samplingsteps = parseInt(req.body.samplingsteps);
    var sampler = req.body.sampler;
    var scheduler = req.body.scheduler;

    console.log('inpaintStyle:', inpaintStyle);
    console.log('ipimageURL:', ipimageURL);
    console.log('denoise:', denoise);
    console.log('cfg:', cfg);
    console.log('samplingsteps:', samplingsteps);
    console.log('sampler:', sampler);
    console.log('scheduler:', scheduler);



    //mask
    var rawMaskImg = req.files.imageByteArray.data;
    var buffer = Buffer.from(rawMaskImg);
    var maskBytes = buffer.toString('base64');

    /*fs.writeFileSync(__dirname + OUTPUT_FOLDER + uuidv4() + "mask.png", maskBytes,{
        encoding: "base64",
    });*/
    

    let promptjson = null;

    switch(inpaintStyle){
        case "1":
            task.pipeline = "inpaint_wardobe";
            promptjson = TaskComfyInPaint.advanceProcess(req.body.fullFilePath , req.body.tags, maskBytes, prompt,denoise, cfg, samplingsteps, sampler, scheduler);
            break;

        case "2":
            task.pipeline = "inpaint_expressyourself";
            promptjson = TaskComfyInPaint.advanceProcessExpressyourself(req.body.fullFilePath , req.body.tags, maskBytes, prompt,denoise, cfg, samplingsteps, sampler, scheduler);
            break;

        case "3":
            task.pipeline = "inpaint_advance";
            promptjson = TaskComfyInPaint.advanceProcessLockCharacter(req.body.fullFilePath , req.body.tags, maskBytes, prompt,ipimageURL,denoise, cfg, samplingsteps, sampler, scheduler);

            break;
        default:
            promptjson = TaskComfyInPaint.advanceProcess(req.body.fullFilePath , req.body.tags, maskBytes, prompt);
    }
    
    

    Tool.applyRandomFileName(promptjson);

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": promptjson }));
    //console.log(data)
    console.log(data.length)
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': "Bearer ozlh7xvpezbtwlr9tseg14imf4fhqo5v"
        }
    };

    var datastring = "";
    const reqhttps = https.request(options, (reshttps) => {
        console.log('statusCode:', reshttps.statusCode);
        console.log('headers:', reshttps.headers);

       

        if (reshttps.statusCode == 200) {
            console.log("200");
            queue.completeTask();

            reshttps.on('data', (d) => {
                datastring += d;
                //console.log("ondata");
            });
    
            reshttps.on('end', (d) => {
                let jsonobj = JSON.parse(datastring);
    
                console.log("onend_inpaint: "  + task.key);
                for (var i = 0; i < jsonobj.length; i++) {
                    var inpaintFileName =  uuidv4() + "_inpaint.png";
                    console.log("inpaintImageName:" + inpaintFileName);
                    task.imageFileNames.push(inpaintFileName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + inpaintFileName, jsonobj[i],{
                        encoding: "base64",
                    });
                }
               
                task.sendCompleteTaskSuccess();
            });
        }
        else {
            queue.completeTaskFailed();
        }
    });

    reqhttps.on('error', (error) => {
        console.error(error);
        queue.completeTaskFailed();
        return;
    });

    reqhttps.write(data);
    reqhttps.end();
}
module.exports = TaskComfyInPaint;

//wardobe
TaskComfyInPaint.advanceProcess = function(fullFilePath, tags, maskBytes, prompt, denoise, cfg, samplingsteps, sampler, scheduler){
     //load workflow
     console.log("TaskComfyInPaint.advanceProcess");
     const promptFile = fs.readFileSync('./pipe/workflow_api_adv_inpaint.json');
     let promptjson = JSON.parse(promptFile);

     Tool.applyImage(promptjson, "198", null, fullFilePath);

    
     var dWidth = 1152;
     var dHeight = 896;

     if(tags != undefined){
    
        var jsonTags = JSON.parse(tags);
    // console.log("read tags"  + jsonTags["prompt"]["value"]);
        dWidth = jsonTags["Image Width"].value;
        dHeight = jsonTags["Image Height"].value;
    }

    console.log("dWidth" + dWidth);
    console.log("dHeight" + dHeight);
    
    promptjson["213"]["inputs"]["image"] = maskBytes;

    promptjson["215"]["inputs"]["width"] = dWidth;
    promptjson["215"]["inputs"]["height"] = dHeight;

    promptjson["86"]["inputs"]["seed"] = Tool.randomInt();
    promptjson["87"]["inputs"]["text"] = prompt;

    promptjson["86"]["inputs"]["steps"] = samplingsteps;
    promptjson["86"]["inputs"]["cfg"] = cfg;
    promptjson["86"]["inputs"]["sampler_name"] = sampler;
    promptjson["86"]["inputs"]["scheduler"] = scheduler;
    promptjson["86"]["inputs"]["denoise"] = denoise;

    return promptjson;
     
}

//ad studio
TaskComfyInPaint.advanceProcessLockCharacter = function(fullFilePath, tags, maskBytes, prompt, ipimageURL, denoise, cfg, samplingsteps, sampler, scheduler){
    //load workflow
    console.log("TaskComfyInPaint.advanceProcessLockCharacter");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_inpaint_lock_ch.json');
    let promptjson = JSON.parse(promptFile);

    Tool.applyImage(promptjson, "198", null, fullFilePath);
    Tool.applyImage(promptjson, "178", null, ipimageURL);

    var dWidth = 1152;
    var dHeight = 896;

    if(tags != undefined){
   
       var jsonTags = JSON.parse(tags);
   // console.log("read tags"  + jsonTags["prompt"]["value"]);
       dWidth = jsonTags["Image Width"].value;
       dHeight = jsonTags["Image Height"].value;
   }

   console.log("dWidth" + dWidth);
   console.log("dHeight" + dHeight);
   
   promptjson["213"]["inputs"]["image"] = maskBytes;

   promptjson["215"]["inputs"]["width"] = dWidth;
   promptjson["215"]["inputs"]["height"] = dHeight;

   promptjson["86"]["inputs"]["seed"] = Tool.randomInt();
   promptjson["87"]["inputs"]["text"] = prompt;

   promptjson["86"]["inputs"]["steps"] = samplingsteps;
   promptjson["86"]["inputs"]["cfg"] = cfg;
   promptjson["86"]["inputs"]["sampler_name"] = sampler;
   promptjson["86"]["inputs"]["scheduler"] = scheduler;
   promptjson["86"]["inputs"]["denoise"] = denoise;

   return promptjson;
    
}


TaskComfyInPaint.advanceProcessExpressyourself = function(fullFilePath, tags, maskBytes, prompt, denoise, cfg, samplingsteps, sampler, scheduler){
    //load workflow
    console.log("TaskComfyInPaint.advanceProcessExpressyourself");
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_inpaint_yourself.json');
    let promptjson = JSON.parse(promptFile);

    Tool.applyImage(promptjson, "198", null, fullFilePath);

    var dWidth = 1152;
    var dHeight = 896;

    if(tags != undefined){
   
       var jsonTags = JSON.parse(tags);
   // console.log("read tags"  + jsonTags["prompt"]["value"]);
       dWidth = jsonTags["Image Width"].value;
       dHeight = jsonTags["Image Height"].value;
   }



   console.log("dWidth" + dWidth);
   console.log("dHeight" + dHeight);
   
   promptjson["213"]["inputs"]["image"] = maskBytes;

   promptjson["215"]["inputs"]["width"] = dWidth;
   promptjson["215"]["inputs"]["height"] = dHeight;

   promptjson["86"]["inputs"]["seed"] = Tool.randomInt();
   promptjson["87"]["inputs"]["text"] = prompt;

   promptjson["86"]["inputs"]["steps"] = samplingsteps;
   promptjson["86"]["inputs"]["cfg"] = cfg;
   promptjson["86"]["inputs"]["sampler_name"] = sampler;
   promptjson["86"]["inputs"]["scheduler"] = scheduler;
   promptjson["86"]["inputs"]["denoise"] = denoise;

   return promptjson;
    
}


TaskComfyInPaint.defaultProcess = function(fullFilePath, tags, maskBytes, prompt){
    //load workflow
    const promptFile = fs.readFileSync('./pipe/workflow_api_inpaint.json');
    let promptjson = JSON.parse(promptFile);

    //original image
  
    var dWidth = 1024;
    var dHeight = 576;

    console.log("FULL PATH" + fullFilePath)
    Tool.applyImage(promptjson, "2", null, fullFilePath);

    var tags = tags;
    if(tags != undefined){
    
        var jsonTags = JSON.parse(tags);
    // console.log("read tags"  + jsonTags["prompt"]["value"]);
        dWidth = jsonTags["Image Width"].value;
        dHeight = jsonTags["Image Height"].value;

        if(jsonTags.prompt && jsonTags.prompt.value){
            var jsonString = jsonTags.prompt.value;
            var jsonSettings = JSON.parse(jsonString);
            for(var i in jsonSettings){
                if(jsonSettings[i]["inputs"] != undefined
                    && jsonSettings[i]["inputs"]["ckpt_name"]!= undefined){
                        if(Tool.isQualifiedCkpt(jsonSettings[i]["inputs"]["ckpt_name"])){
                        // promptjson["11"]["inputs"]["ckpt_name"] = jsonSettings[i]["inputs"]["ckpt_name"];
                        }
                        console.log("find" + jsonSettings[i]["inputs"]["ckpt_name"]);
                    }
            }
        }
    }



    console.log("dWidth" + dWidth);
    console.log("dHeight" + dHeight);




    /*
    //read history checkpoint
    const tags =  ExifReader.load(rawImg);
    //console.log("Tags:" + tags.prompt);
    if(tags.prompt && tags.prompt.value){
        var jsonString = tags.prompt.value;
        //console.log("EXif:" + jsonString);
        var jsonSettings = JSON.parse(jsonString);
        for(var i in jsonSettings){
            if(jsonSettings[i]["inputs"] != undefined
                && jsonSettings[i]["inputs"]["ckpt_name"]!= undefined){
                    if(Tool.isQualifiedCkpt(jsonSettings[i]["inputs"]["ckpt_name"])){
                        promptjson["11"]["inputs"]["ckpt_name"] = jsonSettings[i]["inputs"]["ckpt_name"];
                    }
                    console.log("find" + jsonSettings[i]["inputs"]["ckpt_name"]);
                }
        }
    }
    */


    promptjson["1"]["inputs"]["image"] = maskBytes;

    promptjson["19"]["inputs"]["width"] = dWidth;
    promptjson["19"]["inputs"]["height"] = dHeight;

    promptjson["35"]["inputs"]["seed"] = Tool.randomInt();
    promptjson["13"]["inputs"]["text"] = prompt;

    return promptjson;
}