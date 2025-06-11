import os  # ファイルや環境変数を扱う標準ライブラリ
import base64  # 画像を文字列として扱うためにBase64エンコード、デコード
import uuid  # 画像ファイルに一意な名前をつけるために使用
import traceback  # エラー発生時の詳細な情報を取得
import httpx  # StableDiffusionWebUIへのリクエストに使う
import google.generativeai as genai  #プロンプト補正用GeminiAPI

from fastapi import FastAPI  # WebAPIを作る本体
from fastapi.middleware.cors import CORSMiddleware  # Next.jsなど別ドメインからのアクセスを許可する
from fastapi.staticfiles import StaticFiles  # 保存した画像などを公開
from fastapi.responses import JSONResponse  # エラー応答をJSONで返すため
from pydantic import BaseModel  # APIリクエスト、レスポンスのスキーマ定義に使用
from dotenv import load_dotenv  # .envファイルからAPIキーを読み込む

# .envファイルの読み込み
# .envにあるGEMINI_API_KEYを読み込んでGeminiを使えるようにする設定
#
#__file__: このPythonスクリプト自身のパスを指す特殊変数
#os.path.dirname(__file__): 現在のスクリプトがあるディレクトリのパスを取得
#os.path.join(..., ".env"): そのディレクトリの中にある.envファイルのフルパスを作る
#
# load_dotenv(dotenv_path)
# .envファイルに記載された環境変数（例：GEMINI_API_KEY=xxxx）を、Pythonの os.environ に読み込む
# コード内で os.getenv("GEMINI_API_KEY") のようにして取得できるようになる
#
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# os.getenv("GEMINI_API_KEY") で環境変数から API キーを取得
#genai.configure(...) を使って、そのAPIキーで Google Generative AI (Gemini) を使用できるように設定
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# FastAPIアプリの初期化
app = FastAPI()

# CORS設定（Next.jsなどと連携するため）

# FastAPI に ミドルウェア（中間処理） を追加するための関数。ここでは CORSMiddleware を追加している
#　CORSミドルウェアは、「他のオリジン（例：ポートが異なる）からのリクエストを許可するかどうか」を制御
#
# CORS = ブラウザのセキュリティ機能で、異なるオリジン（ドメイン、ポート、スキーム）間のリクエストを制御
#フロントエンド (http://localhost:3000) からバックエンド API (http://localhost:8000) にアクセス
#
#allow_credentials=True
# Cookie, 認証情報（セッション、トークンなど）をリクエストに含めることを許可
# withCredentials: true を含む fetch や axios リクエストが通るようになる
# セキュリティの観点で、これは allow_origins とセットで適切に設定する必要がある
# 
# allow_headers=["*"]
# すべての HTTP ヘッダー（Authorization, Content-Typeなど）を許可
# HTTPヘッダー = クライアント（ブラウザなど）とサーバーがHTTP通信をする際の「メタ情報」
# "*" は開発環境では便利、本番では限定した方が安全
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # 許可するオリジンを指定（複数指定したい場合はカンマでつなげる）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 画像保存先のフォルダを公開

#images フォルダ内の画像ファイルを、URLパス /images/... でアクセスできるようにする
#/images = ブラウザからアクセスするURLパスのプレフィックス
# StaticFiles(directory="images") = サーバーの images フォルダを静的ファイルとして提供
# name="images" = このマウントに付ける内部名
app.mount("/images", StaticFiles(directory="images"), name="images")

# ============================
# モデル定義
# ============================

# 通常画像生成の入力
class GenerateImageRequest(BaseModel):
    prompt: str
    steps: int
    width: int
    height: int
    style: str

# 全ての画像生成APIの返却形式：画像URLを返す
class GenerateImageResponse(BaseModel):
    image_url: str
    adjusted_prompt: str

# Geminiによるプロンプト補正の入力
class AdjustPromptRequest(BaseModel):
    input_prompt: str

# Gemini補正の返却内容：補正済み英語プロンプト
class AdjustPromptResponse(BaseModel):
    adjusted_prompt: str

# マスク付き生成の入力：base64形式の画像とプロンプト
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
# 画像生成API
# ============================

