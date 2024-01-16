"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const sizeOf = require('buffer-image-size');
const ExifReader = require('exifreader');

function isQualifiedCkpt(model){
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

function TaskComfyInPaint(task, req, queue) {

    //mask
    var rawMaskImg = req.files.imageByteArray.data;
    var buffer = Buffer.from(rawMaskImg);
    var maskBytes = buffer.toString('base64');

    var dimensions = sizeOf(buffer);
    var dWidth = dimensions.width;
    var dHeight = dimensions.height;

    //original image
    var imageFileName = req.body.file;
    var inpaintFileName = imageFileName.split(".")[0] + "_inpaint.png";
    
    var rawImg = fs.readFileSync(__dirname + OUTPUT_FOLDER + imageFileName);
    var imgBytes = rawImg.toString('base64');

    var prompt = req.body.prompt;

    const promptFile = fs.readFileSync('./pipe/workflow_api_inpaint.json');
    let promptjson = JSON.parse(promptFile);


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
                    if(isQualifiedCkpt(jsonSettings[i]["inputs"]["ckpt_name"])){
                        promptjson["11"]["inputs"]["ckpt_name"] = jsonSettings[i]["inputs"]["ckpt_name"];
                    }
        
                    console.log("find" + jsonSettings[i]["inputs"]["ckpt_name"]);
                }
        }
    }

    

   
    promptjson["1"]["inputs"]["image"] = maskBytes;
    promptjson["2"]["inputs"]["image"] = imgBytes;

    promptjson["19"]["inputs"]["width"] = dWidth;
    promptjson["19"]["inputs"]["height"] = dHeight;

    promptjson["12"]["inputs"]["seed"] = Tool.randomInt(450993616797312);
    promptjson["13"]["inputs"]["text"] = prompt;

    var data = JSON.stringify({ "prompt": promptjson });
    //console.log(data)
    console.log(data.length)
    const options = {
        hostname: 'j9e5gs4n-comfyui.bjz.edr.lepton.ai',
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

        reshttps.on('data', (d) => {
            datastring += d;
            console.log("ondata");
        });

        reshttps.on('end', (d) => {
            let jsonobj = JSON.parse(datastring);

            console.log("onend" + jsonobj.length);
            for (var i = 0; i < jsonobj.length; i++) {
                task.imageFileNames.push(inpaintFileName);
                fs.writeFileSync(__dirname + OUTPUT_FOLDER + inpaintFileName, jsonobj[i],{
                    encoding: "base64",
                });
            }
            queue.completeTask();
        });

        if (reshttps.statusCode == 200) {
            console.log("200");
        }
        else {
            queue.completeTask();
        }
    });

    reqhttps.on('error', (error) => {
        console.error(error);
        queue.completeTask();
    });

    reqhttps.write(data);
    reqhttps.end();
}
module.exports = TaskComfyInPaint;