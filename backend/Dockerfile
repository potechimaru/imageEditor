# Dockerfile
FROM python:3.10

# 作業ディレクトリを作成
WORKDIR /app

# 依存ファイルコピー
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードコピー
COPY . .

# ポート開放
EXPOSE 8000

# Uvicornで起動
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
