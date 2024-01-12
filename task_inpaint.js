"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');

function TaskInPaint(task, req, queue) {
    console.log("==inpaint==");

    var rawImg = req.files.imageByteArray.data;
    var imageFileName = req.body.file;

    var inpaintFileName = imageFileName.split(".")[0] + "_inpaint.png";

    var buffer = Buffer.from(rawImg).toString('base64');
    var prompt = req.body.prompt;


    var imgData = fs.readFileSync(__dirname + OUTPUT_FOLDER + imageFileName, { encoding: 'base64' });

    //console.log("imgData" + imgData);
    //console.log(buffer);
    const data = JSON.stringify({
        width: 1536,
        height: 1536,
        guidance_scale: 5,
        high_noise_frac: 0.75,
        seed: Tool.randomInt(999999999),
        steps: 30,
        use_refiner: false,

        prompt: prompt,
        image: imgData,
        mask_image: buffer
    });

    const options = {
        hostname: 'sdxl.lepton.run',
        path: '/inpaint',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': "Bearer ozlh7xvpezbtwlr9tseg14imf4fhqo5v"
        }
    };

    const reqhttps = https.request(options, (reshttps) => {
        console.log('statusCode:', reshttps.statusCode);
        console.log('headers:', reshttps.headers);

        if(reshttps.statusCode == 200){
            const file = fs.createWriteStream(__dirname + OUTPUT_FOLDER + inpaintFileName);
            task.imageFileName = inpaintFileName;
    
            reshttps.pipe(file);
    
            file.on('finish', () => {
                console.log('Image saved to ' + inpaintFileName);
                queue.completeTask();
            });
        }
        else{
            queue.completeTask();
        }
        

       
    });
    reqhttps.on('error', (error) => {
        console.error(error);
    });
    reqhttps.write(data);
    reqhttps.end();
}


module.exports = TaskInPaint;

