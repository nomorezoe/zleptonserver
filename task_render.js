"strict mode"
const https = require('https');
const fs = require('fs');
var OUTPUT_FOLDER = "/imgs/";
const Tool = require('./tool');
const { v4: uuidv4 } = require('uuid');

function depth_controlnet_15(bytes, strength) {
    var json = {
        "module": "depth",
        "model": "control_depth-fp16",
        "control_mode": 0,
        "resize_mode": 1,
        "weight": strength,
        "processor_res": 512,
        "input_image": bytes,
    }
    return json;
}

function depth_controlnet(bytes, strength) {
    var json = {
        "model": "control-lora-depth-rank256",
        "control_mode": 0,
        "resize_mode": 0,
        "weight": strength,
        "processor_res": 512,
        "input_image": bytes,
    }
    return json;
}


function openpose_controlnet_15(bytes, strength) {
    var json = {
        "module": "openpose",
        "model": "control_openpose-fp16",
        "control_mode": 0,  // 0: Balanced 1: My prompt is more important 2: ControlNet is more important
        "resize_mode": 0,  //0: Just Resize 1: Scale to Fit (Inner Fit) 2: Envelope (Outer Fit)
        "guidance_start": 0.0,
        "guidance_end": 1.0,
        "processor_res": 512,
        "weight": strength,
        //"pixel_perfect": true,
        "input_image": bytes
    }
    return json;
}

function openpose_controlnet(bytes, strength) {
    // see
    // https://github.com/Mikubill/sd-webui-controlnet/wiki/API#controlnetunitrequest-json-object
    // for detailed explanation of accepted parameters
    var json = {
        "module": "dw_openpose_full",
        "model": "thibaud_xl_openpose_256lora",
        "control_mode": 0,  // 0: Balanced 1: My prompt is more important 2: ControlNet is more important
        "resize_mode": 0,  // 0: Just Resize 1: Scale to Fit (Inner Fit) 2: Envelope (Outer Fit)
        "guidance_start": 0.0,
        "guidance_end": 1.0,
        "weight": strength,
        "pixel_perfect": true,
        "input_image": bytes,
    }
    return json;
}

function use_lora(model, weight){
    return "<lora:{"+model+"}:{"+weight +"}>";
}

function TaskRender(task, req, queue) {
    console.log('TaskRender')
    var rawImg = req.files.imageByteArray.data;
    var utf8encoded = Buffer.from(rawImg).toString('base64');


    var model = "dynavisionXL";
    if (req.body.model != undefined) {
        model = req.body.model
    }

    console.log("model:" + model);

    var cfg = parseInt(req.body.cfg);
    var prompt = req.body.prompt;
    var sampleSteps =  parseInt(req.body.sampleSteps);
    var sampler = req.body.sampler;
    var negtext = req.body.negtext;


    console.log("cfg:" + cfg);
    console.log("prompt:" + prompt);
    console.log("sampleSteps:" + sampleSteps);
    console.log("sampler:" + sampler);
    console.log("negtext:" + negtext);
    

    var depthStrength =  parseFloat(req.body.depthStrength);
    var poseStrength = parseFloat(req.body.poseStrength);

    console.log("depthStrength:" + depthStrength);
    console.log("poseStrength:" + poseStrength);


    model = Tool.getModelMap(model);
    var isxl = Tool.isXLModel(model);

    console.log("isxl:" + isxl);

    var json = {
        "model": model,  // can be any of the models in ["realismEngineSDXL_v20VAE", "realisticVisionV60B1_v60B1VAE", "Deliberate_v5", "dreamshaper_8", "dynavisionXLAllInOneStylized_release0557Bakedvae"]
        "clip_skip": 1,
        "prompt": prompt +  ", " + use_lora("SDXL1.0_Essenz-series-by-AI_Characters_Style_BetterPhotography-v1.2-Skynet", 1.5) + ", " + use_lora("Cinematic_Hollywood_Film_sdxl", 1.0),
        "negative_prompt": negtext,//"(worst quality, low quality, normal quality, lowres, low details, oversaturated, undersaturated, overexposed, underexposed, grayscale, bw, bad photo, bad photography, bad art:1.4), (watermark, signature, text font, username, error, logo, words, letters, digits, autograph, trademark, name:1.2), (blur, blurry, grainy), morbid, ugly, asymmetrical, mutated malformed, mutilated, poorly lit, bad shadow, draft, cropped, out of frame, cut off, censored, jpeg artifacts, out of focus, glitch, duplicate, (airbrushed, cartoon, anime, semi-realistic, cgi, render, blender, digital art, manga, amateur:1.3), (3D ,3D Game, 3D Game Scene, 3D Character:1.1), (bad hands, bad anatomy, bad body, bad face, bad teeth, bad arms, bad legs, deformities:1.3) horror",
        "seed": Tool.randomInt(999999999),
        "width": 768,
        "height": 768,
        "sampler_name": "DPM++ 2M SDE Karras",
        "cfg_scale": cfg,
        "steps": sampleSteps,
        //"batch_size":4,
        //"restore_faces": True,
        "alwayson_scripts": {
            "controlnet": {
                "args": [
                    isxl ? depth_controlnet(utf8encoded, depthStrength) : depth_controlnet_15(utf8encoded, depthStrength),
                    isxl ? openpose_controlnet(utf8encoded, poseStrength) : openpose_controlnet_15(utf8encoded, poseStrength),
                    //# uncomment this to use ip_adapter controlnet
                    //ip_adapter_controlnet(),
                ]
            }
        },
    }
    var data = JSON.stringify(json);

    const options = {
        hostname: 'j9e5gs4n-sdfarm.bjz.edr.lepton.ai',
        path: '/txt2img',
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
            var imgname = uuidv4() + ".png";
            task.imageFileNames.push(imgname);
    
            const file = fs.createWriteStream(__dirname + OUTPUT_FOLDER + imgname);
            reshttps.pipe(file);
    
            file.on('finish', () => {
                console.log('Image saved to ' + imgname);
                queue.completeTask();
            })
           
        }
        else{
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


module.exports = TaskRender;

