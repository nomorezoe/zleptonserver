"strict mode"
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const OUTPUT_FOLDER = "/imgs/";

function CharacterTool() {

}

CharacterTool.lockChParams = {};

CharacterTool.AddAPerson = function (prompt, refer_ch_index, img_ch_index, refer_url, image_id, model_id, sampler_id) {
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

    prompt[sampler_id]["inputs"]["model"][0] = "100417"
}

module.exports = CharacterTool;
