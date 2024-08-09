"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function PipeAdvanceTweak(task, req, queue) {
    console.log("PipeAdvanceTweak");

    var session = req.body.session;
    var data = req.body.data;
    //console.log("data:" + data);

    if (Tool.isTweakJson(data) > 0) {
        let json = Tool.getTweakJson(data);

        for(let i in json){
            if(json[i].class_type == "LoadImage"){
                let loadImageIndex = i;

                console.log("loadImageIndex:"  + loadImageIndex);

                if (req.body.url != undefined) {
                    Tool.applyImage(json, loadImageIndex, null, req.body.url);
                }
                else {
                    var rawImg = req.files.imageByteArray.data;
                    imgData = Buffer.from(rawImg).toString('base64');
            
                    json[loadImageIndex]["inputs"]["image"] = imgData;
                }

                break;
            }
        }
        

        sendRequest(json, queue, task);
    }
    else {
        queue.completeTaskFailed();
    }
}


function sendRequest(promptjson, queue, task) {
    console.log("sendRequest");
    fs.writeFileSync(__dirname + OUTPUT_FOLDER + "c.json", JSON.stringify(promptjson), 'utf8');

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
                console.log("onend_adv_tweak: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {

                    var styleImageName = uuidv4() + "_adv_tweak.png";
                    console.log("tweakImageName:" + styleImageName);
                    task.imageFileNames.push(styleImageName);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + styleImageName, jsonobj[i], {
                        encoding: "base64",
                    });
                }
                task.sendCompleteTaskSuccess();
            });
        }
        else {
            console.log("completeTaskFailed_1");
            queue.completeTaskFailed();
        }
    });

    reqhttps.on('error', (error) => {
        console.error(error);
        console.log("completeTaskFailed_2");
        queue.completeTaskFailed();
    });

    reqhttps.write(data);
    reqhttps.end();
}

module.exports = PipeAdvanceTweak;

