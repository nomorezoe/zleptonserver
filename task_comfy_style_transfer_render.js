"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');
const CharacterTool = require("./character_tool");

function TaskComfyRenderStyleTransfer(task, req, queue) {
    console.log("TaskComfyRenderStyleTransfer");

    var session = req.body.session;

    let imgData_a, imgData_b, imgData_c, imgData_d;
    let posPrompt;
    if(req.files.imageByteArray_a != undefined){
        var rawImg_a = req.files.imageByteArray_a.data;
        imgData_a = Buffer.from(rawImg_a).toString('base64');
    }
    if(req.files.imageByteArray_b != undefined){
        var rawImg_b = req.files.imageByteArray_b.data;
        imgData_b = Buffer.from(rawImg_b).toString('base64');
    }
    if(req.files.imageByteArray_c != undefined){
        var rawImg_c = req.files.imageByteArray_c.data;
        imgData_c = Buffer.from(rawImg_c).toString('base64');
    }

    if(req.files.imageByteArray_d != undefined){
        var rawImg_d = req.files.imageByteArray_d.data;
        imgData_d = Buffer.from(rawImg_d).toString('base64');
    }

    posPrompt = req.body.prompt;

    //lock character
    CharacterTool.lockChParams = {};
    CharacterTool.lockChParams.isLockCharacter = false;
    CharacterTool.characerLockPair = [];
    if (req.body.lockCharacter == 1 && req.body.fullCharacterFile != undefined) {
        CharacterTool.lockChParams.isLockCharacter = true;
        CharacterTool.lockChParams.fullCharacterPath = req.body.fullCharacterFile;
        
        CharacterTool.characerLockPair = JSON.parse(req.body.characerLockPair);
       //CharacterTool.characerLockPair = [[0,0],[1,1]];
       console.log("CharacterTool.lockChParams.fullCharacterPath "+CharacterTool.lockChParams.fullCharacterPath );
       
        if (CharacterTool.characerLockPair.length == 0) {
            CharacterTool.characerLockPair = [[0, 0]];
        }
        console.log("req.body.characerLockPair" + CharacterTool.characerLockPair);
    }

    let prompt = processChLockStyleTransfer(req, imgData_a, imgData_b, imgData_c, imgData_d, posPrompt);
    
    var cropWidth = parseFloat(req.body.cropWidth);
    var cropHeight = parseFloat(req.body.cropHeight);

    console.log("cropWidth:" + cropWidth);
    console.log("cropHeight:" + cropHeight);
    Tool.applyCropInfo(prompt, cropWidth, cropHeight);

    task.pipeline = "style_transfer";
    sendRequest(prompt, queue, task);
}

function processChLockStyleTransfer(req, imgData_a, imgData_b, imgData_c, imgData_d, posPrompt){
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_style_transfer_ch_lock.json');
    let prompt = JSON.parse(promptFile);

    var rawImg = req.files.imageByteArray.data;
    let imgData = Buffer.from(rawImg).toString('base64');

    prompt["601517"]["inputs"]["image"] = imgData_a;
    prompt["601518"]["inputs"]["image"] = imgData_b;
    prompt["601519"]["inputs"]["image"] = imgData_c;
    prompt["601520"]["inputs"]["image"] = imgData_d;
    prompt["55"]["inputs"]["text_positive"] = posPrompt;

    prompt["192"]["inputs"]["noise_seed"] =  Tool.randomInt();
    prompt["193"]["inputs"]["noise_seed"] =  Tool.randomInt();

    prompt["1"]["inputs"]["image"] = imgData;

    if(CharacterTool.lockChParams.isLockCharacter){
        CharacterTool.AddAPersonForStyleTransfer(prompt, CharacterTool.characerLockPair, CharacterTool.lockChParams.fullCharacterPath, "1", "601516", "192", "69","134", "194", "601526", "69", "149");
    }
    
    Tool.applyRandomFileName(prompt);

    //var captureFile = "save.json";
    //fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, JSON.stringify(prompt), 'utf8');

    return prompt;
}

function sendRequest(promptjson, queue, task) {

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": promptjson }));

    //send request
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
        timeout: 6000000,
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

            queue.completeTask();
            console.log("200");
            reshttps.on('data', (d) => {
                datastring += d;
                console.log("ondata");
            });

            reshttps.on('end', (d) => {
                let jsonobj = JSON.parse(datastring);
                console.log("onend_style_transfer: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var styleImageName = uuidv4() + "_style.png";
                    console.log("styleImageName:" + styleImageName);
                    task.imageFileNames.push(styleImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + styleImageName, jsonobj[i], {
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
    });

    reqhttps.write(data);
    reqhttps.end();
}

module.exports = TaskComfyRenderStyleTransfer;