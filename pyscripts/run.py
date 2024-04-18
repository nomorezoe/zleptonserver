from ultralytics import YOLO
from ultralytics.utils.ops import scale_image
import cv2
import numpy as np
import argparse
import os
import urllib.request

def predict_on_image(model, img, conf):
    result = model(img, conf=conf)[0]
    # detection
    # result.boxes.xyxy   # box with xyxy format, (N, 4)
    cls = result.boxes.cls.cpu().numpy()    # cls, (N, 1)
    probs = result.boxes.conf.cpu().numpy()  # confidence score, (N, 1)
    boxes = result.boxes.xyxy.cpu().numpy()   # box with xyxy format, (N, 4)
    # segmentation
    masks = result.masks.data.cpu().numpy()     # masks, (N, H, W)
    masks = np.moveaxis(masks, 0, -1) # masks, (H, W, N)
    # rescale masks to original image
    masks = scale_image(masks, result.masks.orig_shape)
    masks = np.moveaxis(masks, -1, 0) # masks, (N, H, W)
    return boxes, masks, cls, probs


def overlay(image, mask, color, alpha, resize=None):
    """Combines image and its segmentation mask into a single image.
    https://www.kaggle.com/code/purplejester/showing-samples-with-segmentation-mask-overlay

    Params:
        image: Training image. np.ndarray,
        mask: Segmentation mask. np.ndarray,
        color: Color for segmentation mask rendering.  tuple[int, int, int] = (255, 0, 0)
        alpha: Segmentation mask's transparency. float = 0.5,
        resize: If provided, both image and its mask are resized before blending them together.
        tuple[int, int] = (1024, 1024))

    Returns:
        image_combined: The combined image. np.ndarray

    """
    color = color[::-1]
    colored_mask = np.expand_dims(mask, 0).repeat(3, axis=0)
    colored_mask = np.moveaxis(colored_mask, 0, -1)
    masked = np.ma.MaskedArray(image, mask=colored_mask, fill_value=color)
    image_overlay = masked.filled()

    if resize is not None:
        image = cv2.resize(image.transpose(1, 2, 0), resize)
        image_overlay = cv2.resize(image_overlay.transpose(1, 2, 0), resize)

    image_combined = cv2.addWeighted(image, 1 - alpha, image_overlay, alpha, 0)

    return image_combined


def run(url, filename):
    # Load a model

    if url:
        f = open(os.path.dirname(os.path.realpath(__file__)) + '/../imgs/'+filename +'.png','wb')
        f.write(urllib.request.urlopen(url).read())
        f.close()
    
    img  = cv2.imread(os.path.dirname(os.path.realpath(__file__)) + '/../imgs/'+filename +'.png')

    if url:
         img = cv2.resize(img,None,fx=0.33,fy=0.33)
    else:
         img = cv2.resize(img,None,fx=0.25,fy=0.25)
         
    h, w, c = img.shape
    model = YOLO(os.path.dirname(os.path.realpath(__file__)) + '/ultralytics/segm/person_yolov8m-seg.pt')

    # load image by OpenCV like numpy.array
    #img = cv2.imread('test_load.png')
    #print("2")
    # predict by YOLOv8
    boxes, masks, cls, probs = predict_on_image(model, img, conf=0.5)

    segs_with_order = []
    i = 0
    for box in boxes:
        x1 = box[0]
        segs_with_order.append((x1, i))
        i = i+1

        sorted_list = sorted(segs_with_order, key=lambda x: x[0], reverse=False)

    #print(sorted_list)
    print("counts:" + str(len(boxes)))
    i = 0
    for x1, index in sorted_list:
        mask_i = masks[index]
        image_with_masks = 0 * np.ones((h,w,3), np.uint8)
        image_with_masks = overlay(image_with_masks, mask_i, color=(255,255,255), alpha=1)
        # Saving the image
        cv2.imwrite(os.path.dirname(os.path.realpath(__file__)) + '/../imgs/'+ filename + str(i) + ".png", image_with_masks)
        i = i+1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', dest='url', type=str, help='Add url')
    parser.add_argument('--file', dest='file', type=str, help='Add file')
    args = parser.parse_args()

    run(args.url, args.file)