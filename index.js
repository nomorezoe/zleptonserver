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
const QueueManager = require('./queue_manager');


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
    let task = new Task("inpaint",  0,req);
    queue.tasks.push(task);

    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();

})
//inpaint -end


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
    let queue = new Queue(session);
    let task = new Task("render", 0, req);
    queue.tasks.push(task);

    QueueManager.instance.addToQueue(queue);

    res.json({
        success: true,
        queue_count: QueueManager.instance.remainQueueCount()
    });

    QueueManager.instance.getNextQueue();
})