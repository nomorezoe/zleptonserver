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

    let url_a, url_b, url_c, url_d;
    let posPrompt;
    if(req.body.url_a != undefined){
        url_a = req.body.url_a;
        console.log("url_a is :" + url_a );
    }
    if(req.body.url_b != undefined){
        url_b = req.body.url_b;
        console.log("url_b is :" + url_b );
    }
    if(req.body.url_c != undefined){
        url_c = req.body.url_c;
        console.log("url_c is :" + url_c );
    }
    if(req.body.url_d != undefined){
        url_d = req.body.url_d;
        console.log("url_d is :" + url_d );
    }

    posPrompt = req.body.prompt;

    if(req.body.pretext != undefined){
        console.log("pretext is :" + req.body.pretext );
        posPrompt = req.body.pretext +", " + posPrompt;
    }

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

    var rawImg = req.files.imageByteArray.data;
    let imgData = Buffer.from(rawImg).toString('base64');

     //capture
     var captureFile = uuidv4() + "capture.png";
     fs.writeFileSync(__dirname + OUTPUT_FOLDER + captureFile, imgData, {
         encoding: "base64",
     });
 
     //task.sendSocketMsg("generateScreenCapture", captureFile);

    let prompt = processChLockStyleTransfer(imgData, url_a, url_b, url_c, url_d, posPrompt);
    
    var cropWidth = parseFloat(req.body.cropWidth);
    var cropHeight = parseFloat(req.body.cropHeight);

    console.log("cropWidth:" + cropWidth);
    console.log("cropHeight:" + cropHeight);
    Tool.applyCropInfo(prompt, cropWidth, cropHeight);

    task.pipeline = "style_transfer";
    sendRequest(prompt, queue, task);
}

function processChLockStyleTransfer(imgData, url_a, url_b, url_c, url_d, posPrompt){
    const promptFile = fs.readFileSync('./pipe/workflow_api_adv_style_transfer_ch_lock.json');
    let prompt = JSON.parse(promptFile);

    /*prompt["601517"]["inputs"]["image"] = imgData_a;
    prompt["601518"]["inputs"]["image"] = imgData_b;
    prompt["601519"]["inputs"]["image"] = imgData_c;
    prompt["601520"]["inputs"]["image"] = imgData_d;
    */
    Tool.applyImage(prompt, "601517", null, url_a);
    Tool.applyImage(prompt, "601518", null, url_b);
    Tool.applyImage(prompt, "601519", null, url_c);
    Tool.applyImage(prompt, "601520", null, url_d);

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