# FastAPI のルーティングデコレーター
# HTTP POST リクエストを /api/generate_image に受け付ける
# POSTは主に「データを送って処理・保存してほしい」というリクエストに使用。

# "/api/generate_image" = APIのエンドポイントURL
# フロントエンドからのリクエスト先が http://localhost:8000/api/generate_image になる

# response_model=GenerateImageResponse
# このエンドポイントのレスポンス（返却値）の形式を GenerateImageResponse として宣言
# 返ってくるJSONは常に {"image_url": "...URL..."} のような形式に強制される
@app.post("/api/generate_image", response_model=GenerateImageResponse)
# 内部で httpx.AsyncClient() を使って外部API（Stable Diffusion WebUI）に非同期リクエストを送るため、asyncである必要がある
# generate_image = 関数名
#
# req: GenerateImageRequest
# リクエストボディ（POSTデータ）を GenerateImageRequest 型で受け取る
# フロントエンドから送られるJSON形式↓
# {
#   "prompt": "a cute anime girl in blue dress"
# }
async def generate_image(req: GenerateImageRequest):
    try:
        # "sampler_name": "DPM++ 2M Karras" は、Stable Diffusion において画像を生成する際のサンプリング手法の指定をしている
        payload = {
            "prompt": req.prompt,
            "steps": req.steps,
            "width": req.width,
            "height": req.height,
            "sampler_name": "DPM++ 2M Karras"
        }

        # httpx.AsyncClient() は FastAPIと相性が良い 非同期HTTPクライアント（HTTPリクエストを送るためのオブジェクト)
        # with は Python のコンテキストマネージャ
        # リクエスト終了後に 自動でクライアントを閉じてくれる（リソースリーク防止)
        # timeout=httpx.Timeout(300.0) により、リクエストのタイムアウト時間を 最大300秒（5分） に設定
        async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
            # f"{STABLE_DIFFUSION_API}/sdapi/v1/txt2img" は Stable Diffusion WebUI の画像生成エンドポイント
            # json=payload によって、前段で作成したプロンプトなどの生成条件を送信
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/txt2img", json=payload)
            # response オブジェクト（HTTPレスポンス）を .json() でパースして、Pythonの辞書型（dict）に変換
            result = response.json()

            #↓こんな構造が得られる
            #
            # {
            # "images": [
            #     "iVBORw0KGgoAAAANSUhEUgAA..."
            # ],
            # "parameters": {
            #     "prompt": "A cute anime girl...",
            #     ...
            # },
            # ...
            # }

        # httpx.AsyncClient
        #     ↓
        # POSTリクエスト (payload付き)
        #     ↓
        # Stable Diffusion WebUI が画像生成
        #     ↓
        # Base64形式の画像付きレスポンスが返る
        #     ↓
        # JSON形式でresultに格納される

        # "images" キーがなければ画像が生成されていない、もしくはAPIの返答が異常であると判断できる
        # status_code=500：内部サーバーエラーを示す HTTP ステータス
        # content : フロントエンドでデバッグしやすいように、
        # "error" にエラー内容の説明、
        # "raw_response" に実際に返ってきた result を含める
        if "images" not in result:
            return JSONResponse(status_code=500, content={ "error": "WebUI returned invalid response", "raw_response": result })

        # Stable Diffusion WebUI から返ってきた Base64 形式の画像データを、バイナリの画像データに変換
        #
        # 1枚目の画像 ([0]) を取り出して、image_base64 に代入
        # base64.b64decode(...) 
        # image_base64 のような「Base64文字列」→「元のバイナリ（画像）」に復元
        # image_data は、実際のPNGファイルなどの生の画像データになる
        image_base64 = result["images"][0]
        image_data = base64.b64decode(image_base64)

        # filename = f"{uuid.uuid4()}.png"
        # 重複しないファイル名を生成して .png 形式で保存するための文字列を作っている
        # uuid.uuid4() : 「ランダムなUUID」を生成
        #
        # file_path = os.path.join("images", filename)
        # 保存先のディレクトリ "images" に対して、生成したファイル名を結合し、絶対または相対パスとして有効なパス文字列を作成
        # 結果例↓
        # file_path = "images/d5e68b50-b2a2-498b-8429-913dd5f75f7f.png"
        filename = f"{uuid.uuid4()}.png"
        file_path = os.path.join("images", filename)

        # with = コンテキストマネージャ。ファイルの自動クローズ処理を保証する
        # wb = バイナリファイルを書き込む
        # ファイルオブジェクトを変数 f に代入
        with open(file_path, "wb") as f:
            f.write(image_data)

        # image_url = f"http://localhost:8000/images/{filename}"
        # 保存した画像をWebブラウザやNext.jsフロントエンドから取得できるURLを構築
        image_url = f"http://localhost:8000/images/{filename}"
        return GenerateImageResponse(image_url=image_url)

    # Exception はすべての標準的な例外の親クラス
    # as e によって発生した例外インスタンスを e で受け取る
    # traceback 情報は 開発中は便利だが、本番環境ではセキュリティ上の理由で含めない方が良い
    except Exception as e:
        return JSONResponse(status_code=500, content={ "error": str(e), "trace": traceback.format_exc() })

