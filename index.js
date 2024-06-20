const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
//const { readFileSync } = require('fs');
//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
//const ExifReader = require('exifreader');
const OUTPUT_FOLDER = "/imgs/";
//const http = require('http');
const fs = require('fs');
const https = require('https');
const server = https.createServer({
    key: fs.readFileSync("./certs/server.key", 'utf-8'),
    cert: fs.readFileSync("./certs/server.cert", 'utf-8'),
    ca: fs.readFileSync("./certs/ca.cert", 'utf-8')
}, app);
const { Server } = require("socket.io");
const io = new Server(server);

const Task = require('./task');
const Queue = require('./queue');
const SocketManager = require('./socket_manager');
const QueueManager = require('./queue_manager');
const GetCharacterMask = require("./get_character_mask")
const Tool = require('./tool');
server.setTimeout(600000);


app.use(cors({
    origin: '*'
}));

app.use(
    fileUpload({
        limits: {
            fileSize: 10000000,
        },
        abortOnLimit: true,
    })
);

app.use(bodyParser.urlencoded({
    extended: true
}));



app.get('/', (req, res) => {
    res.send('Hello World !');



});

app.use('/imgs', express.static('imgs'));
app.use('/save', express.static('save'));


app.get('/capturefiles_2', (req, res) => {
    const fs = require('fs'); 
  
    // Function to get current filenames 
    // in directory 
    let filenames = fs.readdirSync("imgs");
    let capturenames = [];

   
    
    console.log("\nCurrent directory filenames:"); 
    filenames.forEach(file => { 
        if(file.indexOf("capture") != -1){
            capturenames.push(file);
        }
    }); 

    console.log(capturenames.length);

    capturenames.sort(function(a, b) {
        return fs.statSync("./imgs/" + b).mtime.getTime()-
               fs.statSync("./imgs/" + a).mtime.getTime();
    });

    res.writeHead(200, {"Content-Type": "text/html"});  
    for (i in capturenames){
        
        res.write( "https://api.rendermind.ai:3000/imgs/" + capturenames[i] + "</br>");  
     
    }
    res.end();  
    
});

app.get('/capturefiles', (req, res) => {
    const fs = require('fs'); 
  
    // Function to get current filenames 
    // in directory 
    let filenames = fs.readdirSync("imgs");
    let capturenames = [];

   
    
    console.log("\nCurrent directory filenames:"); 
    filenames.forEach(file => { 
        if(file.indexOf("upscale") != -1){
            capturenames.push(file);
        }
    }); 

    console.log(capturenames.length);

    capturenames.sort(function(a, b) {
        return fs.statSync("./imgs/" + b).mtime.getTime()-
               fs.statSync("./imgs/" + a).mtime.getTime();
    });

    res.writeHead(200, {"Content-Type": "text/html"});  
    for (i in capturenames){
        
        res.write( "https://api.rendermind.ai:3000/imgs/" + capturenames[i] + "</br>");  
     
    }
    res.end();  
    
});
server.listen(3000, () => {
    console.log('listening on *:3000');
});

SocketManager.initialize(io);
io.on('connection', (socket) => {

    console.log('a user connected' + socket.handshake.query.key);

    if (socket.handshake.query.key != null) {
        let key = socket.handshake.query.key;
        SocketManager.addSocket(key, socket.id);
    }

    //socket.emit("test","here is a message");

    socket.on("disconnect", (reason) => {
        console.log("a user left");

        let key = SocketManager.getKeyBySocketId(socket.id);

        if (key != null) {
            QueueManager.instance.handleLeaveFromQueue(key);

            SocketManager.removeSocket(socket.id);
        }


    })
})

//render - start
app.use('/render', function (req, res, next) {
    //req.clearTimeout(); // clear request timeout
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/render', (req, res) => {

    var session = req.body.session;

    let queue = new Queue(session);
    //for (let i = 0; i < BATCH_COUNT; i++) {
    let task = new Task("render", 0, req);
    queue.tasks.push(task);
    //}

    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();
})
//render - end

//styletransferrender - start
app.use('/styletransferrender', function (req, res, next) {
    //req.clearTimeout(); // clear request timeout
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/styletransferrender', (req, res) => {
    console.log("styletransferrender");
    var session = req.body.session;

    let queue = new Queue(session);
    //for (let i = 0; i < BATCH_COUNT; i++) {
    let task = new Task("styletransferrender", 0, req);
    queue.tasks.push(task);
    //}

    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();
})
//styletransferrender - end


//upscale - start
app.use('/upscale', function (req, res, next) {
    //req.clearTimeout(); // clear request timeout
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/upscale', (req, res) => {

    var session = req.body.session;
    let queue = new Queue(session);
    let task = new Task("upscale", 0, req);
    queue.tasks.push(task);
    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();

})
//upscale - end

//superUpscale - start
app.use('/superUpscale', function (req, res, next) {
    //req.clearTimeout(); // clear request timeout
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/superUpscale', (req, res) => {

    var session = req.body.session;
    let queue = new Queue(session);
    let task = new Task("superUpscale", 0, req);
    queue.tasks.push(task);
    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();

})
//superUpscale - end

