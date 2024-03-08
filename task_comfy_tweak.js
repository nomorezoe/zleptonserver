"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const ExifReader = require('exifreader');

function TaskComfyTweak(task, req, queue) {

    var session = req.body.session;
    var prompt = req.body.prompt;
    let fullfilepath = req.body.fullfilepath;
    let denoise = parseFloat(req.body.denoise);
    let capture = req.body.capture;

    console.log("denoise:" + denoise);
    console.log("capture:" + capture);
    
    var promptjson;
    var replaced = false;

    if (req.body.tags != undefined) {
        var tagString = req.body.tags
        var tags = JSON.parse(tagString);
        if (tags.prompt) {
            var jsonString = tags.prompt.value;
            //console.log("EXif:" + jsonString);
            promptjson = JSON.parse(jsonString);

            for (let i in promptjson) {
                if (promptjson[i]["inputs"] != undefined && promptjson[i]["inputs"]["text_positive"] != undefined) {
                    replaced = true;
                    console.log("text_positive" + i +":"+ prompt);
                    promptjson[i]["inputs"]["text_positive"] = prompt;
                    break;
                }
            }

            for (let j in promptjson) {
                if (promptjson[j]["class_type"] == "LoadImage") {
                    console.log("applyImage" + j);
                    if(capture != null && capture != "" && capture != undefined){
                        Tool.applyImage(promptjson, j, null, capture);
                    }
                    else{
                        Tool.applyImage(promptjson, j, null, fullfilepath);
                    }
                   
                    break;
                }
            }

            for (let m in promptjson) {
                if (promptjson[m]["class_type"] == "KSampler") {
                    console.log("KSampler" + m);
                    promptjson[m]["inputs"]["denoise"] = denoise;
                    break;
                }
            }

            for (let k in promptjson) {
                if (promptjson[k]["inputs"] && promptjson[k]["inputs"]["batch_size"]) {
                    console.log("batch_size" + k);
                    promptjson[k]["inputs"]["batch_size"] = 1;
                    break;
                }
            }
        }
    }

    console.log("promptjson:" + promptjson);
    
    if (replaced) {
        sendRequest(promptjson, queue, task);
    }
    else {
        queue.completeTask();
    }

}

function sendRequest(promptjson, queue, task) {
    //console.log("tweak:" + promptjson);

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": promptjson }));

    //send request
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
        reshttps.setTimeout(6000000);
        if (reshttps.statusCode == 200) {

            queue.completeTask();
            console.log("200");
            reshttps.on('data', (d) => {
                datastring += d;
                // console.log("ondata");
            });

            reshttps.on('end', (d) => {
                let jsonobj = JSON.parse(datastring);
                console.log("onend_tweak: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var upscaleImageName = uuidv4() + "_tweak.png";
                    task.imageFileNames.push(upscaleImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + upscaleImageName, jsonobj[i], {
                        encoding: "base64",
                    });
                }
                task.sendCompleteTaskSuccess();
            });
        }
        else {
            queue.completeTask();
        }
    });

    reqhttps.setTimeout(6000000);
    reqhttps.on('error', (error) => {
        console.error(error);
        queue.completeTask();
    });

    reqhttps.write(data);
    reqhttps.end();
}

module.exports = TaskComfyTweak;