# ============================
# マスク付き画像生成API
# ============================

@app.post("/api/masked_generate", response_model=GenerateImageResponse)
async def masked_generate(req: MaskedGenerateRequest):
    try:
        # 画像データの取得（base64形式）
        original_image = req.original_base64
        mask_image = req.mask_base64

        payload = {
            "prompt": req.prompt,
            "init_images": [original_image],
            "mask": mask_image,
            "inpainting_fill": 1,  # 1: original（塗りつぶしなし）
            "steps": 20,
            "width": 512,
            "height": 768,
            "sampler_name": "DPM++ 2M Karras",
            "denoising_strength": 0.75  # 元画像に対する変更の強さ
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/img2img", json=payload)
            result = response.json()

        if "images" not in result:
            return JSONResponse(status_code=500, content={"error": "WebUI returned invalid response", "raw_response": result})

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        file_path = os.path.join("images", filename)

        with open(file_path, "wb") as f:
            f.write(image_data)

        image_url = f"http://localhost:8000/images/{filename}"
        return GenerateImageResponse(image_url=image_url)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})


# ============================
# プロンプト補正API
# ============================

@app.post("/api/adjust_prompt", response_model=AdjustPromptResponse)
async def adjust_prompt(req: AdjustPromptRequest):
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        Convert the following Japanese image description into a short, high-quality prompt in English for Stable Diffusion XL using the AnythingXL model.
        The style should reflect: {req.style}.
        Focus on high-resolution illustration quality, clean composition, vivid colors, and natural facial detail. Return only the refined prompt.

        Input: {req.prompt}
        """ # """ ... """を使うと複数行の文字列を定義できる
        
        response = model.generate_content(prompt)
        result = response.text.strip() #  文字列の先頭と末尾から空白や改行文字などの不要な「空白系文字」を取り除く

        return AdjustPromptResponse(adjusted_prompt=result)

    except Exception as e:
        return JSONResponse(status_code=500, content={ "error": str(e), "trace": traceback.format_exc() })

# ============================
# 通常画像生成API（Geminiプロンプト補正付き）
# ============================

@app.post("/api/full_generate", response_model=GenerateImageResponse)
async def full_generate(req: GenerateImageRequest):
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        You are an expert in generating prompts for Stable Diffusion XL, using the AnythingXL model.

        Convert the following Japanese image description into a high-quality English prompt for the img2img task.
        Make the output a comma-separated list of visual tags and keywords (no full sentences).
        Use the AnythingXL tag style (e.g., "1girl, long hair, blue eyes, school uniform, dynamic pose, masterpiece, high resolution").

        Reflect the following style: {req.style}, fully rendered, complete, high quality
        Keep structure and composition consistent with the input image.

        Return only the comma-separated prompt, no extra explanation.

        Input: {req.prompt}
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
            return JSONResponse(status_code=500, content={ "error": "WebUI returned invalid response", "raw_response": result })

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        file_path = os.path.join("images", filename)

        with open(file_path, "wb") as f:
            f.write(image_data)

        image_url = f"http://localhost:8000/images/{filename}"
        return GenerateImageResponse(image_url=image_url, adjusted_prompt=adjusted_prompt)

    except Exception as e:
        return JSONResponse(status_code=500, content={ "error": str(e), "trace": traceback.format_exc() })

# ============================
# マスク付き画像生成API（Geminiプロンプト補正付き）
# ============================

@app.post("/api/masked_full_generate", response_model=GenerateImageResponse)
async def masked_full_generate(req: MaskedGenerateRequest):
    try:
        # Gemini によるプロンプト補正
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        Convert the following Japanese image description into a short, high-quality English prompt for img2img generation using the AnythingXL model in Stable Diffusion XL.

        The output prompt should reflect the following artistic style: {req.style}, fully rendered, polished details, no unfinished parts, complete, high quality, consistent lighting
        Make sure the prompt is suitable for transforming an existing image with a mask (img2img inpainting task).
        Focus on detailed facial features, consistent composition, and high resolution.

        Return only the refined prompt text.
        Input: {req.prompt}
        """
        gemini_response = model.generate_content(prompt)
        adjusted_prompt = gemini_response.text.strip()

        # 画像データの取得（base64形式）
        original_image = req.original_base64
        mask_image = req.mask_base64

        payload = {
            "prompt": adjusted_prompt,
            "init_images": [original_image],
            "mask": mask_image,
            "inpainting_fill": 1,
            "steps": req.steps,
            "width": req.width,
            "height": req.height,
            "sampler_name": "DPM++ 2M Karras",
            "denoising_strength": 0.35,  # より元画像保持
            "inpaint_full_res": True,  # 画像全体の解像度でマスク部を処理
            "inpaint_full_res_padding": 32
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/img2img", json=payload)
            result = response.json()

        if "images" not in result:
            return JSONResponse(status_code=500, content={"error": "WebUI returned invalid response", "raw_response": result})

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        file_path = os.path.join("images", filename)

        with open(file_path, "wb") as f:
            f.write(image_data)

        image_url = f"http://localhost:8000/images/{filename}"
        return GenerateImageResponse(image_url=image_url, adjusted_prompt=adjusted_prompt)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})

