import google.generativeai as genai
from dotenv import load_dotenv
import os
# APIキー設定
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=api_key)

model = genai.GenerativeModel("models/gemini-1.5-flash")  # または gemini-1.5-pro-latest

response = model.generate_content("Convert this to a stable diffusion prompt: かわいいネコが宇宙服を着ている")

print(response.text)
