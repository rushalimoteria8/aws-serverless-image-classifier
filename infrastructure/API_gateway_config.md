**API Name**: `image-upload-api`

**Resource Path**: `/image-upload`

**HTTP Method**: `POST`

**Integration Type**: Lambda Proxy Integration  
→ Invokes `generate_presigned_url` Lambda function for uploading and initializing image entries.

---

### ✅ CORS Configuration (Cross-Origin Resource Sharing)

CORS must be enabled for your frontend (on a different origin) to interact with the API Gateway.

#### **Steps to Enable CORS:**

1. **Go to API Gateway** → Choose your API → `Resources`.
2. Select the `/image-upload` endpoint.
3. Click on the `POST` method.
4. Under **Integration Response**, add the following header mapping:
`method.response.header.Access-Control-Allow-Origin → '*'`

5. Scroll to **Method Response**, and:
- Add a 200 response.
- Under `Response Headers`, add:
  - `Access-Control-Allow-Origin`

6. (Optional but recommended) Create an `OPTIONS` method for preflight requests:
- Add `Access-Control-Allow-Methods: POST, OPTIONS`
- Add `Access-Control-Allow-Headers: Content-Type`
- Add `Access-Control-Allow-Origin: *`

7. **Deploy the API** again after changes.

---