# ============================
# img2img変換（マスクなし・Gemini補正付き）
# ============================

@app.post("/api/img2img_full_generate", response_model=GenerateImageResponse)
async def img2img_full_generate(req: Image2ImageGenerateRequest):  # MaskedGenerateRequestをそのまま使います
    try:
        # Geminiによるプロンプト補正
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        prompt = f"""
        You are an expert in generating prompts for Stable Diffusion XL, using the AnythingXL model.

        Convert the following Japanese image description into a high-quality English prompt for the img2img task.
        Make the output a comma-separated list of visual tags and keywords (no full sentences).
        Use the AnythingXL tag style (e.g., "1girl, long hair, blue eyes, school uniform, dynamic pose, masterpiece, high resolution").

        Reflect the following style: {req.style}.
        Keep structure and composition consistent with the input image.

        Return only the comma-separated prompt, no extra explanation.

        Input: {req.prompt}
        """
        gemini_response = model.generate_content(prompt)
        adjusted_prompt = gemini_response.text.strip()

        # img2img生成リクエスト（maskなし）
        payload = {
            "prompt": adjusted_prompt,
            "init_images": [req.original_base64],  # base64文字列
            "steps": req.steps,
            "width": req.width,
            "height": req.height,
            "sampler_name": "DPM++ 2M Karras",
            "denoising_strength": 0.6,
            "inpainting_fill": 1  # img2imgでもこのフィールドが必要な場合あり
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0)) as client:
            response = await client.post(f"{STABLE_DIFFUSION_API}/sdapi/v1/img2img", json=payload)
            result = response.json()

        if "images" not in result:
            return JSONResponse(status_code=500, content={"error": "WebUI returned invalid response", "raw_response": result})

        image_data = base64.b64decode(result["images"][0])
        filename = f"{uuid.uuid4()}.png"
        file_path = os.path.join("images", filename)
        with open(file_path, "wb") as f:
            f.write(image_data)

        image_url = f"http://localhost:8000/images/{filename}"
        return GenerateImageResponse(image_url=image_url, adjusted_prompt=adjusted_prompt)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})