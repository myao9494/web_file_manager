# ローカルファイル管理システム

ローカルディレクトリをブラウズし、ファイルやフォルダを管理するためのWebアプリケーション。

## 機能

- 📂 ファイル・フォルダの表示と管理
- 🔍 検索・フィルタリング機能
- 🖼 画像ファイル管理
- 📝 外部アプリケーション連携（VS Code, Jupyter Notebook）

## 技術スタック

- バックエンド: Python (FastAPI)
- フロントエンド: React
- 開発環境: Node.js, Python 3.8+

## セットアップ

### バックエンド

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### フロントエンド

```bash
cd frontend
npm install
npm start
```

## 開発者向け情報

- バックエンドは `localhost:8000` で動作
- フロントエンドは `localhost:3000` で動作
- API ドキュメントは `localhost:8000/docs` で確認可能
