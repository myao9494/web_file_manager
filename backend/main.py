#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
main.py

FastAPI アプリのメイン処理を記述。
file_service.py からファイル／フォルダ取得機能を利用し、/view_file エンドポイントなどを実装しています。
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import shutil
import subprocess
import asyncio
from time import time
import logging
from pydantic import BaseModel
from typing import List
import aiofiles

# file_service モジュールからインポート
from file_service import retrieve_files, FileInfo

app = FastAPI(title="ローカルファイル管理システム")

# CORS 設定（開発環境では全オリジンを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発環境では全てのオリジンを許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# リクエストパラメータ用のクラス
class RenameRequest(BaseModel):
    old_path: str
    new_path: str

class CreateFolderRequest(BaseModel):
    path: str

class DeleteItemsRequest(BaseModel):
    paths: List[str]

class MoveItemRequest(BaseModel):
    source_path: str
    destination_path: str

# view_file 用キャッシュ設定
file_cache: dict = {}
CACHE_TIMEOUT = 5  # 秒単位

@app.get("/view_file")
async def view_file(file_path: str, depth: int = 1, extensions: str = ""):
    """
    指定パスがディレクトリの場合、その中身を depth 階層まで取得する。
    ファイルの場合は、内容をテキストとして読み込み返す。
    キャッシュにより短時間の同一リクエストに対して高速応答します。

    Args:
        file_path (str): 対象のファイルまたはディレクトリのパス
        depth (int, optional): ディレクトリの探索深さ. デフォルトは1
        extensions (str, optional): プラス記号区切りの拡張子フィルタ (例: "txt+py"). デフォルトは空文字列（フィルタなし）
    """
    print(f"view_file called - path: {file_path}, depth: {depth}, extensions: {extensions}")
    try:
        path = Path(file_path)
        if not path.exists():
            raise HTTPException(status_code=404, detail="パスが見つかりません")

        # キャッシュ確認
        cache_key = f"{file_path}:{depth}:{extensions}"
        if cache_key in file_cache:
            cache_time, cache_data = file_cache[cache_key]
            if time() - cache_time < CACHE_TIMEOUT:
                return cache_data

        if path.is_dir():
            items = await retrieve_files(path, depth, extensions)
            file_cache[cache_key] = (time(), items)
            return items
        else:
            # ファイルの場合は非同期で内容を読み込む
            async with aiofiles.open(path, mode='r', encoding="utf-8") as f:
                content = await f.read()
                return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rename")
async def rename_item(request: RenameRequest):
    """
    指定されたパスをリネームします。
    """
    try:
        old_path = Path(request.old_path)
        new_path = Path(request.new_path)
        if not old_path.exists():
            raise HTTPException(status_code=404, detail="指定元パスが存在しません")
        old_path.rename(new_path)
        return {"message": "正常にリネームされました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-folder")
async def create_folder(request: CreateFolderRequest):
    """
    指定されたパスでフォルダを作成します。すでに存在する場合でもエラーとしません。
    """
    try:
        path = Path(request.path)
        path.mkdir(parents=True, exist_ok=True)
        return {"message": "フォルダが作成されました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/delete-items")
async def delete_items(request: DeleteItemsRequest):
    """
    指定された複数のパス（ファイル／フォルダ）を削除します。
    """
    try:
        for path_str in request.paths:
            path = Path(path_str)
            if path.is_dir():
                shutil.rmtree(path)
            else:
                path.unlink()
        return {"message": "対象アイテムを削除しました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/open-in-code")
async def open_in_code(file_path: str):
    """
    指定ファイルまたはフォルダを VS Code で開きます。
    """
    try:
        subprocess.Popen(["code", file_path])
        return {"message": "VS Code でオープンしました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/open-folder")
async def open_folder(folder_path: str):
    """
    指定フォルダを OS 標準の方法（Windows なら start, macOS なら open）で開きます。
    """
    try:
        if os.name == "nt":
            os.startfile(folder_path)
        else:
            subprocess.Popen(["open", folder_path])
        return {"message": "フォルダをオープンしました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/open-jupyter")
async def open_jupyter(file_path: str):
    """
    指定ファイルを Jupyter Notebook で開きます。
    """
    try:
        subprocess.Popen(["jupyter", "notebook", file_path])
        return {"message": "Jupyter Notebook でオープンしました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/move-item")
async def move_item(request: MoveItemRequest):
    """
    ファイルまたはフォルダを指定された場所に移動します。
    """
    try:
        source_path = Path(request.source_path)
        destination_path = Path(request.destination_path)
        
        if not source_path.exists():
            raise HTTPException(status_code=404, detail="移動元のパスが存在しません")
            
        # 移動先がディレクトリの場合は、そのディレクトリ内に移動
        if destination_path.is_dir():
            final_path = destination_path / source_path.name
        else:
            final_path = destination_path
            
        # 移動先に同名のファイルが存在する場合はエラー
        if final_path.exists():
            raise HTTPException(status_code=409, detail="移動先に同名のファイルが既に存在します")
            
        # 移動処理
        shutil.move(str(source_path), str(final_path))
        
        # 移動元と移動先のキャッシュをクリア
        source_dir = str(source_path.parent)
        dest_dir = str(destination_path if destination_path.is_dir() else destination_path.parent)
        
        # 関連するキャッシュを削除
        keys_to_remove = []
        for cache_key in file_cache.keys():
            path_part = cache_key.split(':', 1)[0]
            if path_part.startswith(source_dir) or path_part.startswith(dest_dir):
                keys_to_remove.append(cache_key)
        
        # キャッシュから削除
        for key in keys_to_remove:
            file_cache.pop(key, None)
            
        return {"message": "ファイルを移動しました", "new_path": str(final_path)}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("FastAPI サーバーを起動します...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)