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

## 使い方

### アプリを動かす

アプリは2つの部分からなります。両方を起動する必要があります。

#### バックエンド（データを管理する部分）

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0
```

#### フロントエンド（画面を表示する部分）

```bash
cd frontend
npm install
npm start
```

ブラウザが自動で開き、アプリが表示されます。

### 設定を変更する

`frontend/public/config.json` ファイルを編集して設定を変更できます：

```json
{
  "defaultPath": "最初に表示するフォルダのパス",
  "apiUrl": "バックエンドのURL"
}
```

- Windowsの場合は `C:\\Users\\username\\Documents` のように `\` を二重にします

## 詳しいドキュメント

さらに詳しい情報は、以下のドキュメントを参照してください：

- [ユーザーガイド](./docs/user_guide.md) - アプリの使い方
- [開発者ガイド](./docs/developer_guide.md) - アプリの仕組みと開発方法

## システムの仕組み

```mermaid
graph TD
    A[ブラウザ] <--> B[フロントエンド]
    B <--> C[バックエンド]
    C <--> D[パソコンのファイル]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style D fill:#fbb,stroke:#333,stroke-width:2px
```

## 技術情報

- バックエンド: Python (FastAPI)
- フロントエンド: React
- バックエンドは `localhost:8000` で動作
- フロントエンドは `localhost:3000` で動作
