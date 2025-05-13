**Table Name**: `UserImage`

| Field Name           | Type    | Description                                  |
|----------------------|---------|----------------------------------------------|
| image_id             | String  | Partition key (unique per image)             |
| status               | String  | One of: 'pending', 'in_progress', 'success', 'failure' |
| s3_key               | String  | S3 object key of uploaded image              |
| inference_result     | String  | Predicted class (stored as stringified JSON) |
| error_message        | String  | Error description (if any)                   |
| timestamp            | Number  | Upload time (Unix timestamp)                 |
| processed_timestamp  | Number  | Time of inference completion                 |

**Provisioning**: On-demand (pay-per-request)

**Notes**:
- Created via AWS Console.
- Make sure `image_id` is the partition key (no sort key used).
