## セットアップ（clone → 画面表示まで）

このプロジェクトは **Node.js + Express + Vite** と **PostgreSQL**（Drizzle ORM）で動きます。  
ローカルでは Docker で PostgreSQL を立てる手順が一番簡単です。

### 必要なもの
- **Node.js**: できれば **20系**
- **npm**
- **Docker Desktop**（WSL2 環境の場合は Docker Desktop を起動しておく）

#### Windows（WSL2）の場合の注意
- まず **WSL環境（例: Ubuntu）を起動**して、WSL上のターミナルを開いてください
- Docker Desktop を起動し、Settings の **WSL integration** を有効にしてください
- 以降のコマンドは **WSL上のターミナル**で実行します（Docker Desktop が起動していないと `docker` が失敗します）

Windows 側（PowerShell/コマンドプロンプト）から起動する例:

```bash
wsl
# もしくはディストリを指定する場合
wsl -d Ubuntu
```

### 1) clone

```bash
git clone https://github.com/toma0508/shift-manager.git
cd shift-manager
```

### 2) 依存関係インストール

```bash
npm install
```

### 3) PostgreSQL を起動（Docker）

```bash
docker run --name shift-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=shift_manager \
  -p 5432:5432 \
  -d postgres:16
```

すでに作成済みコンテナがある場合は:

```bash
docker start shift-pg
```

### 4) 環境変数を用意（.env）

プロジェクト直下に `.env` を作成します（`.env` は `.gitignore` 済み）。

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shift_manager
PORT=5000
```

### 5) DB スキーマ反映（初回必須）

```bash
npm run db:push
```

### 6) 開発サーバ起動

```bash
npm run dev
```

ブラウザで開く:
- `http://localhost:5000/`（トップ）
- `http://localhost:5000/admin`（管理画面）

---

## よくある詰まり

### DB接続エラーになる
- Docker の Postgres が起動しているか確認（`docker ps`）
- `DATABASE_URL` の **ホスト/ポート/ユーザー/パスワード**が合っているか確認

### UUID 生成でエラーになる場合
このプロジェクトは `gen_random_uuid()` を使うので、環境によっては拡張が必要です。

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```
