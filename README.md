# Serverless Food Image Classification with AWS

This project implements a **cloud-based, serverless food image classification system** that predicts food categories from user-uploaded images using a trained deep learning model. It uses AWS services like Lambda, S3, API Gateway, DynamoDB, and ECR to create a fully automated and scalable architecture.

---

## 🚀 Project Overview

The system allows users to upload food images through a React + Next.js frontend. These images are sent to a backend pipeline that triggers inference using a trained ResNet model (exported to ONNX) inside a Dockerized Lambda function. Predictions are displayed to users along with nutritional data fetched from the USDA API.

---

## 🎯 Objectives

- **Image Classification with Deep Learning:** Use a retrained ResNet model to classify food images into 11 categories.
- **Serverless Architecture:** Use AWS Lambda, S3, API Gateway, and DynamoDB to process images without maintaining servers.
- **Asynchronous, Real-Time Inference:** Deliver predictions within seconds using a polling-based architecture.
- **Frontend Interface:** Create an intuitive React interface for image upload and result display.
- **Scalability & Modularity:** Ensure the system is scalable and each component is independently maintainable.

---

## 🛠️ Tech Stack

| Tool / Service       | Usage                                      |
|----------------------|---------------------------------------------|
| **AWS S3**           | Stores uploaded food images                 |
| **AWS Lambda**       | Executes upload handler and inference       |
| **Docker**           | Packages inference logic and dependencies   |
| **API Gateway**      | REST endpoints for upload and result fetch  |
| **DynamoDB**         | Tracks image status and stores predictions  |
| **Amazon ECR**       | Hosts Docker image for Lambda               |
| **PyTorch + ONNX**   | Model training and optimized deployment     |
| **Next.js + React**  | Frontend for uploading and displaying results |

---

## 🧠 Model Training

The ResNet101 model was retrained using the [Food11 dataset](https://www.kaggle.com/datasets/trolukovich/food11-image-dataset). Training was done in Google Colab, and the model was exported to ONNX format for lightweight inference.

Files:
- `model_training/train_resnet101.py`
- `model_training/requirements.txt`

---

## 🧩 Backend Architecture

The system uses an event-driven pipeline:

1. **Image Upload:** Frontend POSTs image to API Gateway → Lambda function → stores in S3
2. **Trigger Inference:** S3 upload event triggers Lambda 2
3. **Run Model Inference:** Inference Lambda loads ONNX model and predicts class
4. **Store Result:** Output is saved to DynamoDB
5. **Frontend Polling:** Frontend GETs status from API → displays result + nutrition info

---

## 🖼️ Frontend Setup

The frontend is built using React.js and Next.js. It allows users to upload an image, polls for results, and shows a styled result popup with the top predicted class and nutritional facts.

Path: `frontend/`

---

## 🏗️ Infrastructure Notes

See [`infrastructure/infra_notes.md`](infrastructure/infra_notes.md) for:

- S3 bucket config (including Lambda trigger)
- DynamoDB schema
- API Gateway config + CORS setup

---

## 🚀 How to Run This Project

This section explains how to train the model, deploy it on AWS, and run the complete application.

---

### 1. Model Training (Google Colab)

**Step 1.1: Download Dataset**
- Download the Food11 dataset from Kaggle:  
  https://www.kaggle.com/datasets/trolukovich/food11-image-dataset

**Step 1.2: Upload to Google Drive**
- Upload the following files to your Google Drive:
  - `training.zip`
  - `validation.zip`
  - `evaluation.zip`

**Step 1.3: Train the Model**
- Open the training notebook/script inside `model_training/train_resnet101.py`
- Mount Google Drive in Colab:
  ```python
  from google.colab import drive
  drive.mount('/content/drive')
  ```

- Update paths to point to your dataset in Drive

- Run the code to:

  - Train a ResNet101 model
  - Export to ONNX format as model.onnx
 
### 2. Dockerize & Deploy Inference Lambda

**Step 2.1: Build Docker Image**

```bash
docker build --platform linux/amd64 -t lambda_docker_image .
```

**Step 2.2: Push to Amazon ECR**

```bash
# Authenticate to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

# Tag & push
docker tag lambda_docker_image:latest <account-id>.dkr.ecr.<region>.amazonaws.com/<repo-name>:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/<repo-name>:latest
```

**Step 2.3: Create Lambda**
- Use the pushed Docker image to create a Lambda function

- Set the handler to: `lambda_function.lambda_handler`

- Assign permissions to access S3 and DynamoDB


### 3. AWS Services Setup
**Amazon S3**
- Bucket name: image-recog-user-uploads

- Enable event notification:
  - Event type: All object create events
  - Destination: inference-func-image-classification

**DynamoDB**
- Table name: UserImage
- Primary key: image_id (String)
- Attributes used: image_id, status, inference_result, timestamp,
processed_timestamp, error_message, s3_key

**API Gateway**
- Create a REST API with 2 endpoints:
    - `POST /image-upload` → triggers `generate_presigned_url` Lambda
    - `GET /status` → polls result from DynamoDB
- Enable CORS:
  - Go to Method → Actions → Enable CORS → Deploy API

### 4. Frontend (Next.js)
Run locally:

```bash
cd frontend
npm install
npm run dev
```

- Upload images
- Poll for inference results
