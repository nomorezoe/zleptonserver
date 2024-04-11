"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function CharacterTool() {

}

CharacterTool.lockChParams = {};

CharacterTool.AddAPerson = function (prompt, refer_ch_index, img_ch_index, refer_url, image_id, model_id, sampler_id, vae_id, neg_id, vae_decode_id, save_image_id) {
    //"100001"
    let loadImageFromUrl = {
        "inputs": {
            "url": refer_url,
            "keep_alpha_channel": false,
            "output_mode": false
        },
        "class_type": "LoadImageFromUrl"
    }
    prompt["100001"] = loadImageFromUrl;

    //"100444"
    let BRIA_Loader = {
        "inputs": {},
        "class_type": "BRIA_RMBG_ModelLoader_Zho",
        "_meta": {
            "title": "🧹BRIA_RMBG Model Loader"
        }
    }
    prompt["100444"] = BRIA_Loader;

    //"100421": 
    let IPAdapterUnifiedLoader = {
        "inputs": {
            "preset": "PLUS (high strength)",
            "model": [
                model_id,
                0
            ]
        },
        "class_type": "IPAdapterUnifiedLoader",
        "_meta": {
            "title": "IPAdapter Unified Loader"
        }
    }
    prompt["100421"] = IPAdapterUnifiedLoader;

    //"100395":
    let ultralyticsDetectorProvider = {
        "inputs": {
            "model_name": "segm/person_yolov8m-seg.pt"
        },
        "class_type": "UltralyticsDetectorProvider",
        "_meta": {
            "title": "UltralyticsDetectorProvider"
        }
    }
    prompt["100395"] = ultralyticsDetectorProvider;

    //100397
    let SAMLoader = {
        "inputs": {
            "model_name": "sam_vit_b_01ec64.pth",
            "device_mode": "AUTO"
        },
        "class_type": "SAMLoader",
        "_meta": {
            "title": "SAMLoader (Impact)"
        }
    }
    prompt["100397"] = SAMLoader;

    //100396
    let impactSimpleDetectorSEGS_referImage = {
        "inputs": {
            "bbox_threshold": 0.5,
            "bbox_dilation": 0,
            "crop_factor": 3,
            "drop_size": 50,
            "sub_threshold": 0.5,
            "sub_dilation": 0,
            "sub_bbox_expansion": 0,
            "sam_mask_hint_threshold": 0.7,
            "post_dilation": 0,
            "bbox_detector": [
                "100395",
                0
            ],
            "image": [
                "100001",
                0
            ],
            "sam_model_opt": [
                "100397",
                0
            ]
        },
        "class_type": "ImpactSimpleDetectorSEGS",
        "_meta": {
            "title": "Simple Detector (SEGS)"
        }
    };
    prompt["100396"] = impactSimpleDetectorSEGS_referImage;

    //100398
    let ImpactSEGSOrderedFilter_referImage = {
        "inputs": {
            "target": "x1",
            "order": false,
            "take_start": refer_ch_index,
            "take_count": 1,
            "segs": [
                "100396",
                0
            ]
        },
        "class_type": "ImpactSEGSOrderedFilter",
        "_meta": {
            "title": "SEGS Filter (ordered)"
        }
    }
    prompt["100398"] = ImpactSEGSOrderedFilter_referImage;

    //100399
    let SEGSToImageList = {
        "inputs": {
            "segs": [
                "100398",
                0
            ]
        },
        "class_type": "SEGSToImageList",
        "_meta": {
            "title": "SEGSToImageList"
        }
    }
    prompt["100399"] = SEGSToImageList;

    //"100409": 
    let SegsToCombinedMask = {
        "inputs": {
            "segs": [
                "100398",
                0
            ]
        },
        "class_type": "SegsToCombinedMask",
        "_meta": {
            "title": "SEGS to MASK (combined)"
        }
    }
    prompt["100409"] = SegsToCombinedMask;

    //"100412": 
    let MaskToImage = {
        "inputs": {
            "mask": [
                "100409",
                0
            ]
        },
        "class_type": "MaskToImage",
        "_meta": {
            "title": "Convert Mask to Image"
        }
    }
    prompt["100412"] = MaskToImage;

    //100411
    let cutByMask = {
        "inputs": {
            "force_resize_width": 0,
            "force_resize_height": 0,
            "image": [
                "100399",
                0
            ],
            "mask": [
                "100412",
                0
            ]
        },
        "class_type": "Cut By Mask",
        "_meta": {
            "title": "Cut By Mask"
        }
    }
    prompt["100411"] = cutByMask;

    //100419
    let AlphaChanelRemove = {
        "inputs": {
            "images": [
                "100411",
                0
            ]
        },
        "class_type": "AlphaChanelRemove",
        "_meta": {
            "title": "AlphaChanelRemove"
        }
    }
    prompt["100419"] = AlphaChanelRemove;

    //100447
    let BRIA = {
        "inputs": {
            "rmbgmodel": [
                "100444",
                0
            ],
            "image": [
                "100419",
                0
            ]
        },
        "class_type": "BRIA_RMBG_Zho",
        "_meta": {
            "title": "🧹BRIA RMBG"
        }
    }
    prompt["100447"] = BRIA;

    //"100448"
    let AlphaChanelRemove_2 = {
        "inputs": {
            "images": [
                "100447",
                0
            ]
        },
        "class_type": "AlphaChanelRemove",
        "_meta": {
            "title": "AlphaChanelRemove"
        }
    }
    prompt["100448"] = AlphaChanelRemove_2;

    //"100417"
    let IPAdapterTiled = {
        "inputs": {
            "weight": 0.85,
            "weight_type": "linear",
            "combine_embeds": "average",
            "start_at": 0,
            "end_at": 0.85,
            "sharpening": 0,
            "embeds_scaling": "V only",
            "model": [
                "100421",
                0
            ],
            "ipadapter": [
                "100421",
                1
            ],
            "image": [
                "100448",
                0
            ],
            "attn_mask": [
                "100431",
                0
            ]
        },
        "class_type": "IPAdapterTiled",
        "_meta": {
            "title": "IPAdapter Tiled"
        }
    }
    prompt["100417"] = IPAdapterTiled;

    //render image
    //"100428"
    let ImpactSimpleDetectorSEGS_RenderImage = {
        "inputs": {
            "bbox_threshold": 0.5,
            "bbox_dilation": 0,
            "crop_factor": 3,
            "drop_size": 50,
            "sub_threshold": 0.5,
            "sub_dilation": 0,
            "sub_bbox_expansion": 0,
            "sam_mask_hint_threshold": 0.7,
            "post_dilation": 0,
            "bbox_detector": [
                "100395",
                0
            ],
            "image": [
                image_id,
                0
            ],
            "sam_model_opt": [
                "100397",
                0
            ]
        },
        "class_type": "ImpactSimpleDetectorSEGS",
        "_meta": {
            "title": "Simple Detector (SEGS)"
        }
    }
    prompt["100428"] = ImpactSimpleDetectorSEGS_RenderImage;

    // "100429"
    let ImpactSEGSOrderedFilter_RenderImage = {
        "inputs": {
            "target": "x1",
            "order": false,
            "take_start": img_ch_index,
            "take_count": 1,
            "segs": [
                "100428",
                0
            ]
        },
        "class_type": "ImpactSEGSOrderedFilter",
        "_meta": {
            "title": "SEGS Filter (ordered)"
        }
    }
    prompt["100429"] = ImpactSEGSOrderedFilter_RenderImage;

    //100431
    let SegsToCombinedMask_render = {
        "inputs": {
            "segs": [
                "100429",
                0
            ]
        },
        "class_type": "SegsToCombinedMask",
        "_meta": {
            "title": "SEGS to MASK (combined)"
        }
    }
    prompt["100431"] = SegsToCombinedMask_render;

    prompt[sampler_id]["inputs"]["model"][0] = "100417";


    //step 2
    //"100477"
    let UltralyticsDetectorProvider_face = {
        "inputs": {
            "model_name": "bbox/face_yolov8s.pt"
        },
        "class_type": "UltralyticsDetectorProvider",
        "_meta": {
            "title": "UltralyticsDetectorProvider"
        }
    }

    prompt["100477"] = UltralyticsDetectorProvider_face;

    //"100476"
    let ImpactSimpleDetectorSEGS_render = {
        "inputs": {
            "bbox_threshold": 0.5,
            "bbox_dilation": 0,
            "crop_factor": 3,
            "drop_size": 50,
            "sub_threshold": 0.5,
            "sub_dilation": 0,
            "sub_bbox_expansion": 0,
            "sam_mask_hint_threshold": 0.7,
            "post_dilation": 0,
            "bbox_detector": [
                "100477",
                0
            ],
            "image": [
                vae_decode_id,
                0
            ],
            "sam_model_opt": [
                "100397",
                0
            ]
        },
        "class_type": "ImpactSimpleDetectorSEGS",
        "_meta": {
            "title": "Simple Detector (SEGS)"
        }
    }
    prompt["100476"] = ImpactSimpleDetectorSEGS_render;

    ///"100484": 
    let ImpactSEGSOrderedFilter_render = {
        "inputs": {
            "target": "x1",
            "order": false,
            "take_start": img_ch_index,
            "take_count": 1,
            "segs": [
                "100476",
                0
            ]
        },
        "class_type": "ImpactSEGSOrderedFilter",
        "_meta": {
            "title": "SEGS Filter (ordered)"
        }
    }
    prompt["100484"] = ImpactSEGSOrderedFilter_render;

    //"100503": 
    let ImpactSimpleDetectorSEGS_face_ref = {
        "inputs": {
            "bbox_threshold": 0.47000000000000003,
            "bbox_dilation": 0,
            "crop_factor": 3,
            "drop_size": 50,
            "sub_threshold": 0.5,
            "sub_dilation": 0,
            "sub_bbox_expansion": 0,
            "sam_mask_hint_threshold": 0.7,
            "post_dilation": 0,
            "bbox_detector": [
                "100477",
                0
            ],
            "image": [
                "100448",
                0
            ],
            "sam_model_opt": [
                "100397",
                0
            ]
        },
        "class_type": "ImpactSimpleDetectorSEGS",
        "_meta": {
            "title": "Simple Detector (SEGS)"
        }
    }
    prompt["100503"] = ImpactSimpleDetectorSEGS_face_ref;

    //"100513": 
    let SEGSToImageList_face_ref = {
        "inputs": {
            "segs": [
                "100503",
                0
            ]
        },
        "class_type": "SEGSToImageList",
        "_meta": {
            "title": "SEGSToImageList"
        }
    }
    prompt["100513"] = SEGSToImageList_face_ref;

    //"100514": 
    let SegsToCombinedMask_face_ref = {
        "inputs": {
            "segs": [
                "100503",
                0
            ]
        },
        "class_type": "SegsToCombinedMask",
        "_meta": {
            "title": "SEGS to MASK (combined)"
        }
    }
    prompt["100514"] = SegsToCombinedMask_face_ref;

    //"100515": 
    let MaskToImage_face_ref = {
        "inputs": {
            "mask": [
                "100514",
                0
            ]
        },
        "class_type": "MaskToImage",
        "_meta": {
            "title": "Convert Mask to Image"
        }
    }
    prompt["100515"] = MaskToImage_face_ref;

    //"100509"
    let CutByMask_face_ref = {
        "inputs": {
            "force_resize_width": 0,
            "force_resize_height": 0,
            "image": [
                "100513",
                0
            ],
            "mask": [
                "100515",
                0
            ]
        },
        "class_type": "Cut By Mask",
        "_meta": {
            "title": "Cut By Mask"
        }
    }
    prompt["100509"] = CutByMask_face_ref;

    //"100516": 
    let AlphaChanelRemove_face_ref = {
        "inputs": {
            "images": [
                "100509",
                0
            ]
        },
        "class_type": "AlphaChanelRemove",
        "_meta": {
            "title": "AlphaChanelRemove"
        }
    }
    prompt["100516"] = AlphaChanelRemove_face_ref;

    //"100531": 
    let IPAdapterUnifiedLoader_face = {
        "inputs": {
            "preset": "PLUS FACE (portraits)",
            "model": [
                model_id,
                0
            ]
        },
        "class_type": "IPAdapterUnifiedLoader",
        "_meta": {
            "title": "IPAdapter Unified Loader"
        }
    }
    prompt["100531"] = IPAdapterUnifiedLoader_face;

    //"100528": 
    let IPAdapter_face = {
        "inputs": {
            "weight": 1,
            "start_at": 0,
            "end_at": 1,
            "model": [
                "4",
                0
            ],
            "ipadapter": [
                "100531",
                1
            ],
            "image": [
                "100516",
                0
            ]
        },
        "class_type": "IPAdapter",
        "_meta": {
            "title": "IPAdapter"
        }
    }
    prompt["100528"] = IPAdapter_face;


    //"100525": 
    let CLIPTextEncode_face = {
        "inputs": {
            "text": "detailed face",
            "clip": [
                model_id,
                1
            ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
            "title": "CLIP Text Encode (Prompt)"
        }
    }
    prompt["100525"] = CLIPTextEncode_face;


    for (let b = 0; b < 1; b++) {
        //"100524": 
        let DetailerForEach_Face_Id = (100524 + b * 10000).toString();
        let DetailerForEach_Face = {
            "inputs": {
                "guide_size": 384,
                "guide_size_for": true,
                "max_size": 1024,
                "seed": Tool.randomInt(),
                "steps": 20,
                "cfg": 8,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 0.36,
                "feather": 5,
                "noise_mask": true,
                "force_inpaint": true,
                "wildcard": "",
                "cycle": 1,
                "inpaint_model": false,
                "noise_mask_feather": 20,
                "image": [
                    vae_decode_id,
                    0
                ],
                "segs": [
                    "100484100484",
                    0
                ],
                "model": [
                    "100528",
                    0
                ],
                "clip": [
                    model_id,
                    1
                ],
                "vae": [
                    vae_id,
                    0
                ],
                "positive": [
                    "100525",
                    0
                ],
                "negative": [
                    neg_id,
                    0
                ]
            },
            "class_type": "DetailerForEach",
            "_meta": {
                "title": "Detailer (SEGS)"
            }
        }
        prompt[DetailerForEach_Face_Id] = DetailerForEach_Face;
    }


    //insert latent for batch
    let latentinputs = prompt[vae_decode_id]["inputs"]["samples"][0];
    //"200224"
    let LatentFromBatch_0 = {
        "inputs": {
            "batch_index": 0,
            "length": 1,
            "samples": [
                latentinputs,
                0
            ]
        },
        "class_type": "LatentFromBatch",
        "_meta": {
            "title": "Latent From Batch"
        }
    }

    prompt[vae_decode_id]["inputs"]["samples"][0] = "200224";
    prompt["200224"] = LatentFromBatch_0;

    //redirect image
    prompt[save_image_id]["inputs"]["images"][0] = "100524";
}

module.exports = CharacterTool;
