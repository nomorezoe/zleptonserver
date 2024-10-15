"strict mode"
const https = require('https');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');
const { json } = require('body-parser');

function FaceFlexPipeSaveImage(task, req, queue) {
    console.log("FaceFlexPipeSaveImage");

    var session = req.body.session;
    var text = req.body.prompt;

    const promptFile = fs.readFileSync('./pipe/workflow_api_face_flex_save_image.json');//');
    let prompt = JSON.parse(promptFile);

    let count = 1;
    if(req.body.facecount){
        count = req.body.facecount;
    }
    updatePromptByCount(prompt, count);

    if (req.body.type == "body") {
        prompt["20"]["inputs"]["model_name"] = "segm/person_yolov8m-seg.pt";
       // delete prompt["20036"];
    }
    else{
      //  delete prompt["20036"];
    }

    let deleteCount = 4 - count;
    for(i = 0; i < count ; i++){

        let params = [];
        for (let j = 0; j < 12; j++) {
            params[j] = req.body["face_" + i + "_" + "p" + j] - 0.5;
            
        }

        console.log("params: " + params);

        let id10003 = 10003 + (deleteCount + i) * 10 + "";

        prompt[id10003]["inputs"]["rotate_pitch"] = (params[0] > 0) ? (20 * params[0]) : (20 * params[0]);
        prompt[id10003]["inputs"]["rotate_yaw"] = (params[1] > 0) ? (20 * params[1]) : (20 * params[1]);
        prompt[id10003]["inputs"]["rotate_roll"] = (params[2] > 0) ? (20 * params[2]) : (20 * params[2]);

        prompt[id10003]["inputs"]["blink"] = (params[3] > 0) ? (5 * params[3]) : (20 * params[3]);
        prompt[id10003]["inputs"]["eyebrow"] = (params[4] > 0) ? (15 * params[4]) : (10 * params[4]);
        prompt[id10003]["inputs"]["wink"] = (params[5] > 0) ? (25 * params[5]) : (0 * params[5]);
        prompt[id10003]["inputs"]["pupil_x"] = (params[6] > 0) ? (15 * params[6]) : (15 * params[6]);
        prompt[id10003]["inputs"]["pupil_y"] = (params[7] > 0) ? (15 * params[7]) : (15 * params[7]);
        prompt[id10003]["inputs"]["aaa"] = (params[8] > 0) ? (120 * params[8]) : (30 * params[8]);
        prompt[id10003]["inputs"]["eee"] = (params[9] > 0) ? (15 * params[9]) : (20 * params[9]);
        prompt[id10003]["inputs"]["woo"] = (params[10] > 0) ? (15 * params[10]) : (20 * params[10]);
        prompt[id10003]["inputs"]["smile"] = (params[11] > 0) ? (1.3 * params[11]) : (0.3 * params[11]);

        let id10000 = 10000 + (deleteCount + i) * 10 + "";
        prompt[id10000]["inputs"]["take_start"] = i;

        //let id20001 = 20001 + (deleteCount + i) * 10 + "";
       // prompt[id20001]["inputs"]["take_start"] = i;
    }

    if(req.body.img_url != undefined  && req.body.img_url != null){
        var maskUrl = req.body.img_url;
        Tool.applyImage(prompt, "3", null, maskUrl);
    }
    else{
        var rawImg = req.files.img_data.data;
        prompt["3"]["inputs"]["image"] = Buffer.from(rawImg).toString('base64');
    }
    

    prompt["3"]["inputs"]["seed"] = Tool.randomInt();



    task.pipeline = "face_flex_save_image";
    sendRequest(prompt, queue, task);
}


function sendRequest(promptjson, queue, task) {

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": promptjson }));

    //send request
    const options = {
        hostname: Tool.RequestURL,
        path: '/run',
        method: 'POST',
        timeout: 0,
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
                console.log("onende_face_flex_saveimage: " + task.key + " , time: ");
                for (var i = 0; i < jsonobj.length; i++) {
                    var styleImageName = uuidv4() + "_face_flex_saveimage.png";
                    console.log("face_flex_saveimage:" + styleImageName);
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

function updatePromptByCount(prompt, count) {
    console.log("updatePromptByCount", count);
    if (count == 4) {
        return;
    }
    else {
        let deleteCount = 4 - count;
        for (let i = 0; i < deleteCount; i++) {
            let id10000 = 10000 + i * 10 + "";
            let id10001 = 10001 + i * 10 + "";
            let id10002 = 10002 + i * 10 + "";
            let id10003 = 10003 + i * 10 + "";
            let id10004 = 10004 + i * 10 + "";

          
            /*

            delete prompt[id10000];
            delete prompt[id10001];
            delete prompt[id10002];
            delete prompt[id10003];
            delete prompt[id10004];

            let id20001 = 20001 + i * 10 + "";
            let id20002 = 20002 + i * 10 + "";
            let id20003 = 20003 + i * 10 + "";
            let id20004 = 20004 + i * 10 + "";
            let id20005 = 20005 + i * 10 + "";
            delete prompt[id20001];
            delete prompt[id20002];
            delete prompt[id20003];
            delete prompt[id20004];
            delete prompt[id20005];
            */
        }

        let ids_10002 = 10002 + deleteCount * 10 + "";
        prompt[ids_10002]["inputs"]["image"] = ["3", 0];

        /*let ids_20005 = 20005 + deleteCount * 10 + "";
        prompt[ids_20005]["inputs"]["image_base"] = ["3", 0];
        */
    }

}

module.exports = FaceFlexPipeSaveImage;