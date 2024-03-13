# ベースイメージ
FROM node:latest

# ワークディレクトリの設定
WORKDIR /app

# パッケージ.jsonとyarn.lockをコピー
# COPY package.json yarn.lock ./

# 依存関係のインストール
RUN yarn install


# ポート3000でアプリケーションを起動
EXPOSE 3000
CMD ["yarn", "dev"]