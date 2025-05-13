"""
Lambda Function: Upload Handler

This function receives a base64-encoded image from the frontend via API Gateway,
uploads it to an S3 bucket with a consistent file name, and creates an initial entry
in DynamoDB with status "pending". It acts as the entry point for the image
classification pipeline.
"""

import boto3
import os
import json
import base64
import time

# Initialize AWS clients for S3 and DynamoDB
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

# Set environment variables for bucket and table names
BUCKET_NAME = "image-recog-user-uploads"
DYNAMODB_TABLE = "UserImage" 

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # -----------------------------
        # Step 1: Parse request body
        # -----------------------------
        print("Parsing the body of the request.")
        image_id = event.get("image_id")
        image_data_base64 = event.get("image_data")  # base64-encoded string

        # Validate input fields
        if not image_id or not image_data_base64:
            print("Missing image_id or image_data.")
            raise ValueError("Missing image_id or image_data.")

        # -----------------------------
        # Step 2: Decode base64 image
        # -----------------------------
        print(f"Decoding base64 image for image_id: {image_id}.")
        image_bytes = base64.b64decode(image_data_base64)

        # Validate decoded content
        if not image_bytes:
            print("Failed to decode base64 image.")
            raise ValueError("Failed to decode base64 image.")

        # -----------------------------
        # Step 3: Upload image to S3
        # -----------------------------
        s3_key = f"upload_{image_id}.jpg"  # Generate unique filename using image_id
        print(f"Generated S3 key: {s3_key}.")

        print(f"Uploading image to S3 with key: {s3_key}.")
        response = s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=image_bytes,
            Metadata={"image-id": image_id}  # Optional metadata
        )

        # Check if the upload was successful
        print(f"S3 response: {response}.")
        if response.get('ResponseMetadata', {}).get('HTTPStatusCode') != 200:
            print(f"Failed to upload image to S3. HTTPStatusCode: {response['ResponseMetadata']['HTTPStatusCode']}.")
            raise Exception("Failed to upload image to S3.")

        # -----------------------------
        # Step 4: Create DynamoDB entry
        # -----------------------------
        table = dynamodb.Table(DYNAMODB_TABLE)
        table.put_item(
            Item={
                "image_id": image_id,             # Unique key
                "status": "pending",              # Initial status
                "s3_key": s3_key,                 # Where the image is stored
                "timestamp": int(time.time()),    # Upload timestamp
                "processed_timestamp": None,      # Will be filled after inference
                "error_message": None             # Will be used if processing fails
            }
        )
        
        # -----------------------------
        # Step 5: Return success response
        # -----------------------------
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Upload successful and entry created.",
                "image_id": image_id,
                "s3_key": s3_key
            }),
            "headers": {"Content-Type": "application/json"}
        }

    # -----------------------------
    # Error handling
    # -----------------------------
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
            "headers": {"Content-Type": "application/json"}
        }
