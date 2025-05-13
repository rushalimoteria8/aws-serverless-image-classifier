**Bucket Name**: `image-recog-user-uploads`

**Purpose**:
- Temporarily stores food images uploaded by users.
- Automatically triggers the inference Lambda function when a new image is added.

**Event Notification Setup**:
- **Event Types**: All object create events (i.e., when a new file is uploaded)
- **Destination Type**: Upload Lambda function
- **Filter**: None (runs for every new file)

**Permissions**:
- The **Lambda function (inference-func-image-classification)** must be granted permission to:
  - Read image objects from this S3 bucket (`s3:GetObject`)
  - Optionally write logs if needed (`s3:PutObject`, if writing any outputs)
- This permission is configured via the **Lambda execution IAM role**, by attaching the following policy:
```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::image-recog-user-uploads/*"
}
