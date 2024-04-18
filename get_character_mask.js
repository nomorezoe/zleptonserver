"strict mode"
const OUTPUT_FOLDER = "/imgs/";
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

function GetCharacterMask() {

}



GetCharacterMask.currentTask = null;
GetCharacterMask.tasks = [];

GetCharacterMask.RemoveKey = function(key){
    for(let i =0 ; i < GetCharacterMask.tasks.length; i++){
        let item = GetCharacterMask.tasks[i];
        if(item[2] == key){
            console.log("remove" + key);
            GetCharacterMask.tasks.splice(0,1);
            i--;
        }
    }
}

GetCharacterMask.checkURL = function (url, obj){
    if(url == undefined){
        return;
    }
    for(let i =0 ; i < GetCharacterMask.tasks.length; i++){
        let item = GetCharacterMask.tasks[i];
        if(item[0].body.img_url == url){
            item[1].json(obj);
            console.log("remove" + url);
            GetCharacterMask.tasks.splice(0,1);
            i--;
        }
    }
}

GetCharacterMask.queueProcess = function (req, res) {
    GetCharacterMask.tasks.push([req, res, req.body.session]);
    GetCharacterMask.getNextQueue();
}

GetCharacterMask.getNextQueue = function () {
    if (GetCharacterMask.currentTask == null) {
        if (GetCharacterMask.tasks.length > 0) {
            GetCharacterMask.currentTask = GetCharacterMask.tasks.splice(0, 1)[0];
            console.log(" GetCharacterMask.tasks" + GetCharacterMask.tasks.length);
            GetCharacterMask.process(GetCharacterMask.currentTask[0], GetCharacterMask.currentTask[1]);
        }
    }
}

GetCharacterMask.process = function (req, res) {
    var file = uuidv4();
    var exestring;
    let urlstring;
    console.log("GetCharacterMask.process");
    if (req.body.img_url == undefined) {
        var rawImg = req.files.imageByteArray.data;
        imgData = Buffer.from(rawImg).toString('base64');

        //capture
        try {
            fs.writeFileSync(__dirname + OUTPUT_FOLDER + file + ".png", imgData, {
                encoding: "base64",
            });
        } catch (err) {
            console.error(err);
        }

        exestring = "python3.10 ./pyscripts/run.py  --file " + file;
        console.log(exestring);

    }
    else {
        var url = req.body.img_url;
        console.log("url" + url);
        console.log("file" + __dirname);
        urlstring = url;

        exestring = "python3.10 ./pyscripts/run.py  --file " + file + " --url '" + url + "'";

    }

    var exec = require('child_process').exec;
    const childPython = exec(exestring);
    var result = '';
    var count = 0;
    childPython.stdout.on(`data`, (data) => {
        console.log("Data:" + data.toString());
        result += data.toString();

        if (data.toString().startsWith("counts:")) {
            console.log("counts");
            count = parseInt(data.toString().split(":")[1]);
            console.log("count" + count);
        }
    });

    childPython.on('error', function (err) {
        console.log("error" + err);

        GetCharacterMask.currentTask = null;
        GetCharacterMask.getNextQueue();
    });


    childPython.on('exit', (code) => {
        console.log("exit" + code + ":" + result);
        let resultObj = {};
        if (code == 0) {
            

            resultObj = {
                success: true,
                file: file,
                count: count
            };
            res.json(resultObj);
        }
        else{
            resultObj = {
                success: false
            }
            res.json(resultObj);
        }

        GetCharacterMask.currentTask = null;
        GetCharacterMask.checkURL(urlstring, resultObj);
        GetCharacterMask.getNextQueue();

    });


}

module.exports = GetCharacterMask;