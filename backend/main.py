import os
import base64
import uuid
import traceback
import httpx
import google.generativeai as genai
import boto3
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

# ============================
# 環境変数読み込み
# ============================
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

# GeminiAPI設定
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# AWS S3設定
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# MySQL設定
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = os.getenv("MYSQL_PORT")
MYSQL_DB = os.getenv("MYSQL_DB")

# ============================
# S3クライアント作成
# ============================
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def upload_to_s3(file_data: bytes, filename: str) -> str:
    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=filename,
        Body=file_data,
        ContentType='image/png',
        ACL='public-read'
    )
    url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"
    return url

# ============================
# MySQLクライアント作成
# ============================
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
engine = create_engine(DATABASE_URL, echo=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class GeneratedImage(Base):
    __tablename__ = "generated_images"
    id = Column(Integer, primary_key=True, index=True)
    s3_url = Column(Text, nullable=False)
    input_prompt = Column(Text)
    adjusted_prompt = Column(Text)
    steps = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    style = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

# 初回テーブル作成
Base.metadata.create_all(bind=engine)

# ============================
# FastAPI本体設定
# ============================
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# Pydanticモデル定義
# ============================
class GenerateImageRequest(BaseModel):
    prompt: str
    steps: int
    width: int
    height: int
    style: str

class GenerateImageResponse(BaseModel):
    image_url: str
    adjusted_prompt: str

class MaskedGenerateRequest(BaseModel):
    original_base64: str
    mask_base64: str
    prompt: str
    steps: int
    width: int
    height: int
    style: str

class Image2ImageGenerateRequest(BaseModel):
    original_base64: str
    prompt: str
    steps: int
    width: int
    height: int
    style: str

# ============================
# 定数
# ============================
STABLE_DIFFUSION_API = "http://127.0.0.1:7860"
ANYTHING_MODEL_NAME = "AnythingXL_xl.safetensors"

# ============================
# 通常画像生成API（Gemini補正 + S3 + MySQL保存）
# ============================
@app.post("/api/full_generate", response_model=GenerateImageResponse)
async def full_generate(req: GenerateImageRequest):
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        You are an expert in generating prompts for Stable Diffusion XL, using the AnythingXL model.
        Convert the following Japanese image description into a high-quality English prompt for the img2img task.
        Make the output a comma-separated list of visual tags and keywords (no full sentences).
        Use the AnythingXL tag style.
        Reflect the following style: {req.style}.
        Input: {req.prompt}
        """
        gemini_response = model.generate_content(prompt)
        adjusted_prompt = gemini_response.text.strip()

        await httpx.AsyncClient().post(f"{STABLE_DIFFUSION_API}/sdapi/v1/options", json={"sd_model_checkpoint": ANYTHING_MODEL_NAME})

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
            return JSONResponse(status_code=500, content={ "error": "WebUI returned invalid response", "raw_response": result })

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        image_url = upload_to_s3(image_data, filename)

        db = SessionLocal()
        record = GeneratedImage(
            s3_url=image_url,
            input_prompt=req.prompt,
            adjusted_prompt=adjusted_prompt,
            steps=req.steps,
            width=req.width,
            height=req.height,
            style=req.style
        )
        db.add(record)
        db.commit()
        db.close()

        return GenerateImageResponse(image_url=image_url, adjusted_prompt=adjusted_prompt)

    except Exception as e:
        return JSONResponse(status_code=500, content={ "error": str(e), "trace": traceback.format_exc() })

# ============================
# img2img API
# ============================
@app.post("/api/img2img_full_generate", response_model=GenerateImageResponse)
async def img2img_full_generate(req: Image2ImageGenerateRequest):
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        You are an expert in generating prompts for Stable Diffusion XL, using the AnythingXL model.
        Convert the following Japanese image description into a high-quality English prompt for the img2img task.
        Make the output a comma-separated list of visual tags and keywords (no full sentences).
        Use the AnythingXL tag style.
        Reflect the following style: {req.style}.
        Input: {req.prompt}
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
            "denoising_strength": 0.6
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/img2img", json=payload)
            result = response.json()

        if "images" not in result:
            return JSONResponse(status_code=500, content={"error": "WebUI returned invalid response", "raw_response": result})

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        image_url = upload_to_s3(image_data, filename)

        db = SessionLocal()
        record = GeneratedImage(
            s3_url=image_url,
            input_prompt=req.prompt,
            adjusted_prompt=adjusted_prompt,
            steps=req.steps,
            width=req.width,
            height=req.height,
            style=req.style
        )
        db.add(record)
        db.commit()
        db.close()

        return GenerateImageResponse(image_url=image_url, adjusted_prompt=adjusted_prompt)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})

# ============================
# masked_full_generate API
# ============================
@app.post("/api/masked_full_generate", response_model=GenerateImageResponse)
async def masked_full_generate(req: MaskedGenerateRequest):
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        Convert the following Japanese image description into a short, high-quality English prompt for img2img generation using the AnythingXL model in Stable Diffusion XL.
        The output prompt should reflect the following artistic style: {req.style}.
        Input: {req.prompt}
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
            return JSONResponse(status_code=500, content={"error": "WebUI returned invalid response", "raw_response": result})

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        image_url = upload_to_s3(image_data, filename)

        db = SessionLocal()
        record = GeneratedImage(
            s3_url=image_url,
            input_prompt=req.prompt,
            adjusted_prompt=adjusted_prompt,
            steps=req.steps,
            width=req.width,
            height=req.height,
            style=req.style
        )
        db.add(record)
        db.commit()
        db.close()

        return GenerateImageResponse(image_url=image_url, adjusted_prompt=adjusted_prompt)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})
