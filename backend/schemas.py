from pydantic import BaseModel
from typing import Optional


# ▼ POST /api/full_generate に対応
class GenerateImageRequest(BaseModel):
    prompt: str
    steps: int
    width: int
    height: int
    style: str
    user_id: Optional[str] = None  # ユーザーIDはオプション


# ▼ POST /api/masked_full_generate に対応
class MaskedGenerateRequest(BaseModel):
    prompt: str
    original_base64: str
    mask_base64: str
    steps: int
    width: int
    height: int
    style: str
    user_id: Optional[str] = None


# ▼ POST /api/img2img_full_generate に対応
class Image2ImageGenerateRequest(BaseModel):
    prompt: str
    original_base64: str
    steps: int
    width: int
    height: int
    style: str
    user_id: Optional[str] = None


# ▼ 共通レスポンス用
class GenerateImageResponse(BaseModel):
    image_url: str
    adjusted_prompt: str


# ▼ DBへの保存用（POST時）
class ImageRecordCreate(BaseModel):
    image_url: str
    prompt: str
    user_id: Optional[str] = None


# ▼ GET /api/history, /api/users/{user_id}/images 用の返却形式
class ImageRecordOut(BaseModel):
    id: int
    image_url: str
    prompt: str
    user_id: Optional[str] = None

    class Config:
        from_attributes = True  # pydantic v2 の新構文（旧 orm_mode）

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True