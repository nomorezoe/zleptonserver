const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

const cors = require('cors');
const bodyParser = require('body-parser');
//const { readFileSync } = require('fs');
//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
//const ExifReader = require('exifreader');

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



let queues = [];
let currentQueue = null;
let BATCH_COUNT = 4;

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
            handleLeaveFromQueue(key);

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

    let queue = new Queue(session, completeAQueue);
    //for (let i = 0; i < BATCH_COUNT; i++) {
    let task = new Task("render", req);
    queue.tasks.push(task);
    //}

    addToQueue(queue);

    res.json({
        success: true,
        queue_count: queues.length
    });

    getNextQueue();
})
//render - end


//upscale - start
app.use('/upscale', function (req, res, next) {
    //req.clearTimeout(); // clear request timeout
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/upscale', (req, res) => {

    var session = req.body.session;
    let queue = new Queue(session, completeAQueue);
    let task = new Task("upscale", req);
    queue.tasks.push(task);
    addToQueue(queue);

    res.json({
        success: true,
        queue_count: queues.length
    });

    getNextQueue();

})
//upscale - end


//inpaint - start
app.use('/inpaint', function (req, res, next) {
    //req.clearTimeout(); // clear request timeout
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).post('/inpaint', (req, res) => {

    var session = req.body.session;
    let queue = new Queue(session, completeAQueue);
    let task = new Task("inpaint", req);
    queue.tasks.push(task);

    addToQueue(queue);

    res.json({
        success: true,
        queue_count: queues.length
    });

    getNextQueue();

})
//inpaint -end

function addToQueue(queue) {
    queues.push(queue);
    console.log("add queue" + queues.length);
    sendQueueStatus();
}

function getNextQueue() {
    if (currentQueue != null) {
        return;
    }

    if (queues.length == 0) {
        console.log("0 queue")
        return;
    }

    currentQueue = queues.splice(0, 1)[0];

    console.log("new queue start" + queues.length);
    sendQueueStatus();

    currentQueue.excuteQueue();
}

function completeAQueue() {
    currentQueue = null;
    console.log("completeQueue");
    getNextQueue();
}

function handleLeaveFromQueue(key) {
    for (var i = 0; i < queues.length; i++) {
        if (queues[i].key == key) {
            queues.splice(i, 1);
            console.log("handleLeaveFromQueue" + key);
            i--;
        }
    }
}

function sendQueueStatus() {
    for (var i = 0; i < queues.length; i++) {
        let socket = SocketManager.getSocketByKey(queues[i].key);
        if (socket) {
            console.log('emit updateQueue' + socket.id);
            socket.emit("updateQueue", i + (currentQueue == null ? 0 : 1));
        }
    }
}

app.get('/styles', (req, res) => {
    let json = require('fs').readFileSync("./pipe/styles.json");
    json = JSON.parse(json);

    var obj = [];
    for(let i = 0; i < json.length; i++){
        obj.push({"name":json[i].name,"models":json[i].models});
    }

    let json2 = require('fs').readFileSync("./pipe/loras.json");
    json2 = JSON.parse(json2);

    res.json({
        success: true,
        data: obj,
        lora:json2
    })
});



app.use('/test', function (req, res, next) {
    //req.clearTimeout(); // clear request timeout
    req.setTimeout(300000); //set a 20s timeout for this request
    next();
}).get('/test', (req, res) => {
    req = {};
    req.files = {};
    req.files.imageByteArray = {};

    let imageData = require('fs').readFileSync("./images/test_input.png");
    req.files.imageByteArray.data = imageData;

    req.body = {};
    req.body.model = "dreamshaper";
    req.body.cfg = 7;
    req.body.prompt = "a lady in the forest"
    req.body.sampleSteps = 20;
    req.body.depthStrength = 0.53;
    req.body.poseStrength = 1.0;
    req.body.negtext = "";

    var session = "test";
    let queue = new Queue(session, completeAQueue);
    let task = new Task("render", req);
    queue.tasks.push(task);

    addToQueue(queue);

    res.json({
        success: true,
        queue_count: queues.length
    });

    getNextQueue();
})