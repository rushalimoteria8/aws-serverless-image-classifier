"""
Lambda Function: inference-func-image-classification

Triggered when a new image is uploaded to S3. It:
1. Downloads the image.
2. Preprocesses it for inference.
3. Loads an ONNX model (once).
4. Runs the model to predict class.
5. Updates DynamoDB with status and result.
"""

import boto3
import onnxruntime as ort
import numpy as np
from PIL import Image
import io
import json
import os
import logging
from datetime import datetime
import time

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Define paths and AWS resources
ONNX_MODEL_PATH = "/tmp/model.onnx"
S3_CLIENT = boto3.client("s3")
MODEL_BUCKET = "image-recog-model"
MODEL_KEY = "model.onnx"
TABLE_NAME = "UserImage"

# Initialize DynamoDB resource
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

# --- Load ONNX model if not already loaded ---
try:
    if not os.path.exists(ONNX_MODEL_PATH):
        # Download the model from S3 to /tmp
        S3_CLIENT.download_file(MODEL_BUCKET, MODEL_KEY, ONNX_MODEL_PATH)

    # Initialize ONNX Runtime inference session
    ORT_SESSION = ort.InferenceSession(ONNX_MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")
    raise e  # Stop function if model loading fails

# --- Image preprocessing: resizing, normalizing, formatting ---
def preprocess_image(image_bytes, image_size=224, mean=(0.554, 0.450, 0.343), std=(0.231, 0.241, 0.241)):
    img = Image.open(io.BytesIO(image_bytes)).resize((image_size, image_size)).convert("RGB")
    img = np.array(img).astype(np.float32) / 255.0
    img = (img - np.array(mean, dtype=np.float32)) / np.array(std, dtype=np.float32)
    img = np.transpose(img, (2, 0, 1)).astype(np.float32)
    img = np.expand_dims(img, axis=0)
    return img

# --- Function to update DynamoDB with status/result/error ---
def update_dynamodb(image_id, status, result=None, error=None):
    update_expression = "SET #s = :s, #ts = :ts"
    expression_values = {
        ":s": status,
        ":ts": int(time.time())
    }
    attr_names = {"#s": "status", "#ts": "processed_timestamp"}

    if result is not None:
        update_expression += ", inference_result = :r"
        expression_values[":r"] = json.dumps(result)

    if error:
        update_expression += ", error_message = :e"
        expression_values[":e"] = error

    # Perform the update in DynamoDB
    try:
        table.update_item(
            Key={"image_id": image_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=attr_names,
            ExpressionAttributeValues=expression_values
        )
        logger.info(f"DynamoDB updated: image_id={image_id}, status={status}")
    except Exception as e:
        logger.error(f"Failed to update DynamoDB: {e}")
        raise e

# --- Lambda entrypoint function ---
def lambda_handler(event, context):
    image_id = None
    file_name = None
    error_message = None

    try:
        # Log the received event for debugging
        logger.info(f"Received event: {json.dumps(event, indent=2)}")

        # --- Extract S3 info from event ---
        try:
            record = event["Records"][0]
            bucket_name = record["s3"]["bucket"]["name"]
            image_key = record["s3"]["object"]["key"]
            file_name = image_key

            # Extract image ID from filename
            image_id = os.path.splitext(file_name.replace("upload_", ""))[0]
        except Exception:
            raise ValueError("Invalid or missing S3 event structure.")

        # --- Update status to 'in_progress' ---
        update_dynamodb(image_id, "in_progress")

        # --- Download image from S3 ---
        try:
            image_obj = S3_CLIENT.get_object(Bucket=bucket_name, Key=image_key)
            image_bytes = image_obj["Body"].read()
        except Exception as e:
            raise RuntimeError(f"Error downloading image: {e}")

        # --- Preprocess the image ---
        try:
            img = preprocess_image(image_bytes)
        except Exception as e:
            raise RuntimeError(f"Image preprocessing failed: {e}")

        # --- Perform model inference ---
        try:
            inputs = {ORT_SESSION.get_inputs()[0].name: img}
            outputs = ORT_SESSION.run(None, inputs)
            predicted_class = int(np.argmax(outputs[0], axis=1)[0])
            result = predicted_class

            # Save prediction result to DynamoDB
            update_dynamodb(image_id, "success", result=result)

            # Return success response
            return {
                "statusCode": 200,
                "body": json.dumps(result)
            }
        except Exception as e:
            raise RuntimeError(f"Inference error: {e}")

    # --- Catch and log any unexpected errors ---
    except Exception as e:
        error_message = str(e)
        logger.error(f"Exception occurred: {error_message}")

        if image_id:
            update_dynamodb(image_id, "failure", error=error_message)

        return {
            "statusCode": 500,
            "body": json.dumps({"error": error_message})
        }
