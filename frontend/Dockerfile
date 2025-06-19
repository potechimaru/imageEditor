# 1. Node.js公式イメージ
FROM node:20.16.0

# 2. 作業ディレクトリをコンテナ内に作成
WORKDIR /app

# 3. 依存ファイルを先にコピーして、依存だけインストール
COPY package.json package-lock.json* ./

RUN npm install

# 4. プロジェクト全体をコピー
COPY . .

# 5. 開発時：開発サーバを起動
CMD ["npm", "run", "dev"]

# 6. ポートを開放（Next.jsのデフォルトポート）
EXPOSE 3000