//tweak - start
app.post('/tweak', (req, res) => {

    var session = req.body.session;
    let queue = new Queue(session);
    let task = new Task("tweak", 0, req);
    queue.tasks.push(task);
    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount(),
        id: queue.id
    });

    QueueManager.instance.getNextQueue();

})
//tweak - end


//inpaint - start
app.use('/inpaint', function (req, res, next) {
    //req.clearTimeout(); // clear request timeout
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/inpaint', (req, res) => {

    var session = req.body.session;
    let queue = new Queue(session);
    let task = new Task("inpaint", 0, req);
    queue.tasks.push(task);

    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();

})
//inpaint -end


//get mask start
app.use('/getmask', function (req, res, next) {
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/getmask', (req, res) => {
    console.log("getmask");
    //GetCharacterMask.queueProcess(req, res);

    var session = req.body.session;
    let queue = new Queue(session);
    let task = new Task("mask", 0, req);
    queue.tasks.push(task);

    QueueManager.instance.addMaskToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();
})
//get mask end

//ch creator start
app.use('/chcreator', function (req, res, next) {
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/chcreator', (req, res) => {
    console.log("chcreator");

    var session = req.body.session;
    let queue = new Queue(session);
    let task = new Task("chcreator", 0, req);
    queue.tasks.push(task);

    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();
})
//ch creator end

//style transfer start
app.use('/styletransfer', function (req, res, next) {
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/styletransfer', (req, res) => {
    console.log("styletransfer");

    var session = req.body.session;
    let queue = new Queue(session);
    let task = new Task("styletransfer", 0, req);
    queue.tasks.push(task);

    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();
})
//ch creator end


app.get('/styles', (req, res) => {
    let json = require('fs').readFileSync("./settings/styles.json");
    json = JSON.parse(json);

    var obj = [];
    for (let i = 0; i < json.length; i++) {
        obj.push({ "name": json[i].name, "models": json[i].models });
    }

    let json2 = require('fs').readFileSync("./settings/loras.json");
    json2 = JSON.parse(json2);

    let json3 = require('fs').readFileSync("./settings/models.json");
    json3 = JSON.parse(json3);

    let json4 = require('fs').readFileSync("./settings/settings.json");
    json4 = JSON.parse(json4);

    let json5 = require('fs').readFileSync("./settings/rendermind_styles.json");
    json5 = JSON.parse(json5);

    res.json({
        success: true,
        data: obj,
        lora: json2,
        model: json3,
        settings: json4,
        rd_styles: json5
    })
});

app.use('/scribble', function (req, res, next) {
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/scribble', (req, res) => {
    
    console.log("scribble");

    var session = req.body.session;
    let queue = new Queue(session);
    let task = new Task("scribble", 0, req);
    queue.tasks.push(task);

    QueueManager.instance.addScribbleToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();
});

app.use('/test', function (req, res, next) {
    //req.clearTimeout(); // clear request timeout
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).get('/test', (req, res) => {
   // let filename = "./pipe/test_2person.json"
   let filename = "./pipe/workflow_api_adv_epic_real_animal.json";

    const promptFile = fs.readFileSync(filename);//');
    let prompt = JSON.parse(promptFile);

    prompt["55"]["inputs"]["text_positive"] = "A man is walking with a cat.";
    Tool.applyImage (prompt, "1", "man_capture.png", null);
    Tool.applyImage (prompt, "248", "cat_capture.png", null);

    var data = new TextEncoder("utf-8").encode(JSON.stringify({ "prompt": prompt }));
    const options = {
        hostname: require('./tool').RequestURL,
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

            reshttps.on('data', (d) => {
                datastring += d;
                // console.log("ondata");
            });

            reshttps.on('end', (d) => {
                console.error("end");
                const jsonobj = JSON.parse(datastring);
                for (var i = 0; i < jsonobj.length; i++) {
                    var imgname = uuidv4() + ".png";
                   // task.imageFileNames.push(imgname);
                    fs.writeFileSync(__dirname + OUTPUT_FOLDER + imgname, jsonobj[i], {
                        encoding: "base64",
                    });
                }

            });

            reshttps.on("error", function (error) {
                //callback(error);
                console.error(error);
            });
        }
    });

    reqhttps.write(data);
    reqhttps.end();
})

startAutoRemoveFileProcess();

function startAutoRemoveFileProcess() {
    removeFile();
    setInterval(() => {
        removeFile();
    }, 86400000);
}

function removeFile() {
    console.log("removeFile");
    let d = Date.now() - 24 * 60 * 60 * 1000;
    let time = new Date(d);
    let dateString = time.getFullYear() + "-" + (time.getMonth() + 1) + "-" + time.getDate();

    let cmd = "find ./imgs/ -type f ! -newermt '" + dateString + "' -exec rm -f {} \\;";
    var exec = require('child_process').exec;

    exec(cmd, function (error, stdout, stderr) {
        // command output is in stdout
    });
}
