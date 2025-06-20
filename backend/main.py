import os
import base64
import uuid
import traceback
import httpx
import boto3
import google.generativeai as genai

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from db import SessionLocal, engine, get_db
from models.base import Base

from crud import get_images_by_user
from schemas import ImageRecordOut

import models, schemas, crud

# .env読み込み
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

# 各種キー設定
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# S3クライアント
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# DB初期化
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# S3アップロード共通関数
def upload_to_s3(file_data: bytes, filename: str) -> str:
    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=filename,
        Body=file_data,
        ContentType='image/png',
        ACL='public-read'
    )
    return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"

# FastAPIアプリケーション
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STABLE_DIFFUSION_API = "http://127.0.0.1:7860"
ANYTHING_MODEL_NAME = "AnythingXL_xl.safetensors"

@app.post("/api/full_generate", response_model=schemas.GenerateImageResponse)
async def full_generate(req: schemas.GenerateImageRequest, db: Session = Depends(get_db)):
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        You are an expert in generating prompts for Stable Diffusion XL.
        Convert the following Japanese description into a prompt: {req.prompt}
        Style: {req.style}
        """
        gemini_response = model.generate_content(prompt)
        adjusted_prompt = gemini_response.text.strip()

        await httpx.AsyncClient().post(f"{STABLE_DIFFUSION_API}/sdapi/v1/options", json={
            "sd_model_checkpoint": ANYTHING_MODEL_NAME
        })

        payload = {
            "prompt": adjusted_prompt,
            "steps": req.steps,
            "width": req.width,
            "height": req.height,
            "sampler_name": "DPM++ 2M Karras"
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/txt2img", json=payload)
            result = response.json()

        if "images" not in result:
            return JSONResponse(status_code=500, content={"error": "Invalid response", "raw_response": result})

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        image_url = upload_to_s3(image_data, filename)

        record = schemas.ImageRecordCreate(image_url=image_url, prompt=req.prompt)
        crud.create_image_record(db, record)

        return schemas.GenerateImageResponse(image_url=image_url, adjusted_prompt=adjusted_prompt)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})

@app.post("/api/masked_full_generate", response_model=schemas.GenerateImageResponse)
async def masked_full_generate(req: schemas.MaskedGenerateRequest, db: Session = Depends(get_db)):
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        Convert the following Japanese image description into a short, high-quality English prompt for img2img generation.
        Style: {req.style}
        """
        gemini_response = model.generate_content(prompt)
        adjusted_prompt = gemini_response.text.strip()

        payload = {
            "prompt": adjusted_prompt,
            "init_images": [req.original_base64],
            "mask": req.mask_base64,
            "inpainting_fill": 1,
            "steps": req.steps,
            "width": req.width,
            "height": req.height,
            "sampler_name": "DPM++ 2M Karras",
            "denoising_strength": 0.35,
            "inpaint_full_res": True,
            "inpaint_full_res_padding": 32
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/img2img", json=payload)
            result = response.json()

        if "images" not in result:
            return JSONResponse(status_code=500, content={"error": "Invalid response", "raw_response": result})

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        image_url = upload_to_s3(image_data, filename)

        record = schemas.ImageRecordCreate(image_url=image_url, prompt=req.prompt)
        crud.create_image_record(db, record)

        return schemas.GenerateImageResponse(image_url=image_url, adjusted_prompt=adjusted_prompt)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})

@app.post("/api/img2img_full_generate", response_model=schemas.GenerateImageResponse)
async def img2img_full_generate(req: schemas.Image2ImageGenerateRequest, db: Session = Depends(get_db)):
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        Convert the following Japanese image description into a comma-separated high-quality English prompt.
        Style: {req.style}
        """
        gemini_response = model.generate_content(prompt)
        adjusted_prompt = gemini_response.text.strip()

        payload = {
            "prompt": adjusted_prompt,
            "init_images": [req.original_base64],
            "steps": req.steps,
            "width": req.width,
            "height": req.height,
            "sampler_name": "DPM++ 2M Karras",
            "denoising_strength": 0.6,
            "inpainting_fill": 1
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/img2img", json=payload)
            result = response.json()

        if "images" not in result:
            return JSONResponse(status_code=500, content={"error": "Invalid response", "raw_response": result})

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        image_url = upload_to_s3(image_data, filename)

        record = schemas.ImageRecordCreate(image_url=image_url, prompt=req.prompt)
        crud.create_image_record(db, record)

        return schemas.GenerateImageResponse(image_url=image_url, adjusted_prompt=adjusted_prompt)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})

@app.get("/api/history", response_model=list[schemas.ImageRecordOut])
def get_history(db: Session = Depends(get_db)):
    return crud.get_all_records(db)

@app.get("/")
def root():
    return {"message": "Backend is running."}

@app.get("/api/users/{user_id}/images", response_model=list[ImageRecordOut])
def read_user_images(user_id: int, db: Session = Depends(get_db)):
    return get_images_by_user(db, user_id)
