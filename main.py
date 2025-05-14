import os
import base64
import uuid
import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx

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

# Pydanticモデル定義
class GenerateImageRequest(BaseModel):
    prompt: str

class GenerateImageResponse(BaseModel):
    image_url: str

# Stable Diffusion WebUI API のURL
STABLE_DIFFUSION_API = "http://127.0.0.1:7860"

# 画像生成API
@app.post("/api/generate_image")
async def generate_image(req: GenerateImageRequest):
    try:
        # WebUIに送る画像生成のリクエストパラメータ
        payload = {
            "prompt": req.prompt,
            "steps": 20,
            "width": 512,
            "height": 512,
        }

        # タイムアウトを60秒に設定（CPUモード向け）
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/txt2img", json=payload)
            result = response.json()

        # 画像データが含まれていない場合はエラーレスポンスを返す
        if "images" not in result:
            return {
                "error": "WebUI returned invalid response",
                "raw_response": result
            }

        # base64画像データをデコードして保存
        image_base64 = result["images"][0]
        image_data = base64.b64decode(image_base64)
        image_id = str(uuid.uuid4())
        filename = f"{image_id}.png"
        file_path = os.path.join("images", filename)

        with open(file_path, "wb") as f:
            f.write(image_data)

        # アクセス可能なURLを返却
        image_url = f"http://localhost:8000/images/{filename}"
        return {"image_url": image_url}

    except Exception as e:
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }
