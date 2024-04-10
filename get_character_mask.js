"strict mode"
const OUTPUT_FOLDER = "/imgs/";
const { v4: uuidv4 } = require('uuid');

function GetCharacterMask() {

}

GetCharacterMask.currentTask = null;
GetCharacterMask.tasks = [];

GetCharacterMask.queueProcess = function (req, res) {
    GetCharacterMask.tasks.push([req, res]);
    GetCharacterMask.getNextQueue();
}

GetCharacterMask.getNextQueue = function () {
    if (GetCharacterMask.currentTask == null) {
        if (GetCharacterMask.tasks.length > 0) {
            GetCharacterMask.currentTask = GetCharacterMask.tasks.splice(0, 1)[0];
            console.log(" GetCharacterMask.tasks" + GetCharacterMask.tasks.length);
            GetCharacterMask.process(GetCharacterMask.currentTask[0], GetCharacterMask.currentTask [1]);
        }
    }
}

GetCharacterMask.process = function (req, res) {
    var url = req.body.img_url;
    console.log("url" + url);
    var file = uuidv4();
    console.log("file" + __dirname);
    var exec = require('child_process').exec;
    exestring = "python3.10 ./pyscripts/run.py  --file " + file + " --url '" + url + "'";
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
        if (code == 0) {
            res.json({
                success: true,
                file: file,
                count: count
            });
        }

        GetCharacterMask.currentTask = null;
        GetCharacterMask.getNextQueue();

    });


}

module.exports = GetCharacterMask;