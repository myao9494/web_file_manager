#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
file_service.py

フォルダ／ファイル取得処理をまとめたモジュール

※ .view_ignore の代わりに VIEW_IGNORE_PATTERNS で無視パターンを定義しています。
   高速な検索（Everything に近い感覚）を意識して、非同期処理（asyncio と ThreadPoolExecutor）およびキャッシュ（lru_cache）を活用しています。
"""

from pathlib import Path
import os
import re
import fnmatch
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from typing import Optional, List
from pydantic import BaseModel

# 結果のフォーマット（必要に応じて項目を追加）
class FileInfo(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: Optional[int] = None
    children_count: Optional[int] = None

# 無視パターン（.view_ignore の内容を直接記述）
VIEW_IGNORE_PATTERNS = [
    ".git/**",
    ".ipynb_checkpoints/**",
    "*.pyc",
    "__pycache__/**",
    ".env",
    ".venv",
    "env/",
    "venv/",
    ".vscode/",
    ".idea/",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
    "node_modules/",
    "*.tmp"
]

def compile_patterns(patterns: list) -> List:
    """
    各パターンをコンパイルし、(パターン種別, コンパイル済み正規表現) のリストとして返す。
    
    ・パターン末尾が '/**' の場合は、そのディレクトリ以下すべてにマッチする
    ・パターン末尾が '/' の場合は、ディレクトリ名にのみマッチする
    ・それ以外は、fnmatch.translate() によりファイル名用の正規表現に変換する
    """
    compiled = []
    for pattern in patterns:
        if pattern.endswith('/**'):
            compiled.append(('dir_all', re.compile(re.escape(pattern[:-3]))))
        elif pattern.endswith('/'):
            compiled.append(('dir', re.compile(r'(^|/)' + re.escape(pattern[:-1]) + r'(/|$)')))
        else:
            compiled.append(('file', re.compile(fnmatch.translate(pattern))))
    return compiled

# 予めパターンをコンパイルしておく
COMPILED_IGNORE_PATTERNS = compile_patterns(VIEW_IGNORE_PATTERNS)

def is_ignored(path: Path, project_root: Path) -> bool:
    """
    プロジェクトルートからの相対パスで無視パターンにマッチする場合、True を返す。
    """
    try:
        rel_path = str(path.relative_to(project_root))
        for pattern_type, pattern in COMPILED_IGNORE_PATTERNS:
            if pattern_type == 'dir_all':
                if pattern.search(rel_path):
                    return True
            elif pattern_type == 'dir':
                if pattern.search(rel_path):
                    return True
            elif pattern.match(rel_path):
                return True
        return False
    except Exception as e:
        logging.error(f"is_ignored でエラー: {path} - {e}")
        return False

@lru_cache(maxsize=1000)
def get_file_info_cached(path_str: str) -> dict:
    """
    ファイル情報の取得をディスクアクセスごとにキャッシュすることで高速化を図る。
    """
    p = Path(path_str)
    info = {
        "name": p.name,
        "path": str(p),
        "is_dir": p.is_dir(),
        "size": os.path.getsize(p) if p.is_file() else None,
        "children_count": len(list(p.iterdir())) if p.is_dir() else None
    }
    return info

# 並列実行用スレッドプール
thread_pool = ThreadPoolExecutor(max_workers=4)

async def process_item(item: Path, current_depth: int, max_depth: int, project_root: Path) -> List[FileInfo]:
    """
    個々のアイテム（ファイルまたはディレクトリ）を処理する。
    ディレクトリの場合、max_depth まで再帰的に中身を走査する。
    """
    try:
        results: List[FileInfo] = []
        loop = asyncio.get_running_loop()
        info = await loop.run_in_executor(thread_pool, get_file_info_cached, str(item))
        file_info = FileInfo(**info)
        results.append(file_info)

        if item.is_dir() and current_depth < max_depth:
            children = await process_directory(item, current_depth + 1, max_depth, project_root)
            results.extend(children)
        return results
    except Exception as e:
        logging.error(f"process_item でエラー: {item} - {e}")
        return []

async def process_directory(current_path: Path, current_depth: int, max_depth: int, project_root: Path) -> List[FileInfo]:
    """
    指定ディレクトリ内の全アイテムを、非同期に処理する。
    無視すべきアイテムは is_ignored() で除外する。
    """
    if current_depth > max_depth:
        return []
    try:
        items = [item for item in current_path.iterdir() if not is_ignored(item, project_root)]
        tasks = [process_item(item, current_depth, max_depth, project_root) for item in items]
        results = await asyncio.gather(*tasks)
        # ネストしたリストを平坦化する
        file_list: List[FileInfo] = [f for sublist in results for f in sublist]
        return file_list
    except Exception as e:
        logging.error(f"process_directory でエラー: {current_path} - {e}")
        return []

async def retrieve_files(root_path: Path, depth: int = 1) -> List[FileInfo]:
    """
    指定パス（ディレクトリまたはファイル）の情報を取得する。
    ・ディレクトリの場合は、その中身を depth まで再帰的に走査する。
    ・ファイルの場合は、ファイル情報のみを返す。
    
    project_root には、例として root_path の親を指定しています。必要に応じ調整してください。
    """
    project_root = root_path.parent
    if root_path.is_dir():
        return await process_directory(root_path, 1, depth, project_root)
    else:
        try:
            info = get_file_info_cached(str(root_path))
            return [FileInfo(**info)]
        except Exception as e:
            logging.error(f"retrieve_files でエラー: {root_path} - {e}")
            return [] 
