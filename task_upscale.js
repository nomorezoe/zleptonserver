"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";

function TaskUpscale(task, req, queue) {
  console.log("==upscale==");
  var imageFileName = req.body.file;
  var session = req.body.session;
  var denoiseValue = req.body.denoisevalue;
  console.log("denoiseValue:" + denoiseValue);
  console.log("imageFileName" + imageFileName);

  var filePath = __dirname + OUTPUT_FOLDER + imageFileName;

  var upscaleImageName = imageFileName.split(".")[0] + "_upscale.png";

  var contents = fs.readFileSync(filePath, { encoding: 'base64' });

  //console.log(contents);

  const data = JSON.stringify({
    image: contents,
    model: "realesr_general_x4v3",
    denoise_strength: denoiseValue,
    outscale: 2,
    tile: 0,
    tile_pad: 10,
    pre_pad: 0,
    face_enhance: true,
    fp32: false
  });


  const options = {
    hostname: 'sr.lepton.run',
    path: '/run',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': "Bearer ozlh7xvpezbtwlr9tseg14imf4fhqo5v",
      'accept': 'image/png',
      'Content-Length': data.length
    }
  };

  const reqhttps = https.request(options, (reshttps) => {
    console.log('statusCode:', reshttps.statusCode);
    console.log('headers:', reshttps.headers);
    if (reshttps.statusCode == 200) {
      const fileStream = fs.createWriteStream(__dirname + OUTPUT_FOLDER + upscaleImageName);

      task.imageFileNames.push(upscaleImageName);
      reshttps.pipe(fileStream);

      fileStream.on('finish', () => {
        console.log('Image saved to ' + upscaleImageName);
        queue.completeTask();
      });
    }
    else {
      queue.completeTask();
    }




  });
  reqhttps.on('error', (error) => {
    console.error(error);
    queue.completeTask();
  });
  reqhttps.write(data);
  reqhttps.end();
}

module.exports = TaskUpscale;