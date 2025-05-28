import os
import base64
import uuid
import traceback
import httpx
import google.generativeai as genai

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# .envファイルの読み込み
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# FastAPIアプリの初期化
app = FastAPI()

# CORS設定（Next.jsなどと連携するため）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 画像保存先のフォルダを公開
app.mount("/images", StaticFiles(directory="images"), name="images")

# ============================
# モデル定義
# ============================

class GenerateImageRequest(BaseModel):
    prompt: str

class GenerateImageResponse(BaseModel):
    image_url: str

class AdjustPromptRequest(BaseModel):
    input_prompt: str

class AdjustPromptResponse(BaseModel):
    adjusted_prompt: str

# ============================
# 画像生成API
# ============================

STABLE_DIFFUSION_API = "http://127.0.0.1:7860"

@app.post("/api/generate_image", response_model=GenerateImageResponse)
async def generate_image(req: GenerateImageRequest):
    try:
        payload = {
            "prompt": req.prompt,
            "steps": 20,
            "width": 512,
            "height": 512,
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/txt2img", json=payload)
            result = response.json()

        if "images" not in result:
            return {
                "error": "WebUI returned invalid response",
                "raw_response": result
            }

        image_base64 = result["images"][0]
        image_data = base64.b64decode(image_base64)
        image_id = str(uuid.uuid4())
        filename = f"{image_id}.png"
        file_path = os.path.join("images", filename)

        with open(file_path, "wb") as f:
            f.write(image_data)

        image_url = f"http://localhost:8000/images/{filename}"
        return GenerateImageResponse(image_url=image_url)

    except Exception as e:
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }

# ============================
# プロンプト補正API（Gemini使用）
# ============================

@app.post("/api/adjust_prompt", response_model=AdjustPromptResponse)
async def adjust_prompt(req: AdjustPromptRequest):
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

        model = genai.GenerativeModel("models/gemini-1.5-flash")

        prompt = f"""
        Convert the following Japanese image description into a Stable Diffusion prompt (in English).
        Just return one short high-quality result. No options or extra commentary.

        Input: {req.input_prompt}
        """

        response = model.generate_content(prompt)
        result = response.text.strip()

        return AdjustPromptResponse(adjusted_prompt=result)

    except Exception as e:
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }

# ============================
# API
# ============================

@app.post("/api/full_generate", response_model=GenerateImageResponse)
async def full_generate(req: AdjustPromptRequest):
    try:
        # Geminiでプロンプト補正
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        gemini_prompt = f"""
        Convert the following Japanese image description into a Stable Diffusion prompt (in English).
        Just return one short high-quality result. No options or extra commentary.

        Input: {req.input_prompt}
        """
        gemini_response = model.generate_content(gemini_prompt)
        adjusted_prompt = gemini_response.text.strip()

        # Stable Diffusionで画像生成
        payload = {
            "prompt": adjusted_prompt,
            "steps": 20,
            "width": 512,
            "height": 512,
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/txt2img", json=payload)
            result = response.json()

        if "images" not in result:
            return {
                "error": "WebUI returned invalid response",
                "raw_response": result
            }

        image_base64 = result["images"][0]
        image_data = base64.b64decode(image_base64)
        image_id = str(uuid.uuid4())
        filename = f"{image_id}.png"
        file_path = os.path.join("images", filename)

        with open(file_path, "wb") as f:
            f.write(image_data)

        image_url = f"http://localhost:8000/images/{filename}"
        return GenerateImageResponse(image_url=image_url)

    except Exception as e:
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }
