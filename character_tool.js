"strict mode"
const fs = require('fs');
const Tool = require('./tool');
const OUTPUT_FOLDER = "/imgs/";

function CharacterTool() {

}

const BATCH = 4;
CharacterTool.lockChParams = {};

CharacterTool.AddAPerson = function (prompt, index_pairs, refer_url, image_id, model_final_id, sampler_id, vae_id, neg_id, vae_decode_id, save_image_id, model_vae_id) {
    console.log("CharacterTool.AddAPerson");
    let pair = index_pairs.length;
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
                model_final_id,
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

    for (let i = 0; i < pair; i++) {

        //100398
        let ImpactSEGSOrderedFilter_referImage_Id = (100398 + i * 1000).toString();
        let ImpactSEGSOrderedFilter_referImage = {
            "inputs": {
                "target": "x1",
                "order": false,
                "take_start": index_pairs[i][1],
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
        console.log('ImpactSEGSOrderedFilter_referImage'  + i + ":"+ index_pairs[i][1]);
        prompt[ImpactSEGSOrderedFilter_referImage_Id] = ImpactSEGSOrderedFilter_referImage;

        //100399
        let SEGSToImageList_Id = (100399 + i * 1000).toString();
        let SEGSToImageList = {
            "inputs": {
                "segs": [
                    ImpactSEGSOrderedFilter_referImage_Id,
                    0
                ]
            },
            "class_type": "SEGSToImageList",
            "_meta": {
                "title": "SEGSToImageList"
            }
        }
        prompt[SEGSToImageList_Id] = SEGSToImageList;

        //"100409": 
        let SegsToCombinedMask_Id = (100409 + i * 1000).toString();
        let SegsToCombinedMask = {
            "inputs": {
                "segs": [
                    ImpactSEGSOrderedFilter_referImage_Id,
                    0
                ]
            },
            "class_type": "SegsToCombinedMask",
            "_meta": {
                "title": "SEGS to MASK (combined)"
            }
        }
        prompt[SegsToCombinedMask_Id] = SegsToCombinedMask;

        //"100412": 
        let MaskToImage_Id = (100412 + i * 1000).toString();
        let MaskToImage = {
            "inputs": {
                "mask": [
                    SegsToCombinedMask_Id,
                    0
                ]
            },
            "class_type": "MaskToImage",
            "_meta": {
                "title": "Convert Mask to Image"
            }
        }
        prompt[MaskToImage_Id] = MaskToImage;

        //100411
        let cutByMask_Id = (100411 + i * 1000).toString();
        let cutByMask = {
            "inputs": {
                "force_resize_width": 0,
                "force_resize_height": 0,
                "image": [
                    SEGSToImageList_Id,
                    0
                ],
                "mask": [
                    MaskToImage_Id,
                    0
                ]
            },
            "class_type": "Cut By Mask",
            "_meta": {
                "title": "Cut By Mask"
            }
        }
        prompt[cutByMask_Id] = cutByMask;

        //100419
        let AlphaChanelRemove_Id = (100419 + i * 1000).toString();
        let AlphaChanelRemove = {
            "inputs": {
                "images": [
                    cutByMask_Id,
                    0
                ]
            },
            "class_type": "AlphaChanelRemove",
            "_meta": {
                "title": "AlphaChanelRemove"
            }
        }
        prompt[AlphaChanelRemove_Id] = AlphaChanelRemove;

        //100447
        let BRIA_Id = (100447 + i * 1000).toString();
        let BRIA = {
            "inputs": {
                "rmbgmodel": [
                    "100444",
                    0
                ],
                "image": [
                    AlphaChanelRemove_Id,
                    0
                ]
            },
            "class_type": "BRIA_RMBG_Zho",
            "_meta": {
                "title": "🧹BRIA RMBG"
            }
        }
        prompt[BRIA_Id] = BRIA;

        //"100448"
        let AlphaChanelRemove_2_Id = (100448 + i * 1000).toString();
        let AlphaChanelRemove_2 = {
            "inputs": {
                "images": [
                    BRIA_Id,
                    0
                ]
            },
            "class_type": "AlphaChanelRemove",
            "_meta": {
                "title": "AlphaChanelRemove"
            }
        }
        prompt[AlphaChanelRemove_2_Id] = AlphaChanelRemove_2;

        //"100417"
        let IPAdapterTiled_Id = (100417 + i * 1000).toString();
        let input_model_Id = (i == 0) ? ("100421") : (parseInt(IPAdapterTiled_Id) - 1000).toString();
        console.log("input_model_Id:" + input_model_Id);
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
                    input_model_Id,
                    0
                ],
                "ipadapter": [
                    "100421",
                    1
                ],
                "image": [
                    AlphaChanelRemove_2_Id,
                    0
                ],
                "attn_mask": [
                    (100431 + i * 1000).toString(),//////
                    0
                ]
            },
            "class_type": "IPAdapterTiled",
            "_meta": {
                "title": "IPAdapter Tiled"
            }
        }
        prompt[IPAdapterTiled_Id] = IPAdapterTiled;

    }
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

    for (let i = 0; i < pair; i++) {
        // "100429"
        let ImpactSEGSOrderedFilter_RenderImage_Id = (100429 + i * 1000).toString();
        let ImpactSEGSOrderedFilter_RenderImage = {
            "inputs": {
                "target": "x1",
                "order": false,
                "take_start": index_pairs[i][1],
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
        console.log('ImpactSEGSOrderedFilter_RenderImage'  + i + ":"+ index_pairs[i][1]);
        prompt[ImpactSEGSOrderedFilter_RenderImage_Id] = ImpactSEGSOrderedFilter_RenderImage;

        //100431
        let SegsToCombinedMask_render_Id = (100431 + i * 1000).toString();
        let SegsToCombinedMask_render = {
            "inputs": {
                "segs": [
                    ImpactSEGSOrderedFilter_RenderImage_Id,
                    0
                ]
            },
            "class_type": "SegsToCombinedMask",
            "_meta": {
                "title": "SEGS to MASK (combined)"
            }
        }
        prompt[SegsToCombinedMask_render_Id] = SegsToCombinedMask_render;
    }

    prompt[sampler_id]["inputs"]["model"][0] = (100417 + (pair - 1) * 1000).toString();


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
    for (let b = 0; b < BATCH; b++) {

        let ImpactSimpleDetectorSEGS_render_Id = (100476 + b * 10000).toString();
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
                    (parseInt(vae_decode_id) + b * 10000).toString(),
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
        prompt[ImpactSimpleDetectorSEGS_render_Id] = ImpactSimpleDetectorSEGS_render;

        for (let i = 0; i < pair; i++) {
            ///"100484": 
            let ImpactSEGSOrderedFilter_render_Id = (100484 + b * 10000 + i * 1000).toString();
            let ImpactSEGSOrderedFilter_render = {
                "inputs": {
                    "target": "x1",
                    "order": false,
                    "take_start": index_pairs[i][0],
                    "take_count": 1,
                    "segs": [
                        ImpactSimpleDetectorSEGS_render_Id,
                        0
                    ]
                },
                "class_type": "ImpactSEGSOrderedFilter",
                "_meta": {
                    "title": "SEGS Filter (ordered)"
                }
            }

            console.log('ImpactSEGSOrderedFilter_render'  + i + ":"+ index_pairs[i][0]);
            prompt[ImpactSEGSOrderedFilter_render_Id] = ImpactSEGSOrderedFilter_render;
        }
    }

    //"100531": 
    let IPAdapterUnifiedLoader_face = {
        "inputs": {
            "preset": "PLUS FACE (portraits)",
            "model": [
                model_final_id,
                0
            ]
        },
        "class_type": "IPAdapterUnifiedLoader",
        "_meta": {
            "title": "IPAdapter Unified Loader"
        }
    }
    prompt["100531"] = IPAdapterUnifiedLoader_face;

    for (let i = 0; i < pair; i++) {
        //"100503": 
        let ImpactSimpleDetectorSEGS_face_ref_Id = (100503 + i * 1000).toString();
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
                    (100448 + i * 1000).toString(),
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
        prompt[ImpactSimpleDetectorSEGS_face_ref_Id] = ImpactSimpleDetectorSEGS_face_ref;

        ///"600484": 
        let ImpactSEGSOrderedFilter_render_Id = (600484 + i * 1000).toString();
        let ImpactSEGSOrderedFilter_render = {
            "inputs": {
                "target": "x1",
                "order": false,
                "take_start": 0,
                "take_count": 1,
                "segs": [
                    (100503 + i * 1000).toString(),
                    0
                ]
            },
            "class_type": "ImpactSEGSOrderedFilter",
            "_meta": {
                "title": "SEGS Filter (ordered)"
            }
        }
        prompt[ImpactSEGSOrderedFilter_render_Id] = ImpactSEGSOrderedFilter_render;


        //"100513": 
        let SEGSToImageList_face_ref_Id = (100513 + i * 1000).toString();
        let SEGSToImageList_face_ref = {
            "inputs": {
                "segs": [
                    ImpactSEGSOrderedFilter_render_Id,
                    0
                ]
            },
            "class_type": "SEGSToImageList",
            "_meta": {
                "title": "SEGSToImageList"
            }
        }
        prompt[SEGSToImageList_face_ref_Id] = SEGSToImageList_face_ref;

        //"100514": 
        let SegsToCombinedMask_face_ref_Id = (100514 + i * 1000).toString();
        let SegsToCombinedMask_face_ref = {
            "inputs": {
                "segs": [
                    ImpactSEGSOrderedFilter_render_Id,
                    0
                ]
            },
            "class_type": "SegsToCombinedMask",
            "_meta": {
                "title": "SEGS to MASK (combined)"
            }
        }
        prompt[SegsToCombinedMask_face_ref_Id] = SegsToCombinedMask_face_ref;

        //"100515": 
        let MaskToImage_face_ref_Id = (100515 + i * 1000).toString();
        let MaskToImage_face_ref = {
            "inputs": {
                "mask": [
                    SegsToCombinedMask_face_ref_Id,
                    0
                ]
            },
            "class_type": "MaskToImage",
            "_meta": {
                "title": "Convert Mask to Image"
            }
        }
        prompt[MaskToImage_face_ref_Id] = MaskToImage_face_ref;

        //"100509"
        let CutByMask_face_ref_Id = (100509 + i * 1000).toString();
        let CutByMask_face_ref = {
            "inputs": {
                "force_resize_width": 0,
                "force_resize_height": 0,
                "image": [
                    SEGSToImageList_face_ref_Id,
                    0
                ],
                "mask": [
                    MaskToImage_face_ref_Id,
                    0
                ]
            },
            "class_type": "Cut By Mask",
            "_meta": {
                "title": "Cut By Mask"
            }
        }
        prompt[CutByMask_face_ref_Id] = CutByMask_face_ref;

        //"100516": 
        let AlphaChanelRemove_face_ref_Id = (100516 + i * 1000).toString();
        let AlphaChanelRemove_face_ref = {
            "inputs": {
                "images": [
                    CutByMask_face_ref_Id,
                    0
                ]
            },
            "class_type": "AlphaChanelRemove",
            "_meta": {
                "title": "AlphaChanelRemove"
            }
        }
        prompt[AlphaChanelRemove_face_ref_Id] = AlphaChanelRemove_face_ref;

        //"100528": 
        let IPAdapter_face_Id = (100528 + i * 1000).toString();
        let IPAdapter_face = {
            "inputs": {
                "weight": 1,
                "start_at": 0,
                "end_at": 1,
                "model": [
                    model_vae_id,
                    0
                ],
                "ipadapter": [
                    "100531",
                    1
                ],
                "image": [
                    AlphaChanelRemove_face_ref_Id,
                    0
                ]
            },
            "class_type": "IPAdapter",
            "_meta": {
                "title": "IPAdapter"
            }
        }
        prompt[IPAdapter_face_Id] = IPAdapter_face;


        //"100525": 
        let CLIPTextEncode_face_Id = (100525 + i * 1000).toString();
        let CLIPTextEncode_face = {
            "inputs": {
                "text": "detailed face",
                "clip": [
                    model_final_id,
                    1
                ]
            },
            "class_type": "CLIPTextEncode",
            "_meta": {
                "title": "CLIP Text Encode (Prompt)"
            }
        }
        prompt[CLIPTextEncode_face_Id] = CLIPTextEncode_face;
    }


    //insert latent for batch
    let latentinputs = prompt[vae_decode_id]["inputs"]["samples"][0];
    delete prompt[save_image_id];
    delete prompt[vae_decode_id];
    for (let b = 0; b < BATCH; b++) {


        let LatentFromBatch_id = (200224 + b * 10000).toString();
        //"200224"
        let LatentFromBatch = {
            "inputs": {
                "batch_index": b,
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
        prompt[LatentFromBatch_id] = LatentFromBatch;


        let vaeDecodeID = (parseInt(vae_decode_id) + b * 10000).toString();
        console.log("vaeDecodeID: " + vaeDecodeID);
        let VAEDecode = {
            "inputs": {
                "samples": [
                    LatentFromBatch_id,
                    0
                ],
                "vae": [
                    model_vae_id,
                    2
                ]
            },
            "class_type": "VAEDecode",
            "_meta": {
                "title": "VAE Decode"
            }
        };
        prompt[vaeDecodeID] = VAEDecode;

        let DetailerForEach_Face_Id
        for (let i = 0; i < pair; i++) {

            //"100524": 
            DetailerForEach_Face_Id = (100524 + b * 10000 + i * 1000).toString();
            let image_input = (i == 0) ? vaeDecodeID : (parseInt(DetailerForEach_Face_Id) - 1000).toString();
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
                        image_input,
                        0
                    ],
                    "segs": [
                        (100484 + 10000 * b + i * 1000).toString(),
                        0
                    ],
                    "model": [
                        (100528 + i * 1000).toString(),
                        0
                    ],
                    "clip": [
                        model_final_id,
                        1
                    ],
                    "vae": [
                        vae_id,
                        0
                    ],
                    "positive": [
                        (100525 + i * 1000).toString(),
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



        //redirect image

        
        //"200224"
        let saveImageID = (parseInt(save_image_id) + b * 10000).toString();
        console.log("saveImageID:" + saveImageID);
        let SaveImage = {
            "inputs": {
                "filename_prefix": "ComfyUI",
                "images": [
                    DetailerForEach_Face_Id,
                    0
                ]
            },
            "class_type": "SaveImage",
            "_meta": {
                "title": "Save Image"
            }
        }
        prompt[saveImageID] = SaveImage;

    }


}

module.exports = CharacterTool;
